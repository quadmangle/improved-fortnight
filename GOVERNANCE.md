# Project Governance

## Compliance Overview

- **NIST SP-800-63** – Session management uses 128-bit nonces generated with `crypto.getRandomValues` and rotated per request to maintain session integrity.
- **CISA Cyber Essentials** – Strict session controls and nonce validation support boundary protection and access control guidance.
- **PCI DSS Requirements 8 & 10** – Per-request nonce verification and logging help enforce unique user authentication and traceability.

Nonces are stored only in session memory or an HttpOnly, Secure, SameSite cookie and are invalidated after use or timeout.

## CSRF Protection

- Client-side CSRF token generation has been removed.
- Forms must obtain server-generated tokens from `/api/csrf-token` and store them in a secure, HttpOnly cookie before submission.
