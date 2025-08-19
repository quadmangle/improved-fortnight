const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createClassList() {
  return {
    classes: [],
    add(...cls) { cls.forEach(c => { if (!this.classes.includes(c)) this.classes.push(c); }); },
    remove(...cls) { this.classes = this.classes.filter(c => !cls.includes(c)); },
    contains(c) { return this.classes.includes(c); },
    toString() { return this.classes.join(' '); }
  };
}

test('theme toggle updates class, text, and localStorage', () => {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'langtheme.js'), 'utf-8');

  const themeButton = {
    textContent: 'Dark',
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    addEventListener(event, cb) { this.onClick = cb; }
  };

  const document = {
    documentElement: { classList: createClassList(), style: {} },
    querySelectorAll(sel) {
      if (sel === '.theme-toggle') return [themeButton];
      if (sel === '.lang-toggle') return [];
      if (sel === '[data-key]') return [];
      if (sel === '[data-aria-label-key]') return [];
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
  vm.runInNewContext(code, sandbox);

  assert.ok(document.documentElement.classList.contains('light'));
  assert.strictEqual(themeButton.textContent, 'Dark');

  themeButton.onClick();
  assert.ok(document.documentElement.classList.contains('dark'));
  assert.strictEqual(localStorage.getItem('theme'), 'dark');
  assert.strictEqual(themeButton.textContent, 'Light');
  assert.strictEqual(themeButton.attributes['aria-pressed'], true);

  themeButton.onClick();
  assert.ok(document.documentElement.classList.contains('light'));
  assert.strictEqual(localStorage.getItem('theme'), 'light');
  assert.strictEqual(themeButton.textContent, 'Dark');
  assert.strictEqual(themeButton.attributes['aria-pressed'], false);
});
