const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

test('service cards link to their respective pages', async () => {
  // Load index.html and strip existing script tags to prevent side effects
  let html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  html = html.replace(/<script[^>]*>[^<]*<\/script>/gi, '');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
  const { window } = dom;

  // Provide minimal globals expected by main.js
  window.currentLanguage = 'en';
  window.translations = {
    services: {
      ops: { learn: 'index.html' },
      cc: { learn: 'contact-center.html' },
      it: { learn: 'it-support.html' },
      pro: { learn: 'professional-services.html' }
    }
  };
  window.fetch = async () => ({ json: async () => ({ token: 'test' }) });

  const mainScript = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
  window.eval(mainScript);

  // Trigger DOMContentLoaded handlers defined in main.js
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  await new Promise(r => setTimeout(r, 0));

  // Explicitly verify the Professional Services card
  const proCard = window.document.querySelector('[data-service-key="pro"]');
  assert.ok(proCard, 'pro service card exists');
  const proLink = proCard.querySelector('.learn-more');
  assert.equal(proLink.getAttribute('href'), 'professional-services.html');

  // Ensure all service cards have the correct links
  const expected = {
    ops: 'index.html',
    cc: 'contact-center.html',
    it: 'it-support.html',
    pro: 'professional-services.html'
  };

  Object.entries(expected).forEach(([key, href]) => {
    const card = window.document.querySelector(`[data-service-key="${key}"]`);
    assert.ok(card, `card with key ${key} should exist`);
    const link = card.querySelector('.learn-more');
    assert.ok(link, `card ${key} should have a learn-more link`);
    assert.equal(link.getAttribute('href'), href, `card ${key} should link to ${href}`);
  });
});
