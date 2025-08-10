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
    const dark = themeCtrl.textContent === ' Dark';
    document.body.classList.toggle('dark', dark);
    themeCtrl.textContent = dark ? 'Light' : ' Dark';
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
            message: sanitizedMsg
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
      if (window.hideActiveFabModal) {
        window.hideActiveFabModal();
      }
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
