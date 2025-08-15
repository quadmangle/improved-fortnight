(function(){
  let langCtrl, themeCtrl, log, form, input, send, exitBtn;
  let minimizeBtn, openBtn, container, header, inactivityTimer, recaptchaId;
  let langHandler, themeHandler, formHandler, minimizeHandler, openHandler, escHandler, outsideClickHandler;

  async function reloadChat(){
    try{
      const res = await fetch('fabs/chatbot.html', { credentials:'same-origin' });
      const html = await res.text();
      const template = document.createElement('template');
      template.innerHTML = html;
      const newContainer = template.content.querySelector('#chatbot-container');
      if(newContainer){ document.body.appendChild(newContainer); }
      window.initChatbot();
    }catch(err){
      console.error('Failed to reload chatbot:', err);
    }
  }

  function initChatbot(){
    const qs = s => document.querySelector(s),
          qsa = s => [...document.querySelectorAll(s)];
    const root = document.documentElement;
    container = qs('#chatbot-container');
    if (!container) return;
    header = qs('#chatbot-header');
    log = qs('#chat-log');
    form = qs('#chatbot-input-grid');
    input = qs('#chatbot-input');
    send = qs('#chatbot-send');
    exitBtn = qs('#chatbot-exit');
    langCtrl = qs('#langCtrl');
    themeCtrl = qs('#themeCtrl');
    minimizeBtn = qs('#minimizeBtn');
    openBtn = qs('#chat-open-btn');
    if(openBtn){ openBtn.removeEventListener('click', reloadChat); }
    const brand = document.getElementById('brand');
    const transNodes = qsa('[data-en]');
    const phNodes = qsa('[data-en-ph]');
    const guard = qs('#human-check');
    if(window.grecaptcha && document.getElementById('recaptcha-container')){
      recaptchaId = window.grecaptcha.render('recaptcha-container', {
        sitekey: 'YOUR_RECAPTCHA_SITE_KEY', // TODO: replace with real site key
        size: 'invisible'
      });
    }

    function buildBrand(text){
      brand.innerHTML='';
      let idx=0;
      for(const ch of text){
        const span=document.createElement('span');
        span.className='char';
        span.textContent=ch;
        span.style.setProperty('--i', String(idx++));
        brand.appendChild(span);
      }
    }
    buildBrand(brand.dataset.en || 'Ops Online Support');

    langCtrl.textContent='ES';
    langHandler = () => {
      const goES = langCtrl.textContent === 'ES';
      document.documentElement.lang = goES ? 'es' : 'en';
      langCtrl.textContent = goES ? 'EN' : 'ES';
      transNodes.forEach(n => n.textContent = goES ? (n.dataset.es || n.textContent) : (n.dataset.en || n.textContent));
      phNodes.forEach(n => n.placeholder = goES ? (n.dataset.esPh || n.placeholder) : (n.dataset.enPh || n.placeholder));
      buildBrand(goES ? (brand.dataset.es || 'Soporte en Línea OPS') : (brand.dataset.en || 'Ops Online Support'));
    };
    langCtrl.addEventListener('click', langHandler);

    themeHandler = () => {
      const toDark = themeCtrl.textContent === 'Dark';
      document.body.classList.toggle('dark', toDark);
      themeCtrl.textContent = toDark ? 'Light' : 'Dark';
    };
    themeCtrl.addEventListener('click', themeHandler);

    // Honeypot checkbox – triggers alert and terminates session if checked
    if(guard){
      guard.addEventListener('change', ()=>{
        if(guard.checked){
          alert('Bot activity detected.');
          fetch('https://your-cloudflare-worker.example.com/bot-trap', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ trap: 'human-check' })
          }).catch(()=>{});
          endSession();
        }
      });
    }

    function autoGrow(){
      input.style.height='auto';
      const maxPx=48;
      input.style.height=Math.min(input.scrollHeight, maxPx)+'px';
    }
    input.addEventListener('input', autoGrow);
    window.addEventListener('load', autoGrow);
    input.addEventListener('keydown', e => {
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });

    function addMsg(txt, cls){
      const div=document.createElement('div');
      div.className='chat-msg '+cls;
      div.textContent=txt;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }

    formHandler = async e => {
      e.preventDefault();
      if(guard && guard.checked){
        return;
      }
      const msg = input.value.trim();
      if(!msg) return;
      addMsg(msg,'user');
      input.value=''; autoGrow(); send.disabled=true;
      addMsg('…','bot');
      try{
        if(window.grecaptcha && typeof window.grecaptcha.execute === 'function' && typeof recaptchaId !== 'undefined'){
          await window.grecaptcha.execute(recaptchaId);
          window.grecaptcha.reset(recaptchaId);
        }
        const r = await fetch('https://your-cloudflare-worker.example.com/chat',{
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ message: msg })
        });
        const d = await r.json();
        log.lastChild.textContent = d.reply || 'No reply.';
      }catch{
        log.lastChild.textContent = 'Error: Can’t reach AI.';
      }finally{
        send.disabled=false;
        scheduleInactivity();
      }
    };
    form.addEventListener('submit', formHandler);
    if(exitBtn) exitBtn.addEventListener('click', endSession);
    escHandler = e => { if(e.key === 'Escape') endSession(); };
    document.addEventListener('keydown', escHandler);
    outsideClickHandler = e => {
      if(container && container.style.display !== 'none' && !container.contains(e.target) && e.target !== openBtn) {
        endSession();
      }
    };
    document.addEventListener('click', outsideClickHandler);

    let inputFocused=false;
    function applyKeyboardMode(isOpen){
      document.body.classList.toggle('kb-open', !!isOpen);
      if(isOpen){ setTimeout(()=> input.scrollIntoView({ block:'nearest', behavior:'smooth' }), 50); }
    }
    function handleViewportChange(){
      const vv = window.visualViewport;
      if(vv){
        const keyboardLikelyOpen = inputFocused && (vv.height < window.innerHeight * 0.85);
        applyKeyboardMode(keyboardLikelyOpen);
      }else{
        const keyboardLikelyOpen = inputFocused && (window.innerHeight < screen.height * 0.85);
        applyKeyboardMode(keyboardLikelyOpen);
      }
    }
    let rAF; function onResize(){ cancelAnimationFrame(rAF); rAF = requestAnimationFrame(handleViewportChange); }
    if(window.visualViewport){
      visualViewport.addEventListener('resize', onResize);
      visualViewport.addEventListener('scroll', onResize);
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', ()=>{ setTimeout(handleViewportChange, 100); });
    input.addEventListener('focus', ()=>{ inputFocused=true; handleViewportChange(); });
    input.addEventListener('blur', ()=>{ inputFocused=false; applyKeyboardMode(false); });

    const DRAG_MIN_WIDTH=900;
    let dragActive=false, dragStart={x:0,y:0}, boxStart={x:0,y:0};
    function allowDrag(){ return window.innerWidth >= DRAG_MIN_WIDTH; }
    function enableDragUI(enabled){ document.body.classList.toggle('drag-enabled', enabled); }
    function ensureLeftTop(){
      const rect = container.getBoundingClientRect();
      container.style.left = rect.left + 'px';
      container.style.top  = rect.top  + 'px';
      container.style.right = 'auto';
      container.style.bottom = 'auto';
    }
    function clampToViewport(x,y){
      const vv = window.visualViewport;
      const vw = vv ? vv.width : window.innerWidth;
      const vh = vv ? vv.height : window.innerHeight;
      const rect = container.getBoundingClientRect();
      const maxX = vw - rect.width;
      const maxY = vh - rect.height;
      return { x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) };
    }
    function onPointerDown(e){
      if(!allowDrag()) return;
      if(e.target.closest('button, .ctrl')) return;
      dragActive=true;
      header.setPointerCapture?.(e.pointerId);
      ensureLeftTop();
      const rect = container.getBoundingClientRect();
      dragStart.x = e.clientX; dragStart.y = e.clientY;
      boxStart.x = rect.left;  boxStart.y = rect.top;
    }
    function onPointerMove(e){
      if(!dragActive) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const t = clampToViewport(boxStart.x + dx, boxStart.y + dy);
      container.style.left = t.x + 'px';
      container.style.top  = t.y + 'px';
    }
    function onPointerUp(e){
      if(!dragActive) return;
      dragActive=false;
      header.releasePointerCapture?.(e.pointerId);
    }
    function bindDrag(){
      enableDragUI(allowDrag());
      header.onpointerdown  = allowDrag() ? onPointerDown : null;
      header.onpointermove  = allowDrag() ? onPointerMove : null;
      header.onpointerup    = allowDrag() ? onPointerUp   : null;
      header.onpointercancel= allowDrag() ? onPointerUp   : null;
      if(!allowDrag()){
        container.style.left='';
        container.style.top='';
        container.style.right='';
        container.style.bottom='calc(env(safe-area-inset-bottom) + 8px)';
      }else{
        container.style.left='';
        container.style.top='';
        container.style.right='24px';
        container.style.bottom='24px';
      }
    }
    bindDrag();
    window.addEventListener('resize', bindDrag);

    let brandHoverCooldown=0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function playShine(){
      if(reducedMotion) return;
      brand.classList.remove('shine'); void brand.offsetWidth; brand.classList.add('shine');
      const durationMs=600, stepMs=60, totalMs=(brand.textContent.length-1)*stepMs + durationMs + 50;
      setTimeout(()=> brand.classList.remove('shine'), totalMs);
    }
    if (window.matchMedia('(hover: hover)').matches) {
      brand.addEventListener('mouseenter', ()=>{
        const now=performance.now();
        if (now - brandHoverCooldown > 1200) {
          brandHoverCooldown = now;
          playShine();
        }
      });
    }
    if (window.matchMedia('(hover: none)').matches && !reducedMotion) {
      window.addEventListener('load', ()=> setTimeout(()=>{ if(document.visibilityState==='visible') playShine(); }, 350), { once:true });
    }

    function clearInactivity(){ if(inactivityTimer){ clearTimeout(inactivityTimer); inactivityTimer=null; } }
    function endSession(){
      clearInactivity();
      log.innerHTML='';
      send.disabled=true;
      if(typeof window.hideActiveFabModal === 'function'){
        window.hideActiveFabModal();
      }
    }
    function scheduleInactivity(){
      clearInactivity();
      inactivityTimer = setTimeout(endSession, 60000);
    }

    ['click','keydown','touchstart'].forEach(ev=>{
      container.addEventListener(ev, scheduleInactivity, { passive:true });
    });
    document.addEventListener('visibilitychange', ()=>{
      if(document.visibilityState !== 'visible') clearInactivity();
      else scheduleInactivity();
    });

    let isChatVisible=true;
    function applyChatVisibility(){
      if(isChatVisible){
        container.style.display='';
        container.removeAttribute('aria-hidden');
        if(openBtn){
          openBtn.style.display='none';
          openBtn.setAttribute('aria-expanded','true');
        }
      }else{
        container.style.display='none';
        container.setAttribute('aria-hidden','true');
        if(openBtn){
          openBtn.style.display='inline-flex';
          openBtn.setAttribute('aria-expanded','false');
        }
      }
    }
    function minimizeChat(){
      isChatVisible=false;
      clearInactivity();
      applyChatVisibility();
    }
    function openChat(){
      isChatVisible=true;
      scheduleInactivity();
      applyChatVisibility();
    }
    minimizeHandler = minimizeChat;
    openHandler = openChat;
    minimizeBtn.addEventListener('click', minimizeHandler);
    if(openBtn) openBtn.addEventListener('click', openHandler);
    window.addEventListener('resize', applyChatVisibility);

    scheduleInactivity();
  }

  function cleanupChatbot(){
    if(langCtrl && langHandler) langCtrl.removeEventListener('click', langHandler);
    if(themeCtrl && themeHandler) themeCtrl.removeEventListener('click', themeHandler);
    if(form && formHandler) form.removeEventListener('submit', formHandler);
    if(exitBtn) exitBtn.removeEventListener('click', endSession);
    if(minimizeBtn && minimizeHandler) minimizeBtn.removeEventListener('click', minimizeHandler);
    if(openBtn && openHandler) openBtn.removeEventListener('click', openHandler);
    if(openBtn){
      openBtn.addEventListener('click', reloadChat);
      openBtn.style.display='inline-flex';
      openBtn.setAttribute('aria-expanded','false');
    }
    document.removeEventListener('keydown', escHandler);
    document.removeEventListener('click', outsideClickHandler);
    if(container) container.remove();
    langCtrl=themeCtrl=log=form=input=send=exitBtn=null;
    minimizeBtn=container=header=null;
    escHandler=outsideClickHandler=null;
    inactivityTimer=recaptchaId=null;
  }

  window.initChatbot = initChatbot;
  window.cleanupChatbot = cleanupChatbot;
})();

