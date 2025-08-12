/**
 * fabs/js/chattia.js
 *
 * This script contains the core logic for the Chattia chatbot.
 * It handles language toggles, theme changes, and chat interactions.
 */

let langCtrl, themeCtrl, log, form, input, send;
let langClickHandler, themeClickHandler, formSubmitHandler;

function initChatbot() {
  const qs = s => document.querySelector(s),
        qsa = s => [...document.querySelectorAll(s)];

  const chatbotContainer = qs('#chatbot-container');
  if (!chatbotContainer) return;
  function generateNonce() {
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

  let nonce = generateNonce();
  (async () => {
    while (!(await registerNonce(nonce))) {
      nonce = generateNonce();
    }
    if (typeof sessionStorage !== 'undefined' && sessionStorage.setItem) {
      sessionStorage.setItem('chatNonce', nonce);
    }
  })();

  /* === Language toggle === */
  langCtrl = qs('#langCtrl');
  const transNodes = qsa('[data-en]'),
        phNodes = qsa('[data-en-ph]');

  langClickHandler = () => {
    const toES = langCtrl.textContent === 'ES';
    document.documentElement.lang = toES ? 'es' : 'en';
    langCtrl.textContent = toES ? 'EN' : 'ES';

    // Update text content
    transNodes.forEach(node => node.textContent = toES ? node.dataset.es : node.dataset.en);

    // Update placeholders
    phNodes.forEach(node => node.placeholder = toES ? node.dataset.esPh : node.dataset.enPh);
  };
  if (langCtrl) {
    langCtrl.addEventListener('click', langClickHandler);
    langCtrl.onclick = langClickHandler;
  }

  /* === Theme toggle === */
  themeCtrl = qs('#themeCtrl');
  themeClickHandler = () => {
    const dark = themeCtrl.textContent === 'Dark';
    document.body.classList.toggle('dark', dark);
    themeCtrl.textContent = dark ? 'Light' : 'Dark';
  };
  if (themeCtrl) {
    themeCtrl.addEventListener('click', themeClickHandler);
    themeCtrl.onclick = themeClickHandler;
  }

  /* === Chatbot core === */
  const log = qs('#chat-log'),
        form = qs('#chatbot-input-row'),
        input = qs('#chatbot-input'),
        send = qs('#chatbot-send'),
        closeBtn = qs('#chatbot-close');

  // Nonce used to tie messages to a single conversation
  const RESET_MS = 10 * 60 * 1000; // auto-reset after 10 minutes
  let nonce = generateNonce();
  let resetTimer;
  function generateNonce() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }

  function scheduleReset() {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetConversation, RESET_MS);
  }

  async function resetConversation() {
    if (log) {
      log.innerHTML = '';
    }
    nonce = generateNonce();
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
        // In a real application, the client would obtain a short-lived token
        // from the server and use it to authenticate with the chatbot API.
        const r = await fetch('https://your-cloudflare-worker.example.com/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer placeholder_token'
          },
          body: JSON.stringify({
            message: sanitizedMsg,
            nonce
          })
        });
        const d = await r.json();
        log.lastChild.textContent = d.reply || 'No reply.';
      } catch (err) {
        console.error('Chatbot API request failed:', err);
        // In a real application, we would send this error to a logging service.
        // logError(err);
        log.lastChild.textContent = 'Error: Can’t reach AI.';
      }
      scheduleReset();
      send.disabled = false;
    };
    form.addEventListener('submit', formSubmitHandler);
    form.onsubmit = formSubmitHandler;
  }
}

function cleanupChatbot() {
  if (langCtrl && langClickHandler) {
    langCtrl.removeEventListener('click', langClickHandler);
    langCtrl.onclick = null;
  }
  if (themeCtrl && themeClickHandler) {
    themeCtrl.removeEventListener('click', themeClickHandler);
    themeCtrl.onclick = null;
  }
  if (form && formSubmitHandler) {
    form.removeEventListener('submit', formSubmitHandler);
    form.onsubmit = null;
  }

  langCtrl = themeCtrl = log = form = input = send = null;
  langClickHandler = themeClickHandler = formSubmitHandler = null;
}

function sanitizeInput(str) {
  // In a real application, we would use a library like DOMPurify here.
  // Remove any HTML tags; when DOM is available, use it, otherwise fallback to regex.
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    if (typeof div.innerHTML === 'string') {
      div.innerHTML = str;
      return div.textContent || '';
    }
    div.textContent = str;
    return div.textContent.replace(/<[^>]*>/g, '');
  }
  return str.replace(/<[^>]*>/g, '');
}

  function clearChatbot() {
    try {
      const log = document.getElementById('chat-log');
      if (log) {
        log.innerHTML = '';
      }
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.removeItem('chatbotHistory');
          sessionStorage.removeItem('chatbotSession');
        } catch (err) {
          console.error('Failed to clear chatbot session storage:', err);
        }
      }
      if (window.chatbotIdleTimer) {
        clearTimeout(window.chatbotIdleTimer);
        window.chatbotIdleTimer = null;
      }
    } catch (err) {
      console.error('clearChatbot failed:', err);
    }
  }

window.initChatbot = initChatbot;
function cleanup() {
  if (typeof sessionStorage !== 'undefined' && sessionStorage.removeItem) {
    sessionStorage.removeItem('chatNonce');
  }
}
window.cleanup = cleanup;