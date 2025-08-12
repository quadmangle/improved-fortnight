# Improved Fortnight

This project hosts static web assets. Deployment on Netlify applies additional
security hardening and observability.

## Security Headers

Netlify is configured via `netlify.toml` to include the following HTTP
response headers for all pages:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: no-referrer`
- `X-Content-Type-Options: nosniff`

## Validation

Run the automated test suite to ensure the header configuration remains
present:

```sh
npm test
```

For production deployments, scan the live site with tools like [Mozilla
Observatory](https://observatory.mozilla.org/) to verify these headers are
served correctly.

## Governance

See [GOVERNANCE.md](GOVERNANCE.md) for how this project aligns with NIST SP-800-63, CISA Cyber Essentials, and PCI DSS requirements 8 and 10.
