# 0006. Per-app cookie path-scoping

Date: 2026-05-17

## Status

Accepted

## Context

The auth worker brokers credentials for multiple capability apps (see
[ADR 0004](./0004-appplugin-registry.md)). Each app's JWT #1 identity
cookie ([ADR 0005](./0005-two-jwt-token-exchange.md)) is bound to one
specific app, and shouldn't be sent to any other app's request path.

Without per-app scoping, a single cookie sits at `/auth/` and is sent
on every request under the prefix. Blast radius of a leak: every app's
broker endpoint sees it. With future multi-app deployments and the
prospect of non-technical users (family members per the long-term
plan), this cross-app exposure becomes a real concern.

## Decision

JWT #1 cookies are **path-scoped to `/auth/app/<id>/`**. Each app gets
its own cookie space:

| Cookie | Path | Visibility |
|---|---|---|
| `__Secure-auth.session` (better-auth) | `/auth/` | Sent to every `/auth/*` request |
| `__Secure-auth.id` (JWT #1, CMS) | `/auth/app/cms/` | Sent only to `/auth/app/cms/*` |
| `__Secure-auth.id` (JWT #1, future photo app) | `/auth/app/photo/` | Sent only to `/auth/app/photo/*` |

Multiple cookies share the name `auth.id`. The browser stores them as
distinct cookies because their `Path` attributes differ. Only the
matching-path cookie is sent on any given request.

On sign-out we explicitly clear each per-app cookie (one `Set-Cookie`
with `Max-Age=0` per app).

## Consequences

**Positive:**
- App A's JWT #1 cookie is never sent to app B's endpoint. A leak of
  one app's broker path doesn't compromise another.
- The session cookie still covers the broader `/auth/*` surface for
  bootstrap and admin paths, which is what we want. The session is
  intentionally shared across apps for SSO.
- Reusing the name `auth.id` per app keeps the cookie vocabulary tight.

**Negative:**
- Sign-out has to enumerate every registered app to clear cookies.
  `handleAppSignOut` iterates `APPS` for this, so adding an app
  automatically picks up the clear.
- Browsers and developer tools occasionally surprise people with
  per-path cookies (DevTools shows multiple cookies with the same name,
  which looks like a bug at first glance).
- A subdomain that serves `/auth/app/<id>/*` paths would receive the
  cookie (path-matching is per-host-or-domain, not per-handler).
  Mitigated by [ADR 0007](./0007-host-only-cookies.md) (host-only
  cookies).

## References

- [RFC 6265 §5.1.4, Cookie path matching](https://datatracker.ietf.org/doc/html/rfc6265#section-5.1.4)
