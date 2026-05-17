# 0007. Host-only cookies (no `Domain` attribute)

Date: 2026-05-17

## Status

Accepted

## Context

The auth worker serves `alexwilson.tech` with SPA consumers on the apex
and on subdomains (e.g. `local.alexwilson.tech` during dev).
Cross-subdomain fetches need to carry the session cookie. The obvious
configuration is `Domain=alexwilson.tech`, which makes the cookie
available to every subdomain.

Threat: **subdomain takeover.** A dangling CNAME or abandoned platform
deployment on `*.alexwilson.tech` lets an attacker host content under a
subdomain. With `Domain=alexwilson.tech`, the browser sends the auth
cookies to the takenover subdomain and the attacker reads sessions.
DNS hygiene reduces but does not eliminate this risk; the cookie's
`Domain` attribute is the multiplier that turns every subdomain that
ever existed into an attack surface for stored credentials.

The non-obvious force here: cookies don't strictly need the `Domain`
attribute for cross-subdomain SPA flows. A host-only cookie set by
`alexwilson.tech` is sent on requests *to* `alexwilson.tech` regardless
of which subdomain *initiated* the fetch, because the browser binds the
cookie to the cookie's host rather than the requesting origin. A
cross-subdomain fetch (`local.alexwilson.tech` → `alexwilson.tech`)
carries the cookie correctly under SameSite=Lax because the registrable
domain is the same (same-site, not same-origin).

## Decision

Drop the `Domain` attribute on **all** auth cookies (session, JWT #1).
Cookies are host-only, bound to `alexwilson.tech` exactly.

The `COOKIE_DOMAIN` env var is removed. Better-auth's session cookie
attributes no longer set `domain`, and our manual JWT #1
serialisation omits `Domain=` from `Set-Cookie`.

## Consequences

**Positive:**
- A takenover subdomain can't read the auth cookies via `document.cookie`
  (cookies are scoped to the apex host and not visible elsewhere).
- A takenover subdomain can't have the cookies sent to it on incoming
  requests (browsers only send a cookie to the host it's bound to).
- Cross-subdomain SPA → auth-worker fetches still work: the cookie's
  host matches the request target, and SameSite=Lax allows same-site
  (shared eTLD+1) requests.

**Negative:**
- A takenover subdomain *can* still trigger cross-origin fetches *to*
  the apex with credentials attached (the browser sends the cookie on
  requests destined for the cookie's host). It can't read the
  response (CORS blocks), so the attack reduces to state-changing
  requests, which other layers mitigate.
- If we ever serve auth on a separate subdomain (e.g.
  `auth.alexwilson.tech`), every consuming origin must be configured
  for that exact host.
- People expect cookies to have `Domain=...`. Its absence in DevTools
  reads as a misconfiguration to anyone unfamiliar with the trade-off.

## References

- [RFC 6265 §5.3, Cookie storage model](https://datatracker.ietf.org/doc/html/rfc6265#section-5.3)
- [OWASP: Subdomain Takeover](https://owasp.org/www-community/attacks/Subdomain_takeover)
