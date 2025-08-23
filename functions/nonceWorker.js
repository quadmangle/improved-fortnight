export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    let nonce;
    try {
      ({ nonce } = await request.json());
    } catch (err) {
      return new Response('Bad Request', { status: 400 });
    }
    if (!nonce) {
      return new Response('Bad Request', { status: 400 });
    }

    const exists = await env.USED_NONCES.get(nonce);
    if (exists) {
      return new Response(JSON.stringify({ error: 'nonce-reused' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.USED_NONCES.put(nonce, '1', { expirationTtl: 86400 });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
