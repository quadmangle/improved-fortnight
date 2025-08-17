(function(){
  const WORKER_CHAT_URL = 'https://your-cloudflare-worker.example.com/chat';
  const WORKER_END_SESSION_URL = 'https://your-cloudflare-worker.example.com/end-session';
  const WORKER_HONEYPOT_URL = 'https://your-cloudflare-worker.example.com/honeypot-trip';
  const INACTIVITY_LIMIT_MS = window.CHATBOT_INACTIVITY_MS || 120000;
  let container, log, form, input, send, closeBtn, minimizeBtn, openBtn;
  let langCtrl, themeCtrl, brand, hpText, hpCheck;
  let hCaptchaWidgetID; // To store the ID of the invisible hCaptcha widget
  let outsideClickHandler, escKeyHandler, inactivityTimer;
  function resetInactivityTimer(){
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(()=>{ closeChat(); }, INACTIVITY_LIMIT_MS);
  }

  function buildBrand(text){
    brand.innerHTML='';
    let i=0;
    for(const ch of text){
      const span=document.createElement('span');
      span.className='char';
      span.textContent=ch;
      span.style.setProperty('--i', String(i++));
      brand.appendChild(span);
    }
  }

  function addMsg(txt, cls){
    const div=document.createElement('div');
    div.className='chat-msg '+cls;
    div.textContent=txt;
    log.appendChild(div);
    log.scrollTop=log.scrollHeight;
  }

  function saveHistory(){
    if(!log) return;
    const msgs=[...log.querySelectorAll('.chat-msg')].map(m=>({
      cls:m.className.replace('chat-msg','').trim(),
      txt:m.textContent
    }));
    try{ sessionStorage.setItem('chatHistory', JSON.stringify(msgs)); }catch(e){}
  }

  function loadHistory(){
    try{
      const data=sessionStorage.getItem('chatHistory');
      if(!data) return;
      const msgs=JSON.parse(data);
      msgs.forEach(m=>addMsg(m.txt, m.cls));
    }catch(e){ sessionStorage.removeItem('chatHistory'); }
  }

  async function reportHoneypot(reason){
    try{
      await fetch(WORKER_HONEYPOT_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ reason, ts: Date.now(), ua: navigator.userAgent })
      });
    }catch(e){}
  }
  function lockUIForHoneypot(){
    send.disabled=true;
    input.disabled=true;
    addMsg('Security: blocked due to suspicious activity.', 'bot');
    alert('Security check failed. This session has been blocked.');
  }

  function updateSendEnabled(){
    if(!send || !input) return;
    const hasText = input.value.trim().length > 0;
    send.disabled = !hasText || input.disabled;
  }

  function autoGrow(){
    input.style.height='auto';
    const maxPx=48;
    input.style.height=Math.min(input.scrollHeight, maxPx)+'px';
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (hpText.value.trim() !== '' || hpCheck.checked) {
      reportHoneypot('honeypot_on_submit').then(lockUIForHoneypot);
      return;
    }
    const msg = input.value.trim();
    if (!msg) {
      updateSendEnabled();
      return;
    }

    addMsg(msg, 'user');
    input.value = '';
    autoGrow();
    updateSendEnabled();
    addMsg('…', 'bot');
    const botMsgElement = log.lastChild;
    const onHcaptchaSuccess = (token) => {
      fetch(WORKER_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, 'h-captcha-response': token }),
      })
        .then((r) => r.json())
        .then((d) => {
          botMsgElement.textContent = d.reply || 'No reply.';
          saveHistory();
        })
        .catch(() => {
          botMsgElement.textContent = 'Error: Can’t reach AI.';
          saveHistory();
        });
    };

    const onHcaptchaClose = () => {
      botMsgElement.textContent = 'Security check cancelled.';
      saveHistory();
    };

    // Execute hCaptcha
    if (window.hcaptcha && hCaptchaWidgetID) {
      try {
        window.hcaptcha.execute(hCaptchaWidgetID, {
          callback: onHcaptchaSuccess,
          'error-callback': onHcaptchaClose,
          'close-callback': onHcaptchaClose,
        });
      } catch (error) {
        console.error("hCaptcha execution error:", error);
        onHcaptchaClose();
      }
    } else {
      botMsgElement.textContent = 'Error: Could not initialize security check.';
      saveHistory();
    }
  }

  async function terminateSession(){
    try{ await fetch(WORKER_END_SESSION_URL, { method:'POST' }); }catch(e){}
  }

  function clearUIState(){
    log.innerHTML='';
    input.value='';
    autoGrow();
    updateSendEnabled();
    sessionStorage.removeItem('chatHistory');
  }

  function openChat(){
    clearTimeout(inactivityTimer);
    container.style.display='';
    container.removeAttribute('aria-hidden');
    openBtn.style.display='none';
    openBtn.classList.remove('chatbot-reopen');
    openBtn.style.bottom='';
    openBtn.style.right='';
    openBtn.setAttribute('aria-expanded','true');
    openBtn.removeEventListener('click', openChat);
    sessionStorage.setItem('chatState','open');
  }

  function positionOpenBtn(){
    if(!openBtn) return;
    const fabMain=document.querySelector('.fab-main');
    const fabContainer=fabMain?fabMain.closest('.fab-container'):null;
    if(fabMain && fabContainer){
      const fabStyles=window.getComputedStyle(fabContainer);
      const fabBottom=parseInt(fabStyles.bottom,10)||0;
      const fabRight=parseInt(fabStyles.right,10)||0;
      const fabHeight=parseInt(window.getComputedStyle(fabMain).height,10)||0;
      const fabWidth=parseInt(window.getComputedStyle(fabMain).width,10)||0;
      const btnWidth=parseInt(window.getComputedStyle(openBtn).width,10)||0;
      openBtn.style.bottom=`${fabBottom + fabHeight + 10}px`;
      openBtn.style.right=`${fabRight + (fabWidth - btnWidth) / 2}px`;
    }
  }

  function minimizeChat(){
    saveHistory();
    container.style.display='none';
    container.setAttribute('aria-hidden','true');
    openBtn.style.display='inline-flex';
    openBtn.innerHTML = 'CHAT';
    openBtn.classList.add('chatbot-reopen');
    openBtn.setAttribute('aria-expanded','false');
    openBtn.addEventListener('click', openChat, { once:true });
    sessionStorage.setItem('chatState','minimized');
    positionOpenBtn();
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(closeChat, INACTIVITY_LIMIT_MS);
  }

  function closeChat(){
    clearTimeout(inactivityTimer);
    clearUIState();
    sessionStorage.removeItem('chatState');
    terminateSession();
    document.removeEventListener('click', outsideClickHandler);
    document.removeEventListener('keydown', escKeyHandler);
    container.remove();
    if (openBtn && openBtn.remove) {
      openBtn.remove();
    }
    openBtn = null;
  }

  function initChatbot(){
    const qs = s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
    container = qs('#chatbot-container');
    if(!container) return;
    if (window.appUtils && window.appUtils.makeDraggable && window.innerWidth >= 768) {
      window.appUtils.makeDraggable(container);
      document.body.classList.add('drag-enabled');
    } else {
      document.body.classList.remove('drag-enabled');
    }
    log = qs('#chat-log');
    form = qs('#chatbot-input-grid');
    input = qs('#chatbot-input');
    send = qs('#chatbot-send');
    closeBtn = qs('#chatbot-close');
    minimizeBtn = qs('#minimizeBtn');
    openBtn = qs('#chat-open-btn');
    langCtrl = qs('#langCtrl');
    themeCtrl = qs('#themeCtrl');
    brand = qs('#brand');
    hpText = qs('#hp_text');
    hpCheck = qs('#hp_check');
    const transNodes = qsa('[data-en]');
    const phNodes = qsa('[data-en-ph]');

    buildBrand(brand.dataset.en || 'Ops Online Support');
    langCtrl.textContent='ES';
    langCtrl.addEventListener('click', ()=>{
      const goES = langCtrl.textContent === 'ES';
      document.documentElement.lang = goES ? 'es' : 'en';
      langCtrl.textContent = goES ? 'EN' : 'ES';
      transNodes.forEach(n => n.textContent = goES ? (n.dataset.es || n.textContent) : (n.dataset.en || n.textContent));
      phNodes.forEach(n => n.placeholder = goES ? (n.dataset.esPh || n.placeholder) : (n.dataset.enPh || n.placeholder));
      buildBrand(goES ? (brand.dataset.es || 'Soporte en Línea OPS') : (brand.dataset.en || 'Ops Online Support'));
    });
    themeCtrl.addEventListener('click', ()=>{
      const toDark = themeCtrl.textContent === 'Dark';
      document.body.classList.toggle('dark', toDark);
      themeCtrl.textContent = toDark ? 'Light' : 'Dark';
    });

    input.addEventListener('input', ()=>{ autoGrow(); updateSendEnabled(); });
    input.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); if(!send.disabled) form.requestSubmit(); }});
    window.addEventListener('load', ()=>{ autoGrow(); updateSendEnabled(); });

    form.addEventListener('submit', handleSubmit);
    minimizeBtn.addEventListener('click', minimizeChat);
    closeBtn.addEventListener('click', closeChat);

    escKeyHandler = (e)=>{
      if(e.key === 'Escape'){
        closeChat();
      }
    };
    outsideClickHandler = (e)=>{
      if(
        container.style.display !== 'none' &&
        !container.contains(e.target) &&
        e.target !== openBtn
      ){
        minimizeChat();
      }
    };
    document.addEventListener('keydown', escKeyHandler);
    document.addEventListener('click', outsideClickHandler);
    ['change','input','click'].forEach(ev=>{
      hpText.addEventListener(ev, ()=>{ reportHoneypot('hp_text_touched'); lockUIForHoneypot(); }, { passive:true });
      hpCheck.addEventListener(ev, ()=>{ reportHoneypot('hp_check_ticked'); lockUIForHoneypot(); }, { passive:true });
    });

    // Start with chat hidden until the user explicitly opens it.
    container.style.display = 'none';
    container.setAttribute('aria-hidden', 'true');
    openBtn.style.display = 'none';
    openBtn.setAttribute('aria-expanded', 'false');
    loadHistory();
    renderHcaptcha();
    window.addEventListener('beforeunload', saveHistory);
  }

  function renderHcaptcha() {
    const captchaDiv = document.getElementById('chatbot-hcaptcha');
    if (captchaDiv && window.hcaptcha && typeof window.hcaptcha.render === 'function') {
      hCaptchaWidgetID = window.hcaptcha.render(captchaDiv, {
        sitekey: '10000000-ffff-ffff-ffff-000000000001', // Test key
        size: 'invisible',
      });
    } else {
      // If hcaptcha API isn't ready, try again shortly.
      setTimeout(renderHcaptcha, 500);
    }
  }

  async function reloadChat(){
    try{
      // Remove any existing FAB or chatbot fragment before reloading to avoid
      // background overlays or duplicate floating buttons.
      if(openBtn && typeof openBtn.remove === 'function'){
        openBtn.remove();
        openBtn = null;
      }
      const existing = document.getElementById('chatbot-container');
      if(existing && typeof existing.remove === 'function'){
        existing.remove();
      }

      const res = await fetch('fabs/chatbot.html', { credentials:'same-origin' });
      const html = await res.text();
      const template = document.createElement('template');
      template.innerHTML = html;
      const frag = template.content;
      document.body.appendChild(frag);
      initChatbot();
      const state = sessionStorage.getItem('chatState');
      if(state === 'open'){
        openChat();
      }else if(state === 'minimized'){
        openBtn.style.display='inline-flex';
        openBtn.innerHTML = 'CHAT';
        openBtn.classList.add('chatbot-reopen');
        openBtn.setAttribute('aria-expanded','false');
        openBtn.addEventListener('click', openChat, { once:true });
        positionOpenBtn();
      }
    }catch(err){
      console.error('Failed to reload chatbot:', err);
    }
  }

  window.reloadChat = reloadChat;
  window.initChatbot = initChatbot;
  window.cleanupChatbot = closeChat;
  window.openChatbot = openChat;
  if (sessionStorage.getItem('chatState')) {
    window.addEventListener('DOMContentLoaded', () => { reloadChat(); });
  }
})();
