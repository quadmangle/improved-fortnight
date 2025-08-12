const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Minimal DOM implementation for tests
let currentDocument;

class Element {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.style = {};
    this.dataset = {};
    this.eventHandlers = {};
    this.textContent = '';
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this.classList = {
      add: cls => {
        if (!this.className.split(/\s+/).includes(cls)) {
          this.className = (this.className ? this.className + ' ' : '') + cls;
        }
      },
      remove: cls => {
        this.className = this.className.split(/\s+/).filter(c => c && c !== cls).join(' ');
      },
      toggle: (cls, force) => {
        const has = this.className.split(/\s+/).includes(cls);
        const shouldAdd = force !== undefined ? force : !has;
        shouldAdd ? this.classList.add(cls) : this.classList.remove(cls);
        return shouldAdd;
      },
      contains: cls => this.className.split(/\s+/).includes(cls)
    };
  }
  focus() {
    currentDocument.activeElement = this;
  }
  get lastChild() {
    return this.children[this.children.length - 1] || null;
  }
  set id(v) { this.attributes.id = v; }
  get id() { return this.attributes.id; }
  set className(v) { this.attributes.class = v; }
  get className() { return this.attributes.class || ''; }
  set innerHTML(html) {
    this._innerHTML = html;
    this.children = [];
    if (html.includes('chatbot-container')) {
      const modal = createChatbotModal();
      modal.parentNode = this;
      this.children.push(modal);
    }
  }
  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }
  getAttribute(name) {
    if (name === 'class') return this.className;
    if (name.startsWith('data-')) return this.dataset[toDatasetKey(name.slice(5))];
    return this.attributes[name];
  }
  setAttribute(name, value) {
    if (name === 'class') this.className = value;
    else if (name.startsWith('data-')) this.dataset[toDatasetKey(name.slice(5))] = value;
    else this.attributes[name] = value;
  }
  hasAttribute(name) {
    if (name === 'class') return !!this.className;
    if (name.startsWith('data-')) return this.dataset[toDatasetKey(name.slice(5))] !== undefined;
    return this.attributes[name] !== undefined;
  }
  addEventListener(event, handler) {
    (this.eventHandlers[event] ||= []).push(handler);
  }
  querySelector(selector) {
    return querySelectorFrom(this, selector, false);
  }
  querySelectorAll(selector) {
    return querySelectorFrom(this, selector, true);
  }
}

class Document {
  constructor() {
    this.documentElement = new Element('html');
    this.documentElement.lang = 'en';
    this.body = new Element('body');
    this.documentElement.appendChild(this.body);
    this.listeners = {};
    currentDocument = this;
    this.activeElement = this.body;
  }
  createElement(tag) { return new Element(tag); }
  getElementById(id) { return this.querySelector('#' + id); }
  querySelector(selector) { return this.documentElement.querySelector(selector); }
  querySelectorAll(selector) { return this.documentElement.querySelectorAll(selector); }
  addEventListener(event, handler) { (this.listeners[event] ||= []).push(handler); }
  dispatchEvent(evt) { (this.listeners[evt.type] || []).forEach(h => h(evt)); }
}

