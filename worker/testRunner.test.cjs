const test = require('node:test');
const assert = require('node:assert');

let notify, logAlertFailure;

test.before(async () => {
  ({ notify, logAlertFailure } = await import('./testRunner.js'));
});

test('notify routes channel failures to logAlertFailure', async (t) => {
  const entries = [];
  const putMock = t.mock.fn((key, value) => {
    if (key.includes('alert_failure')) {
      entries.push(value);
      return Promise.resolve();
    }
    return Promise.reject(new Error('kv fail'));
  });
  const env = {
    APPS_SCRIPT_URL: 'https://opsonlinessupport.com',
    SECURITY_EMAIL: 'team@opsonlinessupport.com',
    AUDIT_LOG: { put: putMock }
  };
  t.mock.method(global, 'fetch', () => Promise.reject(new Error('network')));
  const warnMock = t.mock.method(console, 'warn');

  await notify(env, 'failure', '203.0.113.10', { name: 't', message: 'oops' });

  assert.strictEqual(entries.length, 3, 'three alert_failure entries logged');
  assert.strictEqual(warnMock.mock.callCount(), 3, 'console.warn called for each failure');
});

test('logAlertFailure warns if KV put fails', async (t) => {
  const putMock = t.mock.fn(() => Promise.reject(new Error('kv offline')));
  const env = { AUDIT_LOG: { put: putMock } };
  const warnMock = t.mock.method(console, 'warn');

  await logAlertFailure(env, '198.51.100.5', new Error('fail'));

  assert.strictEqual(putMock.mock.callCount(), 1);
  assert.strictEqual(warnMock.mock.callCount(), 2);
  assert.match(warnMock.mock.calls[1].arguments[0], /Failed to log alert_failure/);
});

test('notify warns when AUDIT_LOG missing', async (t) => {
  const env = { APPS_SCRIPT_URL: 'https://opsonlinessupport.com' };
  const warnMock = t.mock.method(console, 'warn');
  t.mock.method(global, 'fetch', () => Promise.resolve(new Response('ok')));

  await notify(env, 'failure', '192.0.2.1', { name: 't', message: 'fail' });

  assert.strictEqual(warnMock.mock.callCount(), 1);
  assert.match(warnMock.mock.calls[0].arguments[0], /AUDIT_LOG not configured; event not logged/);
});

test('logAlertFailure warns when AUDIT_LOG missing', async (t) => {
  const env = {};
  const warnMock = t.mock.method(console, 'warn');

  await logAlertFailure(env, '203.0.113.2', new Error('oops'));

  assert.strictEqual(warnMock.mock.callCount(), 2);
  assert.match(warnMock.mock.calls[1].arguments[0], /AUDIT_LOG not configured; alert_failure not logged/);
});
