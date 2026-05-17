# 0005. Two-JWT token exchange (identity + capability)

Date: 2026-05-17

## Status

Accepted

## Context

The CMS SPA needs to wield a GitHub `ghu_*` token against
`api.github.com` to commit content. Three shapes were considered:

1. **Cookie-only with server-side proxy.** SPA never sees the token;
   GitHub calls go through a backend that attaches it server-side. (See
   `services/cms/BFF.md`, deferred Plan B.)
2. **Pure Bearer token.** SPA holds the GitHub token and sends it
   directly. Maximally simple, maximally XSS-exposed.
3. **Token exchange.** SPA presents its session and gets back a
   short-lived capability token that carries identity, scope, and the
   upstream credential. Shape inspired by RFC 8693.

Forces:

- The CMS needs to call GitHub from the browser (Decap's backend wants
  a bearer token to attach to its own fetches).
- We want the worker to be the authority on "is this user allowed to
  call this app?", not GitHub permissions alone.
- We want auditable, verifiable claims: a downstream resource server
  should be able to verify what was granted.
- We want a per-app blast-radius story so that one app's credential
  leak doesn't compromise another.

## Decision

Token exchange with **two JWTs**, both signed by the worker's JWKS
(managed by better-auth's `jwt` plugin and published via the
standard JWKS endpoint):

**JWT #1, identity assertion.** HttpOnly cookie scoped per app (see
[ADR 0006](./0006-per-app-cookie-path-scoping.md)). Short-lived.
`typ='identity'`. Carries a `sid` claim (session id, see
[ADR 0009](./0009-session-bound-jwt-1.md)) so we can revoke it
out-of-band. Caches the session lookup, so subsequent capability
calls don't re-hit the session store.

**JWT #2, capability/access token.** Returned in the response body
of the per-app token endpoint. `typ='access'`. Contains identity
claims (`sub`, `email`), the intersected `scope`, the upstream
`access_token`, and any app-specific claims via `AppPlugin.claims()`.
Short-lived. The SPA decodes it client-side (no signature check; it
trusts the worker) and uses `access_token` for its upstream calls.

Type confusion between #1 and #2 is prevented by the `typ` claim;
cross-app confusion by the `app` claim. Both checks happen on every
verify.

## Consequences

**Positive:**
- The SPA gets a token it can use against GitHub directly. No proxy
  needed, which keeps the CMS architecture simple.
- JWT #1 caches identity over its short lifetime, so most
  token-broker calls skip the session DB hit.
- Both JWTs are verifiable via the published JWKS. Any downstream
  resource server can verify them with no out-of-band coordination.
- Shape mirrors RFC 8693 and RFC 9068, so future external verifiers
  slot in.
- Per-app blast radius via cookie path-scoping
  ([ADR 0006](./0006-per-app-cookie-path-scoping.md)).

**Negative:**
- The SPA holds the upstream `access_token` in JS memory for the
  life of JWT #2. XSS at the CMS origin can exfil it. The deferred
  BFF design (`services/cms/BFF.md`) removes the SPA's exposure
  entirely.
- Two JWT signings per mint, one each. Cheap (Ed25519, ~ms) but not
  free.
- More moving pieces than a plain cookie + getSession flow.

**Neutral:**
- We don't use better-auth's `getToken` endpoint. The plugin's
  default token route exists but is unused. We mint our own JWTs
  through the auth API to get full control of the payload shape per
  JWT.

## References

- [RFC 7519, JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 8693, OAuth 2.0 Token Exchange](https://datatracker.ietf.org/doc/html/rfc8693)
- [RFC 9068, JWT Profile for OAuth 2.0 Access Tokens](https://datatracker.ietf.org/doc/html/rfc9068)
- [RFC 7517, JSON Web Key Set](https://datatracker.ietf.org/doc/html/rfc7517)
- [RFC 6750, Bearer Token Usage](https://datatracker.ietf.org/doc/html/rfc6750)
  (how the SPA wields the `access_token` extracted from JWT #2 against
  `api.github.com`).
- `services/cms/BFF.md`, the deferred Plan B that removes the SPA's exposure.
