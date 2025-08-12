/**
 * fabs/js/chattia.js
 *
 * This script contains the core logic for the Chattia chatbot.
 * It handles language toggles, theme changes, and chat interactions.
 */

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
  const langCtrl = qs('#langCtrl'),
        transNodes = qsa('[data-en]'),
        phNodes = qsa('[data-en-ph]');

  langCtrl.onclick = () => {
    const toES = langCtrl.textContent === 'ES';
    document.documentElement.lang = toES ? 'es' : 'en';
    langCtrl.textContent = toES ? 'EN' : 'ES';

    // Update text content
    transNodes.forEach(node => node.textContent = toES ? node.dataset.es : node.dataset.en);

    // Update placeholders
    phNodes.forEach(node => node.placeholder = toES ? node.dataset.esPh : node.dataset.enPh);
  };

  /* === Theme toggle === */
  const themeCtrl = qs('#themeCtrl');
  themeCtrl.onclick = () => {
    const dark = themeCtrl.textContent === 'Dark';
    document.body.classList.toggle('dark', dark);
    themeCtrl.textContent = dark ? 'Light' : 'Dark';
  };

  /* === Chatbot core === */
  const log = qs('#chat-log'),
        form = qs('#chatbot-input-row'),
        input = qs('#chatbot-input'),
        send = qs('#chatbot-send');

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
    form.onsubmit = async e => {
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
            nonce: (typeof sessionStorage !== 'undefined' && sessionStorage.getItem)
              ? sessionStorage.getItem('chatNonce')
              : nonce
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
      send.disabled = false;
    };
  }
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

window.initChatbot = initChatbot;

function cleanup() {
  if (typeof sessionStorage !== 'undefined' && sessionStorage.removeItem) {
    sessionStorage.removeItem('chatNonce');
  }
}

window.cleanup = cleanup;
