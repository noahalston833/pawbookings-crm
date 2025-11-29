# 0002: Cookie sessions instead of browser-stored bearer tokens

## Status

Accepted

## Context

A JSON API commonly authenticates SPA clients with either (a) a bearer
token the frontend stores itself (`localStorage`/`sessionStorage`) and
attaches to an `Authorization` header, or (b) a server-issued session
cookie. Token-in-storage is popular because it sidesteps CORS/cookie
configuration, but it means any successful XSS on the frontend can read
the token directly out of storage and exfiltrate it — there is no
`HttpOnly`-equivalent protection for `localStorage`.

## Decision

Use Rails' built-in cookie session store: `HttpOnly`, `Secure` (in
production), `SameSite=Lax` cookies, with standard Rails CSRF
protection on state-changing requests. The frontend never reads,
stores, or manually attaches an auth token — the browser sends the
cookie automatically, and `axios`/`fetch` calls are made with
`credentials: "include"`.

## Consequences

- CORS must explicitly allow credentials from the exact configured
  frontend origin (no wildcard origin is possible with credentialed
  requests, which is a feature, not a limitation, here).
- The frontend needs a CSRF token for mutating requests (fetched from a
  small endpoint and sent as a header), adding one extra request/step
  compared to a bearer token, in exchange for meaningfully better
  protection against token theft via XSS.
- Session theft still matters (see the threat model in the README) —
  cookie-based sessions protect against XSS reading the token, not
  against a compromised client machine or a MITM without HTTPS.