function toDatasetKey(attr) {
  return attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function createMatcher(selector) {
  if (selector.startsWith('#')) {
    const id = selector.slice(1);
    return el => el.id === id;
  }
  if (selector.startsWith('.')) {
    const cls = selector.slice(1);
    return el => el.className.split(/\s+/).includes(cls);
  }
  if (selector.startsWith('[') && selector.endsWith(']')) {
    const attr = selector.slice(1, -1);
    if (attr.startsWith('data-')) {
      const key = toDatasetKey(attr.slice(5));
      return el => el.dataset[key] !== undefined;
    }
  }
  return () => false;
}

function querySelectorFrom(root, selector, all) {
  const matcher = createMatcher(selector);
  const results = [];
  function traverse(node) {
    for (const child of node.children) {
      if (matcher(child)) {
        results.push(child);
        if (!all) return true;
      }
      if (traverse(child) && !all) return true;
    }
    return false;
  }
  traverse(root);
  return all ? results : results[0] || null;
}

function createChatbotModal() {
  const container = new Element('div');
  container.id = 'chatbot-container';

  const header = new Element('div');
  header.id = 'chatbot-header';
  const title = new Element('span');
  title.id = 'title';
  title.dataset.en = 'OPS AI Chatbot';
  title.dataset.es = 'Chatbot OPS AI';
  title.textContent = 'OPS AI Chatbot';
  header.appendChild(title);

  const headerControls = new Element('div');
  const langCtrl = new Element('span');
  langCtrl.id = 'langCtrl';
  langCtrl.className = 'ctrl';
  langCtrl.textContent = 'ES';
  headerControls.appendChild(langCtrl);

  const themeCtrl = new Element('span');
  themeCtrl.id = 'themeCtrl';
  themeCtrl.className = 'ctrl';
  themeCtrl.textContent = 'Dark';
  headerControls.appendChild(themeCtrl);

  header.appendChild(headerControls);
  container.appendChild(header);

  const log = new Element('div');
  log.id = 'chat-log';
  container.appendChild(log);

  const formContainer = new Element('div');
  formContainer.id = 'chatbot-form-container';
  const form = new Element('form');
  form.id = 'chatbot-input-row';

  const input = new Element('textarea');
  input.id = 'chatbot-input';
  input.setAttribute('rows', '4');
  input.setAttribute('data-en-ph', 'Type your message...');
  input.setAttribute('data-es-ph', 'Escriba su mensaje...');
  input.placeholder = 'Type your message...';
  form.appendChild(input);

  const inputControls = new Element('div');
  inputControls.id = 'chatbot-controls';

  const send = new Element('button');
  send.id = 'chatbot-send';
  inputControls.appendChild(send);

  const closeBtn = new Element('button');
  closeBtn.id = 'chatbot-close';
  closeBtn.className = 'modal-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = 'Close';
  inputControls.appendChild(closeBtn);

  form.appendChild(inputControls);
  formContainer.appendChild(form);
  container.appendChild(formContainer);
  return container;
}

function runScripts(context, files) {
  for (const file of files) {
    const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    vm.runInContext(code, context);
  }
}

test('chatbot modal initializes and handlers work', async () => {
  const document = new Document();
  const window = { document };
  window.addEventListener = () => {};
  window.dispatchEvent = () => {};
  const context = vm.createContext({ window, document, console, setTimeout, fetch: null });
  context.window.initDraggableModal = () => {};

  // fetch stub for modal and chat responses
  const chatbotHtml = '<div id="chatbot-container"></div>';
  context.fetch = async (url) => {
    if (url.endsWith('chatbot.html')) {
      return { text: async () => chatbotHtml };
    }
    return { json: async () => ({ reply: 'hello' }) };
  };

  // Load scripts
  runScripts(context, ['fabs/js/chattia.js', 'cojoinlistener.js']);

  // Spy on initChatbot
  let called = false;
  const realInit = context.window.initChatbot;
  context.window.initChatbot = () => { called = true; realInit(); };

  // Trigger DOMContentLoaded to build FABs
  document.dispatchEvent({ type: 'DOMContentLoaded' });

  // Invoke chatbot FAB handler
  const chatbotFab = document.getElementById('fab-chatbot');
  // Simulate keyboard activation so focus tracking works
  chatbotFab.focus();
  chatbotFab.eventHandlers.click[0]();
  await new Promise(r => setImmediate(r));

  assert.ok(called, 'initChatbot called after loading modal');

  const closeBtn = document.getElementById('chatbot-close');
  assert.ok(closeBtn, 'close button present');
  assert.strictEqual(closeBtn.getAttribute('aria-label'), 'Close');

  const input = document.getElementById('chatbot-input');
  assert.strictEqual(document.activeElement, input, 'focus moved to input');
  assert.strictEqual(input.tagName, 'TEXTAREA', 'chatbot input is a textarea');
  assert.strictEqual(input.getAttribute('rows'), '4');

  const send = document.getElementById('chatbot-send');
  const controls = document.getElementById('chatbot-controls');
  assert.ok(controls, 'controls container present');
  assert.strictEqual(controls.children[0], send, 'send button present in controls');
  assert.strictEqual(controls.children[1], closeBtn, 'close button present in controls');

  // Test language toggle
  const langCtrl = document.getElementById('langCtrl');
  langCtrl.onclick();
  assert.strictEqual(document.documentElement.lang, 'es');
  assert.strictEqual(langCtrl.textContent, 'EN');

  // Test theme toggle
  const themeCtrl = document.getElementById('themeCtrl');
  themeCtrl.onclick();
  assert.ok(document.body.classList.contains('dark'));

  // Send button should be enabled by default
  assert.ok(!send.disabled);

  // Test chat submit
  const form = document.getElementById('chatbot-input-row');
  const log = document.getElementById('chat-log');
  const container = document.getElementById('chatbot-container');
  input.value = 'Hi';
  await form.onsubmit({ preventDefault() {} });
  assert.strictEqual(log.children.length, 2);
  assert.strictEqual(log.children[0].textContent, 'Hi');
  assert.strictEqual(log.children[1].textContent, 'hello');
  assert.strictEqual(container.style.display, 'flex');
  assert.ok(!send.disabled);

  // Close the modal via the close button and ensure focus returns to the FAB
  closeBtn.eventHandlers.click[0]();
  assert.strictEqual(document.activeElement, chatbotFab, 'focus restored to FAB after close');
});

test('chatbot not initialized when HTML missing', async () => {
  const document = new Document();
  const window = { document };
  window.addEventListener = () => {};
  window.dispatchEvent = () => {};
  const context = vm.createContext({ window, document, console, fetch: null, setTimeout });
  context.window.initDraggableModal = () => {};

  // fetch stub returning no chatbot container
  context.fetch = async () => ({ text: async () => '<div></div>' });

  // Load scripts
  runScripts(context, ['fabs/js/chattia.js', 'cojoinlistener.js']);

  let called = false;
  context.window.initChatbot = () => { called = true; };

  document.dispatchEvent({ type: 'DOMContentLoaded' });
  const chatbotFab = document.getElementById('fab-chatbot');
  await chatbotFab.eventHandlers.click[0]();

  assert.ok(!called, 'initChatbot not called when HTML missing');
});

test('chatbot FAB click is idempotent', async () => {
  const document = new Document();
  const window = { document };
  window.addEventListener = () => {};
  window.dispatchEvent = () => {};
  const context = vm.createContext({ window, document, console, fetch: null, setTimeout });
  context.window.initDraggableModal = () => {};

  // fetch stub for modal and chat responses
  const chatbotHtml = '<div id="chatbot-container"></div>';
  context.fetch = async (url) => ({ text: async () => chatbotHtml });

  // Load scripts
  runScripts(context, ['fabs/js/chattia.js', 'cojoinlistener.js']);

  // Spy on initChatbot to track invocation count
  let count = 0;
  const realInit = context.window.initChatbot;
  context.window.initChatbot = () => { count++; realInit(); };

  // Trigger DOMContentLoaded to build FABs
  document.dispatchEvent({ type: 'DOMContentLoaded' });

  // Invoke chatbot FAB handler twice
  const chatbotFab = document.getElementById('fab-chatbot');
  chatbotFab.eventHandlers.click[0]();
  await new Promise(r => setImmediate(r));
  chatbotFab.eventHandlers.click[0]();
  await new Promise(r => setImmediate(r));

  // Ensure initChatbot called only once
  assert.strictEqual(count, 1, 'initChatbot only called once');

  // Ensure only one chatbot container exists
  const containers = document.querySelectorAll('#chatbot-container');
  assert.strictEqual(containers.length, 1, 'only one chatbot container appended');
});

test('hideModal clears chatbot state and clearChatbot is idempotent', async () => {
  const document = new Document();
  const window = { document };
  window.addEventListener = () => {};
  window.dispatchEvent = () => {};
  const sessionStorage = {
    store: {},
    setItem(k, v) { this.store[k] = String(v); },
    getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
    removeItem(k) { delete this.store[k]; }
  };
  window.sessionStorage = sessionStorage;
  const context = vm.createContext({ window, document, console, setTimeout, clearTimeout, fetch: null, sessionStorage });
  context.window.initDraggableModal = () => {};

  const chatbotHtml = '<div id="chatbot-container"></div>';
  context.fetch = async () => ({ text: async () => chatbotHtml });

  runScripts(context, ['fabs/js/chattia.js', 'cojoinlistener.js']);

  document.dispatchEvent({ type: 'DOMContentLoaded' });

  const chatbotFab = document.getElementById('fab-chatbot');
  chatbotFab.eventHandlers.click[0]();
  await new Promise(r => setImmediate(r));

  const log = document.getElementById('chat-log');
  const msg = new Element('div');
  msg.textContent = 'hi';
  log.appendChild(msg);
  sessionStorage.setItem('chatbotSession', 'abc');
  sessionStorage.setItem('chatbotHistory', '[]');
  window.chatbotIdleTimer = setTimeout(() => {}, 1000);

  let clearCount = 0;
  const realClear = context.window.clearChatbot;
  context.window.clearChatbot = () => { clearCount++; realClear(); };

  const closeBtn = document.getElementById('chatbot-close');
  closeBtn.eventHandlers.click[0]();

  assert.strictEqual(clearCount, 1, 'clearChatbot called once on close');
  assert.strictEqual(log.children.length, 0, 'chat log cleared');
  assert.strictEqual(sessionStorage.getItem('chatbotSession'), null, 'session cleared');
  assert.strictEqual(window.chatbotIdleTimer, null, 'idle timer cleared');

  // Calling clearChatbot again should be safe and keep state cleared
  context.window.clearChatbot();
  assert.strictEqual(log.children.length, 0, 'chat log still cleared after second call');
  assert.strictEqual(sessionStorage.getItem('chatbotHistory'), null, 'session variables remain cleared');
  assert.strictEqual(window.chatbotIdleTimer, null, 'idle timer remains cleared');
});

