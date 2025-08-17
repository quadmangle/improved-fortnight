const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');

test('chatbot minimize positions open button above FAB by 10px', async () => {
  const html = fs.readFileSync(path.join(root, 'fabs', 'chatbot.html'), 'utf8');
  const chatJs = fs.readFileSync(path.join(root, 'fabs', 'js', 'chattia.js'), 'utf8');
  const chatCss = fs.readFileSync(path.join(root, 'fabs', 'css', 'chatbot.css'), 'utf8');
  const fabCss = fs.readFileSync(path.join(root, 'fabs', 'css', 'cojoin.css'), 'utf8');

  const dom = new JSDOM('<!DOCTYPE html><body></body>', {
    url: 'https://example.com',
    runScripts: 'dangerously'
  });
  const { window } = dom;
  const { document } = window;

  const styleEl = document.createElement('style');
  styleEl.textContent = chatCss + fabCss;
  document.head.appendChild(styleEl);

  // Basic fetch mocks
  window.fetch = async (url) => {
    if (url.includes('chatbot.html')) {
      return { text: async () => html };
    }
    if (url.includes('honeypot') || url.includes('end-session')) {
      return {};
    }
    return { json: async () => ({ reply: 'ok' }) };
  };
  window.alert = () => {};

  // Create FAB structure
  const fabContainer = document.createElement('div');
  fabContainer.className = 'fab-container';
  const fabMain = document.createElement('button');
  fabMain.className = 'fab-main';
  fabMain.style.height = '60px';
  fabMain.style.width = '60px';
  fabContainer.appendChild(fabMain);
  document.body.appendChild(fabContainer);

  window.eval(chatJs);
  await window.reloadChat();

  const openBtn = document.getElementById('chat-open-btn');
  const minimizeBtn = document.getElementById('minimizeBtn');

  openBtn.click();
  minimizeBtn.click();

  const fabBottom = parseInt(window.getComputedStyle(fabContainer).bottom, 10);
  const fabHeight = parseInt(window.getComputedStyle(fabMain).height, 10);
  const expected = fabBottom + fabHeight + 10;
  const actual = parseInt(window.getComputedStyle(openBtn).bottom, 10);
  assert.strictEqual(actual, expected);
  window.cleanupChatbot();
});

