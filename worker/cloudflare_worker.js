// Cloudflare worker handling form submissions
// Used by: contactWorker.js, joinWorker.js
// 1. Validates nonce against dedicated nonce worker
// 2. Scans for simple injection attempts
// 3. Verifies reCAPTCHA token
// 4. Encrypts cleaned payload with Apps Script public key
// 5. Sends encrypted payload to Apps Script endpoint

const SUSPICIOUS_PATTERN = /<[^>]*>|javascript:|data:/i;

function hasSuspicious(value) {
  return typeof value === 'string' && SUSPICIOUS_PATTERN.test(value);
}

function detectSuspicious(obj) {
  return Object.values(obj).some((v) => {
    if (typeof v === 'object' && v !== null) {
      return detectSuspicious(v);
    }
    return hasSuspicious(v);
  });
}

async function verifyRecaptcha(token, secret) {
  if (!token || !secret) return false;
  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: params
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('reCAPTCHA verification error', err);
    return false;
  }
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function encryptPayload(payload, publicKeyPem) {
  const pem = publicKeyPem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const keyData = base64ToArrayBuffer(pem);
  const key = await crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, encoded);
  return arrayBufferToBase64(cipher);
}

async function logSuspicious(attempt, env) {
  try {
    await fetch(env.LOG_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attempt)
    });
  } catch (err) {
    console.error('Failed to log suspicious attempt', err);
  }
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      return new Response('Bad Request', { status: 400 });
    }

    const { nonce, recaptchaToken, ...data } = payload;
    if (!nonce || !recaptchaToken) {
      return new Response('Bad Request', { status: 400 });
    }

    // Verify nonce uniqueness
    const nonceRes = await fetch(env.NONCE_CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce })
    });
    if (!nonceRes.ok) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Detect injection or code
    if (detectSuspicious(data)) {
      await logSuspicious({ nonce, data }, env);
      return new Response('Forbidden', { status: 403 });
    }

    // Verify reCAPTCHA
    const captchaOk = await verifyRecaptcha(recaptchaToken, env.RECAPTCHA_SECRET);
    if (!captchaOk) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Encrypt data
    let encrypted;
    try {
      encrypted = await encryptPayload(data, env.APPS_SCRIPT_PUBLIC_KEY);
    } catch (err) {
      console.error('Encryption failed', err);
      return new Response('Internal Error', { status: 500 });
    }

    // Send to Apps Script
    const appRes = await fetch(env.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce, payload: encrypted })
    });

    if (!appRes.ok) {
      return new Response('Upstream Error', { status: 502 });
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
