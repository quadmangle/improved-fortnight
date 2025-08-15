const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.join(__dirname, '..', 'fabs', 'chatbot.html');
const jsPath = path.join(__dirname, '..', 'fabs', 'js', 'chattia.js');
const cssPath = path.join(__dirname, '..', 'fabs', 'css', 'chatbot.css');
const html = fs.readFileSync(htmlPath, 'utf8');
const script = fs.readFileSync(jsPath, 'utf8');
const style = fs.readFileSync(cssPath, 'utf8');

test('Chattia chatbot basic interactions', async () => {
  const dom = new JSDOM(`<body></body>`, { url: 'https://example.com', runScripts: 'dangerously' });
  const { window } = dom;
  const document = window.document;
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

  window.eval(script);
  await window.reloadChat();

  const brand = document.getElementById('brand');
  assert.ok(brand.querySelectorAll('.char').length > 0);

  const langCtrl = document.getElementById('langCtrl');
  const input = document.getElementById('chatbot-input');
  langCtrl.click();
  assert.strictEqual(document.documentElement.lang, 'es');
  langCtrl.click();
  assert.strictEqual(document.documentElement.lang, 'en');

  const themeCtrl = document.getElementById('themeCtrl');
  themeCtrl.click();
  assert.ok(document.body.classList.contains('dark'));
  themeCtrl.click();
  assert.ok(!document.body.classList.contains('dark'));

  const send = document.getElementById('chatbot-send');
  assert.ok(send.disabled);
  input.value = 'Hi';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.ok(!send.disabled);

  // honeypot triggers lock
  let alerted = false;
  window.alert = () => { alerted = true; };
  document.getElementById('hp_check').dispatchEvent(new window.Event('click', { bubbles: true }));
  assert.ok(alerted);
  assert.ok(send.disabled);

  // start fresh session
  document.querySelectorAll('#chatbot-container').forEach(el => el.remove());
  document.querySelectorAll('#chat-open-btn').forEach(el => el.remove());
  window.sessionStorage.clear();
  await window.reloadChat();

  const minimizeBtn = document.getElementById('minimizeBtn');
  const container = document.getElementById('chatbot-container');
  const openBtn = document.getElementById('chat-open-btn');
  minimizeBtn.click();
  assert.strictEqual(container.style.display, 'none');
  openBtn.click();
  assert.strictEqual(container.style.display, '');

  // message persists across reloads
  window.grecaptcha = { ready: cb => cb(), execute: async () => 'token' };
  const recaptchaScript = document.getElementById('recaptcha-script');
  if (recaptchaScript && recaptchaScript.onload) recaptchaScript.onload();
  const form = document.getElementById('chatbot-input-grid');
  const input2 = document.getElementById('chatbot-input');
  input2.value = 'Hello';
  input2.dispatchEvent(new window.Event('input', { bubbles: true }));
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r,0));
  const hist = JSON.parse(window.sessionStorage.getItem('chatHistory'));
  assert.strictEqual(hist[0].text, 'Hello');
  document.querySelectorAll('#chatbot-container').forEach(el => el.remove());
  document.querySelectorAll('#chat-open-btn').forEach(el => el.remove());
  await window.reloadChat();
  const logText = document.getElementById('chat-log').textContent;
  assert.ok(logText.includes('Hello'));

  const closeBtn = document.getElementById('chatbot-close');
  closeBtn.click();
  assert.strictEqual(window.sessionStorage.getItem('chatHistory'), null);
  assert.strictEqual(document.getElementById('chatbot-container'), null);
});
