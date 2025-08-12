/**
 * fabs/js/chattia.js
 *
 * This script contains the core logic for the Chattia chatbot.
 * It handles language toggles, theme changes, and chat interactions.
 */

let langCtrl, themeCtrl, log, form, input, send;
let langClickHandler, themeClickHandler, formSubmitHandler, resetTimer;

function initChatbot() {
  const qs = s => document.querySelector(s),
        qsa = s => [...document.querySelectorAll(s)];

  const chatbotContainer = qs('#chatbot-container');
  if (!chatbotContainer) return;
  function generateSessionNonce() {
    return (window.crypto && typeof window.crypto.randomUUID === 'function')
      ? window.crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  }

  async function registerNonce(n) {
    try {
      const res = await fetch('https://your-cloudflare-worker.example.com/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonce: n })
      });
      return res.ok;
    } catch (err) {
      console.error('Nonce registration failed:', err);
      return false;
    }
  }

  let sessionNonce = generateSessionNonce();
  (async () => {
    let attempts = 0;
    while (attempts < 3 && !(await registerNonce(sessionNonce))) {
      sessionNonce = generateSessionNonce();
      attempts++;
    }
    if (typeof sessionStorage !== 'undefined' && sessionStorage.setItem) {
      sessionStorage.setItem('chatNonce', sessionNonce);
    }
  })();

  /* === Language toggle === */
  langCtrl = qs('#langCtrl');
  globalThis.langCtrl = langCtrl;
  if (typeof window !== 'undefined') {
    window.langCtrl = langCtrl;
  }
  const transNodes = qsa('[data-en]'),
        phNodes = qsa('[data-en-ph]');

  langClickHandler = () => {
    const toEnglish = langCtrl.textContent === 'EN';
    if (toEnglish) {
      document.documentElement.lang = 'en';
      langCtrl.textContent = 'ES';
      transNodes.forEach(node => (node.textContent = node.dataset.en));
      phNodes.forEach(node => (node.placeholder = node.dataset.enPh));
    } else {
      document.documentElement.lang = 'es';
      langCtrl.textContent = 'EN';
      transNodes.forEach(node => (node.textContent = node.dataset.es));
      phNodes.forEach(node => (node.placeholder = node.dataset.esPh));
    }
  };
  if (langCtrl) {
    langCtrl.addEventListener('click', langClickHandler);
  }

  /* === Theme toggle === */
  themeCtrl = qs('#themeCtrl');
  globalThis.themeCtrl = themeCtrl;
  if (typeof window !== 'undefined') {
    window.themeCtrl = themeCtrl;
  }
  themeClickHandler = () => {
    const toDark = themeCtrl.textContent === 'Dark';
    if (toDark) {
      document.body.classList.add('dark');
      themeCtrl.textContent = 'Light';
    } else {
      document.body.classList.remove('dark');
      themeCtrl.textContent = 'Dark';
    }
  };
  if (themeCtrl) {
    themeCtrl.addEventListener('click', themeClickHandler);
  }

  /* === Chatbot core === */
  log = qs('#chat-log');
  form = qs('#chatbot-input-row');
  input = qs('#chatbot-input');
  send = qs('#chatbot-send');
  const closeBtn = qs('#chatbot-close');

  // Nonce used to tie messages to a single conversation
  const RESET_MS = 10 * 60 * 1000; // auto-reset after 10 minutes
  let conversationNonce = generateConversationNonce();
  function generateConversationNonce() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }

  function scheduleReset() {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetConversation, RESET_MS);
    if (typeof resetTimer.unref === 'function') {
      resetTimer.unref();
    }
  }

  async function resetConversation() {
    if (log) {
      log.innerHTML = '';
    }
    conversationNonce = generateConversationNonce();
    scheduleReset();
    try {
      await fetch('/api/chat/reset', { method: 'POST' });
    } catch (err) {
      console.error('Chat reset failed:', err);
    }
  }

  scheduleReset();
  if (closeBtn) {
    closeBtn.addEventListener('click', resetConversation);
  }
  window.resetChatbotConversation = resetConversation;

  // Enable sending by default
  if (send) {
    send.disabled = false;
  }

  // Focus the input field when the chatbot initializes so keyboard users
  // can immediately begin typing. The close button remains reachable via
  // Tab navigation within the form.
  if (input && input.focus) {
    input.focus();
  }

  function addMsg(txt, cls) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + cls;
    div.textContent = txt;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  if (form) {
    formSubmitHandler = async e => {
      e.preventDefault();
      const msg = input.value.trim();
      if (!msg) return;
      const sanitizedMsg = sanitizeInput(msg);
      addMsg(sanitizedMsg, 'user');
      input.value = '';
      send.disabled = true;
      addMsg('…', 'bot');

      try {
        // Use a public echo API for demonstration purposes.
        const r = await fetch('https://httpbin.org/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: sanitizedMsg,
            nonce: conversationNonce
          })
        });
        const d = await r.json();
        // The echo API returns the sent JSON in its 'data' field.
        const reply = JSON.parse(d.data).message;
        log.lastChild.textContent = `You said: "${reply}"`;
      } catch (err) {
        console.error('Chatbot API request failed:', err);
        log.lastChild.textContent = 'Error: Could not connect to the echo service.';
      }
      scheduleReset();
      send.disabled = false;
    };
    form.addEventListener('submit', formSubmitHandler);
  }
}

function cleanupChatbot() {
  if (log) {
    log.innerHTML = '';
  }
  if (resetTimer) {
    clearTimeout(resetTimer);
    resetTimer = null;
  }

  if (langCtrl && langClickHandler) {
    langCtrl.removeEventListener('click', langClickHandler);
  }
  if (themeCtrl && themeClickHandler) {
    themeCtrl.removeEventListener('click', themeClickHandler);
  }
  if (form && formSubmitHandler) {
    form.removeEventListener('submit', formSubmitHandler);
  }

  langCtrl = themeCtrl = log = form = input = send = null;
  langClickHandler = themeClickHandler = formSubmitHandler = null;
}

function sanitizeInput(str) {
  // Use the browser's own parser to safely strip HTML tags
  const temp = document.createElement('div');
  temp.innerHTML = str;
  return temp.textContent || '';
}

window.initChatbot = initChatbot;
window.cleanupChatbot = cleanupChatbot;
function cleanup() {
  if (typeof sessionStorage !== 'undefined' && sessionStorage.removeItem) {
    sessionStorage.removeItem('chatNonce');
  }
}
window.cleanup = cleanup;
