const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

// Helper to extract a CSS block given a selector within a media query
function getMediaBlock(css, query) {
  const start = css.indexOf(query);
  if (start === -1) return '';
  const open = css.indexOf('{', start);
  let depth = 1;
  let i = open + 1;
  for (; i < css.length && depth > 0; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
  }
  return css.slice(open + 1, i - 1);
}

// Verify CSS rules for mobile navigation

test('mobile nav links use off-canvas layout', () => {
  const css = fs.readFileSync(path.join(root, 'css', 'style.css'), 'utf-8');
  const offCanvasMatch = css.match(/@media \(max-width: 768px\)[\s\S]*?\.nav-links\s*{[\s\S]*?position: fixed[\s\S]*?}/);
  assert.ok(offCanvasMatch, 'nav links should be positioned off-canvas');
  const navLinks = offCanvasMatch[0];
  assert.ok(navLinks.includes('right: 0'), 'nav links should align to the right');
  assert.ok(navLinks.includes('transform: translateX(100%)'), 'nav links should be translated off screen');
  assert.ok(navLinks.includes('transition: transform 0.3s'), 'nav links should animate when toggled');
  assert.ok(navLinks.includes('background: rgba(var(--clr-background-rgb), 0.85)'), 'nav links should have semi-transparent background');
  assert.ok(navLinks.includes('z-index: 900'), 'nav links should sit below toggles');

  const openMatch = css.match(/@media \(max-width: 768px\)[\s\S]*?\.nav-links\.open\s*{[\s\S]*?transform: translateX\(0\)[^}]*}/);
  assert.ok(openMatch, 'nav links should slide in when open');
});

test('ops-nav enables horizontal scrolling when cramped', () => {
  const css = fs.readFileSync(path.join(root, 'css', 'style.css'), 'utf-8');
  const navMatch = css.match(/@media \(max-width: 768px\)[\s\S]*?\.ops-nav\s*{[\s\S]*?}/);
  assert.ok(navMatch, '.ops-nav rules for mobile not found');
  const navBlock = navMatch[0];
  assert.ok(navBlock.includes('overflow-x: auto'), '.ops-nav should allow horizontal scrolling');
});

test('nav toggle sits above floating action button', () => {
  const styleCss = fs.readFileSync(path.join(root, 'css', 'style.css'), 'utf-8');
  const toggleMatch = styleCss.match(/@media \(max-width: 768px\)[\s\S]*?\.nav-menu-toggle\s*{[\s\S]*?z-index:\s*(\d+)/);
  assert.ok(toggleMatch, 'nav-menu-toggle z-index missing');
  const navZ = parseInt(toggleMatch[1], 10);

  const fabCss = fs.readFileSync(path.join(root, 'fabs', 'css', 'cojoin.css'), 'utf-8');
  const fabMatch = fabCss.match(/\.fab-container\s*{[\s\S]*?z-index:\s*(\d+)/);
  assert.ok(fabMatch, 'fab-container z-index missing');
  const fabZ = parseInt(fabMatch[1], 10);

  assert.ok(navZ > fabZ, 'nav toggle should have higher z-index than FAB');
});

// Verify HTML structure defaults (nav links closed)
const pages = ['index.html', 'contact-center.html', 'it-support.html', 'professional-services.html'];
for (const page of pages) {
  test(`nav links closed by default on ${page}`, () => {
    const html = fs.readFileSync(path.join(root, page), 'utf-8');
    assert.match(html, /<div class="nav-links" id="primary-nav">/);
    assert.ok(!/<div class="nav-links open"/.test(html), 'nav links should not be open by default');
  });
  test(`mobile nav contains required controls on ${page}`, () => {
    const html = fs.readFileSync(path.join(root, page), 'utf-8');
    assert.match(html, /<a[^>]*class="[^"]*ops-logo[^"]*"/i, 'OPS logo missing');
    assert.match(html, /<button[^>]*class="[^"]*lang-toggle[^"]*"/i, 'language toggle missing');
    assert.match(html, /<button[^>]*class="[^"]*theme-toggle[^"]*"/i, 'theme toggle missing');
    assert.match(html, /<button[^>]*class="[^"]*nav-menu-toggle[^"]*"/i, 'menu toggle missing');
  });
}

