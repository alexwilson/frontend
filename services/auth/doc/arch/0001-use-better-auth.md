# 0001. Use better-auth for identity + session management

Date: 2026-05-17

## Status

Accepted

## Context

Given the decision to build a dedicated auth service ([ADR 0000](./0000-centralised-auth-service.md)),
that service needs a foundation for OAuth round-trips, session management,
JWT signing, and admin operations. Building these primitives correctly
is hard. PKCE, state binding, session expiry, JWKS rotation, account
linking, replay defence: any one of them gone wrong means account
takeover or a credential leak.

The OAuth and session space is stable and well-served by mature
libraries. Reimplementing the primitives ourselves means re-litigating
years of accumulated security learnings. Adopting a maintained library
inherits that work.

Constraints specific to this project:

- Cloudflare Workers runtime (no Node-only deps).
- D1 as the only persistence option (no Postgres or Redis).
- Multi-app capability brokering: one identity, many apps, each linking
  to a separate upstream provider account
  ([ADR 0004](./0004-appplugin-registry.md)).
- TypeScript end-to-end. The library must be typed first-class, not Flow
  or JSDoc.

## Decision

We will adopt [better-auth](https://better-auth.com) (v1.6.x) as the
identity and session layer. It will own:

- OAuth providers (`github` social provider for identity, `genericOAuth`
  for per-capability GitHub Apps).
- Session creation and cookie management.
- JWT signing and JWKS publication (via the `jwt` plugin), used by our
  custom token-exchange endpoint (see
  [ADR 0005](./0005-two-jwt-token-exchange.md)).
- Admin functions (role/ban/delete/list-sessions) via the `admin` plugin.
- Database hooks for the email allowlist gate (`user.create.before`).

We will *not* use better-auth's client SDK for SPA flows where it
doesn't naturally fit. The brokered-token probe in the CMS, for
example, hits our own endpoint directly.

## Consequences

**Positive:**
- We inherit PKCE, state CSRF binding, session expiry, JWT minting, JWKS
  publication, and the admin API. All already implemented and tested.
- The drizzle adapter integrates cleanly with our chosen ORM
  ([ADR 0002](./0002-drizzle-orm-with-cloudflare-d1.md)).
- Active maintenance and a growing ecosystem.

**Negative:**
- Vendor coupling: better-auth's API shape can change between minor
  versions, so upgrades require diff-reading. We pin minor versions and
  only bump deliberately.
- Better-auth's session model is shared-token-per-user, not per-session.
  This drove [ADR 0009](./0009-session-bound-jwt-1.md)'s design. We
  can't get per-session upstream identity isolation without forking.
- Some friction adapting their assumptions to our specific needs. For
  example, scope-based authz layered on top
  ([ADR 0008](./0008-scope-based-authorization.md)).

**Neutral:**
- Better-auth ships an `additionalFields` config option for extending
  the user/session/account schemas. We use it for fields we want
  surfaced via their API, like `account.lastIssuedAt` and the session
  geo fields populated by the `databaseHooks.session.create.before`
  hook, rather than forking the schema modelling.

## References

- [better-auth documentation](https://better-auth.com/docs)
- [RFC 6749, OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7636, PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [RFC 9700, OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/rfc9700)
  (PKCE, state CSRF binding, exact redirect URI matching: all
  implemented by better-auth)
