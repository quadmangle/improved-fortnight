const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.join(__dirname, '..', 'fabs', 'chatbot.html');
const jsPath = path.join(__dirname, '..', 'fabs', 'js', 'chattia.js');
const dragJsPath = path.join(__dirname, '..', 'fabs', 'js', 'cojoin.js');
const cssPath = path.join(__dirname, '..', 'fabs', 'css', 'chatbot.css');
const html = fs.readFileSync(htmlPath, 'utf8');
const script = fs.readFileSync(jsPath, 'utf8');
const dragScript = fs.readFileSync(dragJsPath, 'utf8');
const style = fs.readFileSync(cssPath, 'utf8');

test('Chattia minimizes on outside click and closes on ESC or inactivity', async () => {
  const dom = new JSDOM(`<body></body>`, { url: 'https://example.com', runScripts: 'dangerously' });
  const { window } = dom;
  const document = window.document;
  window.innerWidth = 1024;
  window.CHATBOT_INACTIVITY_MS = 30;
  const styleEl = document.createElement('style');
  styleEl.textContent = style;
  document.head.appendChild(styleEl);

  window.fetch = async (url, opts) => {
    if (url && url.includes('chatbot.html')) {
      return { text: async () => html };
    }
    if (url && url.includes('honeypot')) {
      return {};
    }
    if (url && url.includes('end-session')) {
      return {};
    }
    return { json: async () => ({ reply: 'ok' }) };
  };

  window.alert = () => {};

  window.eval(dragScript);
  window.eval(script);

  // ESC closes when chat is open
  await window.reloadChat();
  window.openChatbot();
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.strictEqual(document.getElementById('chatbot-container'), null);

  // Outside click minimizes
  await window.reloadChat();
  window.openChatbot();
  document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const container = document.getElementById('chatbot-container');
  assert.ok(container);
  assert.strictEqual(container.style.display, 'none');

  // ESC closes when minimized
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.strictEqual(document.getElementById('chatbot-container'), null);

  // Inactivity after minimize closes session
  await window.reloadChat();
  window.openChatbot();
  const minimizeBtn = document.getElementById('minimizeBtn');
  minimizeBtn.click();
  await new Promise(r => setTimeout(r, 40));
  assert.strictEqual(document.getElementById('chatbot-container'), null);
});

test('Chat history persists while minimized and clears on close', async () => {
  const dom = new JSDOM(`<body></body>`, { url: 'https://example.com', runScripts: 'dangerously' });
  const { window } = dom;
  const document = window.document;
  window.innerWidth = 1024;
  const styleEl = document.createElement('style');
  styleEl.textContent = style;
  document.head.appendChild(styleEl);

  window.fetch = async (url, opts) => {
    if (url && url.includes('chatbot.html')) {
      return { text: async () => html };
    }
    if (url && url.includes('honeypot')) {
      return {};
    }
    if (url && url.includes('end-session')) {
      return {};
    }
    return { json: async () => ({ reply: 'ok' }) };
  };

  window.alert = () => {};

  window.eval(dragScript);
  window.eval(script);

  await window.reloadChat();
  window.openChatbot();
  const log = document.getElementById('chat-log');
  const msg = document.createElement('div');
  msg.className = 'chat-msg user';
  msg.textContent = 'hi';
  log.appendChild(msg);

  const minimizeBtn = document.getElementById('minimizeBtn');
  minimizeBtn.click();
  window.openChatbot();
  assert.ok([...log.querySelectorAll('.chat-msg')].some(m => m.textContent === 'hi'));

  const closeBtn = document.getElementById('chatbot-close');
  closeBtn.click();
  await window.reloadChat();
  window.openChatbot();
  const newLog = document.getElementById('chat-log');
  assert.strictEqual([...newLog.querySelectorAll('.chat-msg')].some(m => m.textContent === 'hi'), false);
});

