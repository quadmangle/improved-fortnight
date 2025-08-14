const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

test('Chattia chatbot core interactions', async () => {
  const htmlPath = path.join(__dirname, '..', 'fabs', 'chatbot.html');
  const jsPath = path.join(__dirname, '..', 'fabs', 'js', 'chattia.js');
  const html = fs.readFileSync(htmlPath, 'utf8');

  const dom = new JSDOM(`<body>${html}</body>`, {
    url: 'https://example.com/',
    runScripts: 'dangerously'
  });

  const { window } = dom;
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.requestAnimationFrame = (cb) => cb();
  window.cancelAnimationFrame = () => {};
  window.visualViewport = { height: 800, width: 1200, addEventListener() {}, removeEventListener() {} };
  window.performance = { now: () => 0 };

  // stub fetch
  window.fetch = async () => ({ json: async () => ({ reply: 'ok' }) });

  // capture inactivity timeout
  let inactivityFn;
  window.setTimeout = (fn, ms) => { if (ms === 60000) inactivityFn = fn; return 0; };
  window.clearTimeout = () => {};

  const script = fs.readFileSync(jsPath, 'utf8');
  window.eval(script);
  window.initChatbot();

  const document = window.document;
  const brand = document.getElementById('brand');
  assert.ok(brand.querySelectorAll('.char').length > 0, 'brand built per letter');

  // language toggle updates placeholders and brand
  const langCtrl = document.getElementById('langCtrl');
  const input = document.getElementById('chatbot-input');
  langCtrl.click();
  assert.strictEqual(document.documentElement.lang, 'es');
  assert.strictEqual(input.placeholder, input.getAttribute('data-es-ph'));
  let brandText = [...brand.querySelectorAll('.char')].map(n => n.textContent).join('');
  assert.strictEqual(brandText, brand.getAttribute('data-es'));
  langCtrl.click();
  assert.strictEqual(document.documentElement.lang, 'en');

  // theme toggle
  const themeCtrl = document.getElementById('themeCtrl');
  themeCtrl.click();
  assert.ok(document.body.classList.contains('dark'));
  themeCtrl.click();
  assert.ok(!document.body.classList.contains('dark'));

  // send button gated by human check
  const guard = document.getElementById('human-check');
  const send = document.getElementById('chatbot-send');
  assert.ok(send.disabled);
  guard.checked = true;
  guard.dispatchEvent(new window.Event('change'));
  assert.ok(!send.disabled);

  // drag enable on wide screens
  window.innerWidth = 1000;
  window.dispatchEvent(new window.Event('resize'));
  assert.ok(document.body.classList.contains('drag-enabled'));

  // minimize / open controls while draggable
  const containerEl = document.getElementById('chatbot-container');
  const minimizeBtn = document.getElementById('minimizeBtn');
  const openBtn = document.getElementById('chat-open-btn');
  minimizeBtn.click();
  assert.strictEqual(containerEl.style.display, 'none');
  openBtn.click();
  assert.strictEqual(containerEl.style.display, '');

  // drag disabled on narrow screens
  window.innerWidth = 800;
  window.dispatchEvent(new window.Event('resize'));
  assert.ok(!document.body.classList.contains('drag-enabled'));

  // inactivity timeout clears chat and hides container
  const log = document.getElementById('chat-log');
  log.appendChild(document.createElement('div'));
  inactivityFn();
  assert.strictEqual(log.children.length, 0);
  assert.strictEqual(document.getElementById('chatbot-container').style.display, 'none');
  assert.ok(send.disabled);
});
