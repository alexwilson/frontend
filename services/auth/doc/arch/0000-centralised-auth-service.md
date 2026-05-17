# 0000. Centralised auth service for identity and capability brokering

Date: 2026-05-17

## Status

Accepted

## Context

The plan is to run a growing set of applications on this domain: a CMS
today, a photo-sync app next, and longer term, services that
non-technical family members will use. These applications differ in what
they do but share four needs.

**Identity.** Each user has one identity across apps. The person who
signs in to the CMS is the same person who later opens the photo app,
and shouldn't have to sign in twice.

**Protected access.** Some apps (admin tooling, CMS publishing) must be
restricted to specific users. Some operations within an app (read vs.
write vs. publish) need finer grain than "the user is signed in".

**Brokered upstream credentials.** An app that integrates with GitHub
or Google or anything else needs a token to call that provider. The app
shouldn't hold that token long-term or in a wide-scoped form.

**Hardened security primitives.** CSRF, cookie hygiene, OAuth state,
PKCE, JWT signing and verification, allowlists, rate limiting,
revocation. None of these are app-specific. Reimplementing them in each
app guarantees they end up inconsistent, and at least one will be wrong.

Doing this per app has concrete problems that are already visible in
the current CMS:

- The CMS holds a single GitHub token directly, scoped wide enough to
  do everything the CMS needs. Any compromise of the CMS (XSS, dep
  attack, accidental log capture) leaks a long-lived credential that
  authorises every action the CMS can take.
- Granting limited access, like a read-only viewer for the same CMS
  content, isn't possible without a separate app holding a separate
  token with different scope. Scope is dictated by the upstream
  provider's permission model, not by us.
- Even if each app handled its own token brokering carefully, it would
  be locked to one identity provider. Adding a second app that wants a
  different provider, or sharing identity across providers, means
  rewriting every app's integration.
- The current SPA-side OAuth flow effectively produces an implicit-grant
  credential in browser JS. That's well-understood to be exfiltrable via
  XSS. Hardening it per app means each app gets its own CSP, its own
  cookie hygiene, its own refresh handling. None of that is CMS-specific.
- Cross-cutting capabilities like an admin UI for who's signed in, a
  single "kick this device" affordance, or fine-grained per-scope
  tokens, can't really live in any single app.

## Decision

Build a dedicated auth service as a Cloudflare Worker that owns identity
and brokers per-app capability tokens for every application on the
domain.

The service is responsible for:

- **Identity.** A single source of truth for who a user is. OAuth flows
  with the configured identity providers terminate here. All apps look
  up the same user via the same session cookie.
- **Capability brokering.** Apps that need an upstream credential
  request one via a short-lived exchange. The auth service holds the
  refresh tokens; apps receive scope-restricted access tokens with short
  TTLs.
- **Provider abstraction.** Identity providers and per-app upstream
  integrations are pluggable. Today both are GitHub; tomorrow either
  axis can change or expand without rewriting consuming apps.
- **Authorisation.** Fine-grained scopes per call, intersected against
  what the app can grant and what the user is allowed to request.
  Role-based UX in the admin layer maps to scope sets, so the
  user-facing concept stays simple while the wire-level decisions stay
  precise.
- **Admin surface.** One UI to manage users, invitations, per-app links,
  sessions, and per-device revocation.
- **Security primitives.** PKCE, state binding, signed JWTs with a
  rotated JWKS, allowlist gating on sign-up, cookie hygiene, CSRF
  defence, idle revocation. Written once, used by every consuming app
  with no further code on the app's part.

Consuming apps know almost nothing about authentication beyond "present
a session cookie, get a capability token for what you need."

## Consequences

**Positive:**

- One place to harden. Security review focuses on one codebase, not on
  N integrations across apps that will drift.
- Per-app blast radius. The CMS's token is narrowly-scoped, short-lived,
  and brokered per-request. CMS compromise no longer means leaking a
  wide-scoped long-lived credential.
- Adding a new app is O(1): write an `AppPlugin`, register an OAuth
  provider, list scopes. All the security primitives are inherited.
  Apps don't reimplement CSRF, allowlist, cookie scoping, etc.
- Fine-grained access becomes possible: read-only roles, scope-restricted
  tokens for external integrations, per-call scope reduction. All
  natural in this model.
- Identity providers are swappable. Today GitHub; tomorrow we could add
  Google, an OIDC corporate IdP, or a passkey-only setup, and the apps
  don't change.
- Cross-cutting features (admin UI, kick-device, allowlist) have an
  obvious home.

**Negative:**

- The auth service becomes a single point of failure. Every consuming
  app depends on it being up. A bug in the auth service breaks every
  app that consumes it.
- Operational responsibility shifts to one place. There's a deployment
  to monitor, secrets to rotate, an admin UI to keep usable. For a
  personal site this is acceptable but non-trivial.
- The auth service is a high-value target. It holds the credential
  material for every app and the session state for every user. Defence
  in depth must be more rigorous here than for any individual app.
- Initial implementation cost is non-trivial. The service has to exist
  and be solid before any app can rely on it. Building the first
  consuming app and the auth service in parallel produces churn in both.
- Coupling: every app now depends on the auth service's interface
  contracts (cookie names, endpoint shapes, JWT claims). Breaking
  changes require coordinated deploys.

## References

Subsequent ADRs make specific design choices within this vision:

- [0001](./0001-use-better-auth.md): the underlying auth library.
- [0004](./0004-appplugin-registry.md): how apps register with the service.
- [0005](./0005-two-jwt-token-exchange.md): how capability tokens are brokered.
- [0008](./0008-scope-based-authorization.md): the fine-grained authorisation model.
