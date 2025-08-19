/**
 * Environment bindings required for this Worker.
 *
 * Configure these in `wrangler.toml` or via `wrangler secret put` so the
 * referenced `env.*` variables resolve at runtime:
 *
 * - `APPS_SCRIPT_URL` **(secret)**: Webhook that receives test results. Used in
 *   `notify` when posting `fetch(env.APPS_SCRIPT_URL)`.
 * - `SECURITY_EMAIL`: Address for MailChannels alerts. Consumed by
 *   `sendEmail`.
 * - `PRIVATE_KEY` **(secret)**: PEM key for RSA-PSS SHA-256 signing in
 *   `signPayload`.
 * - `AUDIT_LOG`: KV namespace binding storing the `time | date | type | ip`
 *   audit trail accessed by `logEvent` and `logAlertFailure`.
 */
let tests;

async function runAll(env, ip) {
  if (!tests) {
    ({ default: tests } = await import('../tests/bundle.js'));
  }
  const results = [];
  for (const testFn of tests) {
    const name = testFn.name || 'anonymous';
    try {
      await testFn();
      results.push({ name, status: 'pass' });
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      let type = 'failure';
      if (/intrusion/i.test(message)) type = 'intrusion';
      else if (/injection/i.test(message)) type = 'injection';
      else if (err instanceof Error) type = 'error';
      results.push({ name, status: 'fail', error: message, type });
      await notify(env, type, ip, { name, message });
    }
  }
  return results;
}

async function notify(env, type, ip, detail) {
  const now = new Date();
  const payload = { timestamp: now.toISOString(), type, ip, detail };
  const signature = await signPayload(payload, env.PRIVATE_KEY);
  payload.signature = signature;
  const body = JSON.stringify(payload);

  const operations = [
    fetch(env.APPS_SCRIPT_URL || 'https://Apps Script here', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    }),
    sendEmail(env.SECURITY_EMAIL, body),
    logEvent(env, type, ip, now)
  ];

  const results = await Promise.allSettled(operations);
  for (const r of results) {
    if (r.status === 'rejected') {
      await logAlertFailure(env, ip, r.reason);
    }
  }
}

async function logEvent(env, type, ip, now) {
  if (!env.AUDIT_LOG) {
    console.warn('AUDIT_LOG not configured; event not logged');
    return;
  }
  const row = `${now.toTimeString().split(' ')[0]} | ${now.toISOString().split('T')[0]} | ${type} | ${ip}`;
  await env.AUDIT_LOG.put(now.toISOString(), row);
}

async function logAlertFailure(env, ip, error) {
  console.warn('Alert dispatch failed:', error);
  if (!env.AUDIT_LOG) {
    console.warn('AUDIT_LOG not configured; alert_failure not logged');
    return;
  }
  const now = new Date();
  const row = `${now.toTimeString().split(' ')[0]} | ${now.toISOString().split('T')[0]} | alert_failure | ${ip}`;
  try {
    await env.AUDIT_LOG.put(`${now.toISOString()}-alert_failure`, row);
  } catch (err) {
    console.warn('Failed to log alert_failure:', err);
  }
}

async function sendEmail(address, content) {
  if (!address) return;
  return fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: address }] }],
      from: { email: 'noreply@opsonlinessupport.com' },
      subject: 'Security Test Alert',
      content: [{ type: 'text/plain', value: content }]
    })
  });
}

async function signPayload(data, pemKey) {
  if (!pemKey) return '';
  const encoder = new TextEncoder();
  const der = pemKey.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const binary = atob(der);
  const buffer = new Uint8Array([...binary].map(c => c.charCodeAt(0))).buffer;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    buffer,
    { name: 'RSA-PSS', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'RSA-PSS', saltLength: 32 },
    key,
    encoder.encode(JSON.stringify(data))
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export { notify, logAlertFailure };

export default {
  async scheduled(event, env, ctx) {
    const ip = event.request?.headers.get('cf-connecting-ip') || 'n/a';
    await runAll(env, ip);
  },
  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      const ip = request.headers.get('cf-connecting-ip') || 'n/a';
      ctx.waitUntil(runAll(env, ip));
      return new Response('Tests triggered', { status: 202 });
    }
    return new Response('OK');
  }
};
