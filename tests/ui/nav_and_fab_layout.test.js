const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..', '..');

// Ensure FAB container positioning

test('fab container fixed to viewport corner', () => {
  const css = fs.readFileSync(path.join(root, 'fabs', 'css', 'cojoin.css'), 'utf-8');
  const match = css.match(/\.fab-container\s*{[\s\S]*?}/);
  assert.ok(match, 'fab-container styles not found');
  const block = match[0];
  assert.ok(/position:\s*fixed/.test(block), 'fab container should be fixed');
  assert.ok(/bottom:\s*30px/.test(block), 'fab container should be 30px from bottom');
  assert.ok(/right:\s*10px/.test(block), 'fab container should be 10px from right');
});

// Ensure clicking outside or on backdrop closes mobile menu

test('mobile menu closes on backdrop or outside click', async () => {
  const html = `<!DOCTYPE html><html><body>
    <nav class="ops-nav">
      <a href="#" class="ops-logo">OPS</a>
      <div class="nav-links" id="primary-nav">
        <a href="#" class="nav-link">Home</a>
      </div>
      <div class="toggles">
        <button type="button" class="toggle-btn lang-toggle">EN</button>
        <button type="button" class="toggle-btn theme-toggle">Dark</button>
        <button type="button" class="toggle-btn nav-menu-toggle" aria-expanded="false" aria-controls="primary-nav" aria-label="" data-aria-label-key="aria-nav-menu">
          <i class="fa-solid fa-bars"></i><span class="sr-only">Menu</span>
        </button>
      </div>
    </nav>
    <div class="nav-backdrop" hidden></div>
  </body></html>`;

  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });
  const { window } = dom;
  window.translations = { services: {} };
  window.currentLanguage = 'en';
  window.fetch = async () => ({ json: async () => ({ token: 'test' }) });
  Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });

  const script = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf-8');
  window.eval(script);
  // The DOMContentLoaded handler in main.js executes immediately
  // in this test environment because the document is already loaded.
  await new Promise(r => setImmediate(r));

  const toggle = window.document.querySelector('.nav-menu-toggle');
  const navLinks = window.document.querySelector('.nav-links');
  const backdrop = window.document.querySelector('.nav-backdrop');

  // Trigger menu via non-bubbling click so the document-level
  // outside-click handler doesn't fire during the same event cycle.
  toggle.dispatchEvent(new window.MouseEvent('click'));
  assert.ok(navLinks.classList.contains('open'), 'menu should open');
  assert.ok(backdrop.classList.contains('open'), 'backdrop should be visible when menu opens');

  backdrop.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.ok(!navLinks.classList.contains('open'), 'menu should close on backdrop click');

  toggle.dispatchEvent(new window.MouseEvent('click'));
  assert.ok(navLinks.classList.contains('open'), 'menu should reopen');

  window.document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.ok(!navLinks.classList.contains('open'), 'menu should close on outside click');
});
