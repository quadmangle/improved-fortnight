const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function loadScript(window, file) {
  const scriptEl = window.document.createElement('script');
  scriptEl.textContent = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  window.document.body.appendChild(scriptEl);
}

test('contact and join modals load under file protocol', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'file:///index.html',
    runScripts: 'dangerously'
  });
  const { window } = dom;
  const { document } = window;

  window.initCojoinForms = () => {};
  window.initDraggableModal = () => {};

  window.fetch = async (url) => {
    const content = url.includes('contact')
      ? '<div class="modal-container"><button class="modal-close"></button></div>'
      : '<div class="modal-container"><button class="modal-close"></button></div>';
    return {
      url: `file:///fabs/${url.includes('contact') ? 'contact' : 'join'}.html`,
      headers: { get: () => 'text/html' },
      text: async () => content
    };
  };

  loadScript(window, 'cojoinlistener.js');
  await new Promise(r => setImmediate(r));
  document.dispatchEvent(new window.Event('DOMContentLoaded'));

  const contactFab = document.getElementById('fab-contact');
  contactFab.dispatchEvent(new window.Event('click'));
  await new Promise(r => setImmediate(r));
  assert.ok(document.getElementById('contact-modal'));

  const joinFab = document.getElementById('fab-join');
  joinFab.dispatchEvent(new window.Event('click'));
  await new Promise(r => setImmediate(r));
  assert.ok(document.getElementById('join-modal'));
});
