const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

const config = fs.readFileSync('netlify.toml', 'utf8');

test('netlify config sets strict transport security', () => {
  assert.match(
    config,
    /Strict-Transport-Security\s*=\s*"max-age=31536000; includeSubDomains; preload"/
  );
});

test('netlify config sets referrer policy', () => {
  assert.match(config, /Referrer-Policy\s*=\s*"strict-origin-when-cross-origin"/);
});

test('netlify config sets nosniff option', () => {
  assert.match(config, /X-Content-Type-Options\s*=\s*"nosniff"/);
});
