(function(){
  const WORKER_CHAT_URL = 'https://your-cloudflare-worker.example.com/chat';
  const WORKER_END_SESSION_URL = 'https://your-cloudflare-worker.example.com/end-session';
  const WORKER_HONEYPOT_URL = 'https://your-cloudflare-worker.example.com/honeypot-trip';
  const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_SITE_KEY';

  let container, log, form, input, send, closeBtn, minimizeBtn, openBtn;
  let langCtrl, themeCtrl, brand, hpText, hpCheck;
  let recaptchaReady = false;

  function loadRecaptcha(){
    if(document.getElementById('recaptcha-script')) return;
    const s=document.createElement('script');
    s.id='recaptcha-script';
    s.src=`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    s.async=true; s.defer=true;
    s.onload=()=>{
      if(window.grecaptcha && window.grecaptcha.ready){
        window.grecaptcha.ready(()=>{ recaptchaReady = true; updateSendEnabled(); });
      }
    };
    document.head.appendChild(s);
  }

  async function getRecaptchaToken(action){
    if(!(window.grecaptcha && recaptchaReady)) throw new Error('reCAPTCHA not ready');
    return grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
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

  async function handleSubmit(e){
    e.preventDefault();
    if(hpText.value.trim() !== '' || hpCheck.checked){
      await reportHoneypot('honeypot_on_submit');
      lockUIForHoneypot();
      return;
    }
    const msg = input.value.trim();
    if(!msg){ updateSendEnabled(); return; }
    addMsg(msg,'user');
    input.value=''; autoGrow(); updateSendEnabled();
    addMsg('…','bot');
    let token='';
    try{
      token = await getRecaptchaToken('chat_send');
    }catch(err){
      log.lastChild.textContent = 'Security: reCAPTCHA unavailable. Try again later.';
      return;
    }
    try{
      const r = await fetch(WORKER_CHAT_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: msg, recaptchaToken: token })
      });
      const d = await r.json();
      log.lastChild.textContent = d.reply || 'No reply.';
    }catch{
      log.lastChild.textContent = 'Error: Can’t reach AI.';
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
  }

  function openChat(){
    container.style.display='';
    container.removeAttribute('aria-hidden');
    openBtn.style.display='none';
    openBtn.setAttribute('aria-expanded','true');
    openBtn.removeEventListener('click', reloadChat);
    openBtn.removeEventListener('click', openChat);
  }

  function minimizeChat(){
    container.style.display='none';
    container.setAttribute('aria-hidden','true');
    openBtn.style.display='inline-flex';
    openBtn.setAttribute('aria-expanded','false');
    openBtn.removeEventListener('click', reloadChat);
    openBtn.addEventListener('click', openChat, { once:true });
  }

  function closeChat(){
    clearUIState();
    terminateSession();
    container.remove();
    openBtn.style.display='inline-flex';
    openBtn.setAttribute('aria-expanded','false');
    openBtn.removeEventListener('click', openChat);
    openBtn.addEventListener('click', ()=>{ reloadChat(); }, { once:true });
  }

  function initChatbot(){
    const qs = s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
    container = qs('#chatbot-container');
    if(!container) return;
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

    ['change','input','click'].forEach(ev=>{
      hpText.addEventListener(ev, ()=>{ reportHoneypot('hp_text_touched'); lockUIForHoneypot(); }, { passive:true });
      hpCheck.addEventListener(ev, ()=>{ reportHoneypot('hp_check_ticked'); lockUIForHoneypot(); }, { passive:true });
    });

    loadRecaptcha();
  }

  async function reloadChat(){
    try{
      const res = await fetch('fabs/chatbot.html', { credentials:'same-origin' });
      const html = await res.text();
      const template = document.createElement('template');
      template.innerHTML = html;
      const frag = template.content;
      document.body.appendChild(frag);
      initChatbot();
    }catch(err){
      console.error('Failed to reload chatbot:', err);
    }
  }

  window.reloadChat = reloadChat;
  window.initChatbot = initChatbot;
  window.addEventListener('load', reloadChat);
})();
