const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'contact-center.html', 'it-support.html', 'professional-services.html'];

for (const page of pages) {
  test(`footer exists in ${page}`, () => {
    const html = fs.readFileSync(path.join(root, page), 'utf-8');
    assert.match(html, /<footer[^>]*class="[^"]*ops-footer[^"]*"[^>]*>/);
    assert.ok(!/<footer[^>]*hidden/.test(html));
    assert.ok(!/<footer[^>]*style="[^"]*display:\s*none/.test(html));
  });
}

test('footer text updates on language toggle', () => {
  const code = fs.readFileSync(path.join(root, 'js/langtheme.js'), 'utf-8');

  const footer = {
    tagName: 'FOOTER',
    attributes: { 'data-key': 'footer-copyright', class: 'ops-footer' },
    style: {},
    textContent: '',
    getAttribute(name) { return this.attributes[name]; },
    setAttribute(name, value) { this.attributes[name] = value; },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); }
  };

  const langButton = { textContent: '', setAttribute() {}, addEventListener() {} };

  const document = {
    body: { classList: { remove() {}, add() {} } },
    querySelectorAll(selector) {
      if (selector === '[data-key]') return [footer];
      if (selector === '.lang-toggle') return [langButton];
      if (selector === '.theme-toggle') return [];
      return [];
    },
    addEventListener(event, cb) { if (event === 'DOMContentLoaded') cb(); }
  };

  const localStorage = {
    store: {},
    getItem(k) { return this.store[k]; },
    setItem(k, v) { this.store[k] = v; }
  };

  const sandbox = { document, localStorage, console };
  sandbox.window = sandbox;
  vm.runInNewContext(`${code};this.exports={translations, updateContent, toggleLanguage};`, sandbox);

  const { translations, updateContent, toggleLanguage } = sandbox.exports;

  updateContent();
  assert.strictEqual(footer.textContent.trim(), translations.en['footer-copyright']);
  assert.ok(!footer.hasAttribute('hidden'));
  assert.notStrictEqual(footer.style.display, 'none');

  toggleLanguage();
  updateContent();
  assert.strictEqual(footer.textContent.trim(), translations.es['footer-copyright']);
});

test('footer uses safe-area padding', () => {
  const css = fs.readFileSync(path.join(root, 'css', 'style.css'), 'utf-8');
  const footerRule = css.match(/\.ops-footer\s*{[^}]*}/);
  assert.ok(footerRule, 'ops-footer rule missing');
  assert.match(
    footerRule[0],
    /padding-bottom:\s*env\(\s*safe-area-inset-bottom\s*\)/
  );
});
