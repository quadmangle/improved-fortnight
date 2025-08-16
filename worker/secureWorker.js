/**
 * Verifies the hCaptcha token by sending it to the hCaptcha API.
 * @param {string} token The hCaptcha token from the client.
 * @param {string} secret The hCaptcha secret key from environment variables.
 * @returns {Promise<boolean>} True if the token is valid, false otherwise.
 */
async function verifyCaptcha(token, secret) {
  if (!token) {
    console.warn('CAPTCHA verification failed: No token provided.');
    return false;
  }
  if (!secret) {
    console.error('FATAL: HCAPTCHA_SECRET_KEY is not set in worker environment.');
    // In a real scenario, this should trigger an alert for the admin.
    return false;
  }

  const formData = new URLSearchParams();
  formData.append('secret', secret);
  formData.append('response', token);
  // formData.append('remoteip', remoteIp); // Optional: pass user's IP

  try {
    const response = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const result = await response.json();
    if (!result.success) {
      console.warn('CAPTCHA verification failed:', result['error-codes']);
    }
    return result.success;
  } catch (error) {
    console.error('Error during hCaptcha verification request:', error);
    return false;
  }
}

export default {
  async fetch(request, env) {
    const auth = request.headers.get('Authorization') || '';
    const match = auth.match(/^Bearer ([^.]+)\.([^.]+)$/);
    if (!match) {
      console.warn('Unauthorized request: missing or malformed token');
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const tokenIv = new Uint8Array(base64ToArrayBuffer(match[1]));
      const tokenCipher = new Uint8Array(base64ToArrayBuffer(match[2]));
      const key = await crypto.subtle.importKey(
        'raw',
        base64ToArrayBuffer(env.AES_KEY),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      const decoder = new TextDecoder();
      const tokenBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: tokenIv }, key, tokenCipher);
      const tokenData = JSON.parse(decoder.decode(tokenBuf));
      if (tokenData.exp <= Date.now()) {
        console.warn('Unauthorized request: expired token');
        return new Response('Unauthorized', { status: 401 });
      }

      const body = await request.json();
      const payloadIv = new Uint8Array(body.iv);
      const payloadCipher = new Uint8Array(base64ToArrayBuffer(body.payload));
      const decryptedBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: payloadIv }, key, payloadCipher);
      const payload = JSON.parse(decoder.decode(decryptedBuf));

      // --- CAPTCHA Verification Step ---
      const captchaToken = payload['h-captcha-response'];
      const isCaptchaValid = await verifyCaptcha(captchaToken, env.HCAPTCHA_SECRET_KEY);

      if (!isCaptchaValid) {
        console.warn('Unauthorized request: invalid CAPTCHA');
        return new Response('Unauthorized: Invalid CAPTCHA', { status: 401 });
      }

      // If captcha is valid, proceed with processing the payload.
      // (Actual data processing logic would go here)
      console.log('CAPTCHA verified. Payload received:', payload);

      return new Response(JSON.stringify({ status: 'success', received: payload }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.warn('Unauthorized request: invalid token or payload', err);
      return new Response('Unauthorized', { status: 401 });
    }
  }
};

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
