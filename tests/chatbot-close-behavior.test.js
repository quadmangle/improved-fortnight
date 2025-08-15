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

test('Chattia closes on outside click and ESC key', async () => {
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

  // outside click closes
  document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.strictEqual(document.getElementById('chatbot-container'), null);

  // reload and test ESC key
  await window.reloadChat();
  assert.ok(document.getElementById('chatbot-container'));
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.strictEqual(document.getElementById('chatbot-container'), null);
});

