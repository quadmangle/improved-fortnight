const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const antibotJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'antibot.js'), 'utf8');
const hpHtml = fs.readFileSync(path.join(__dirname, '..', 'security', 'honeypots.html'), 'utf8');
const utilsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'utils.js'), 'utf8');

test('modal dragging ignores header controls', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'dangerously'
  });
  const { window } = dom;
  const { document } = window;

  // Load cojoin.js to get initDraggableModal
  const script = fs.readFileSync(path.join(__dirname, '..', 'fabs/js/cojoin.js'), 'utf8');
  window.fetch = (url) => {
    if (url && url.includes('security/honeypots.html')) {
      return Promise.resolve({ ok: true, text: async () => hpHtml });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  };
  window.grecaptcha = { ready: cb => cb(), execute: async () => 'token' };
  window.eval(utilsJs);
  window.eval(antibotJs);
  window.eval(script);
  window.initCojoinForms();
  if (!window.initDraggableModal) {
    window.initDraggableModal = modal => {
      if (window.appUtils && window.appUtils.makeDraggable) {
        window.appUtils.makeDraggable(modal);
      }
    };
  }

  window.innerWidth = 1024;

  const modal = document.createElement('div');
  modal.style.left = '0px';
  modal.style.top = '0px';
  const header = document.createElement('div');
  header.id = 'chatbot-header';
  modal.appendChild(header);

  const langCtrl = document.createElement('span');
  langCtrl.className = 'ctrl';
  header.appendChild(langCtrl);
  const themeCtrl = document.createElement('span');
  themeCtrl.className = 'ctrl';
  header.appendChild(themeCtrl);
  const closeBtn = document.createElement('button');
  header.appendChild(closeBtn);

  document.body.appendChild(modal);
  window.initDraggableModal(modal);

  // Drag from header background
  header.dispatchEvent(new window.MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true }));
  document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 40, clientY: 40, bubbles: true }));
  document.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true }));
  assert.notStrictEqual(modal.style.left, '0px');
  assert.notStrictEqual(modal.style.top, '0px');

  modal.style.left = '0px';
  modal.style.top = '0px';

  for (const ctrl of [langCtrl, themeCtrl, closeBtn]) {
    ctrl.dispatchEvent(new window.MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true }));
    document.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 80, clientY: 80, bubbles: true }));
    document.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true }));
    assert.strictEqual(modal.style.left, '0px');
    assert.strictEqual(modal.style.top, '0px');
  }
});
