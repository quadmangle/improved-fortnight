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
  }

  /* === Chatbot core === */
  log = qs('#chat-log');
  form = qs('#chatbot-input-row');
  input = qs('#chatbot-input');
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
            message: sanitizedMsg
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
      send.disabled = false;
    };
    form.addEventListener('submit', formSubmitHandler);
  }
}

function cleanupChatbot() {
  if (log) {
    log.innerHTML = '';
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
