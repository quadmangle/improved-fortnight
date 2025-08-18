const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const securityJs = fs.readFileSync(path.resolve(__dirname, '../js/security-utils.js'), 'utf8');
const utilsJs = fs.readFileSync(path.resolve(__dirname, '../js/utils.js'), 'utf8');

// Helper function to set up the DOM and load the script
function setupTestEnvironment(html) {
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  const { window } = dom;

  // Mock necessary browser APIs
  window.alert = () => {};
  window.fetch = () => Promise.resolve({ ok: true });
  window.grecaptcha = { ready: cb => cb(), execute: async () => 'token' };
  window.eval(utilsJs);
  window.eval(securityJs);

  // Load the script into the JSDOM context
  const cojoinScript = fs.readFileSync(path.resolve(__dirname, '../fabs/js/cojoin.js'), 'utf8');
  window.eval(cojoinScript);

  // Trigger DOMContentLoaded to run the script's initialization
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

  return dom;
}

test('Experience section adds numbered textareas', () => {
  const html = `
    <form id="joinForm">
      <div class="form-section" data-section="Experience">
        <div class="section-header">
          <h2>Experience</h2>
          <div>
            <button type="button" class="circle-btn add" title="Add field">+</button>
            <button type="button" class="circle-btn remove" title="Remove last field">−</button>
          </div>
        </div>
        <div class="inputs"></div>
        <button type="button" class="accept-btn">Accept</button>
        <button type="button" class="edit-btn" style="display:none;">Edit</button>
      </div>
    </form>
  `;
  const dom = setupTestEnvironment(html);
  const { document } = dom.window;

  const addBtn = document.querySelector('.form-section[data-section="Experience"] .circle-btn.add');
  addBtn.click();
  addBtn.click();

  const placeholders = [...document.querySelectorAll('.form-section[data-section="Experience"] textarea')].map(el => el.placeholder);
  assert.deepStrictEqual(placeholders, ['tell us about your Experience 1', 'tell us about your Experience 2']);
});

test('Continued Education section adds textarea with specific placeholder', () => {
  const html = `
    <form id="joinForm">
      <div class="form-section" data-section="Continued Education">
        <div class="section-header">
          <h2>Continued Education</h2>
          <div>
            <button type="button" class="circle-btn add" title="Add field">+</button>
            <button type="button" class="circle-btn remove" title="Remove last field">−</button>
          </div>
        </div>
        <div class="inputs"></div>
        <button type="button" class="accept-btn">Accept</button>
        <button type="button" class="edit-btn" style="display:none;">Edit</button>
      </div>
    </form>
  `;
  const dom = setupTestEnvironment(html);
  const { document } = dom.window;

  const addBtn = document.querySelector('.form-section[data-section="Continued Education"] .circle-btn.add');
  addBtn.click();

  const textarea = document.querySelector('.form-section[data-section="Continued Education"] textarea');
  assert.strictEqual(textarea.placeholder, 'Online Courses, Seminars, Webinars with Completion Certification');
});
