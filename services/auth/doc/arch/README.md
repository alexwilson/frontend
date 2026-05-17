# Architecture Decision Records

This directory holds the load-bearing architectural decisions for this
repository, written in [Michael Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

Each ADR is short, focused, and immutable. When a decision changes, write
a new ADR that **supersedes** the old one and cross-link both ways. Don't
edit accepted ADRs in place; the historical record matters as much as the
current state.

## Format

```
# NNNN. Title in noun-phrase form

Date: YYYY-MM-DD

## Status

Accepted | Proposed | Deprecated | Superseded by NNNN

## Context

The forces in tension and the problem being solved. State the *non-obvious*
constraints; anyone can re-derive the obvious ones from the code.

## Decision

The choice made, in the active voice. ("We will use X.")

## Consequences

What becomes easier or harder as a result. Include negatives honestly.
ADRs are not advocacy.
```

## What gets an ADR (and what doesn't)

**Has an ADR:**
- Choices that shape what's possible later (frameworks, schemas, security primitives).
- Choices that traded off competing forces (security vs. UX, simplicity vs. flexibility).
- Choices that future contributors would otherwise re-litigate, probably reversing them without realising the original reasons.

**Doesn't:**
- Library version bumps.
- File layout and naming conventions. Those belong in `CLAUDE.md` or the relevant README.
- Bug fixes, unless the fix changed an invariant.

## Related design docs

ADRs capture *decisions*. Longer designs that aren't yet decisions live next
to the code that would implement them:

- [`../../GitHubWebhookIntegration.md`](../../GitHubWebhookIntegration.md):
  a deferred design for low-latency GitHub revocation in this service. Has a
  "When to do this" trigger list rather than a Status: Accepted.
- [`services/cms/BFF.md`](../../../cms/BFF.md): the deferred Plan B for the
  capability layer (cross-service: the CMS's side of the broker contract).

When one of those docs becomes an *accepted* decision rather than a deferred
design, promote it to an ADR here.

## Index

| # | Title | Status |
|---|---|---|
| [0000](./0000-centralised-auth-service.md) | Centralised auth service for identity and capability brokering | Accepted |
| [0001](./0001-use-better-auth.md) | Use better-auth for identity + session management | Accepted |
| [0002](./0002-drizzle-orm-with-cloudflare-d1.md) | Drizzle ORM + Cloudflare D1 as the data layer | Accepted |
| [0003](./0003-hono-for-http-routing.md) | Hono for HTTP routing in the auth worker | Accepted |
| [0004](./0004-appplugin-registry.md) | AppPlugin registry for capability brokering | Accepted |
| [0005](./0005-two-jwt-token-exchange.md) | Two-JWT token exchange (identity + capability) | Accepted |
| [0006](./0006-per-app-cookie-path-scoping.md) | Per-app cookie path-scoping | Accepted |
| [0007](./0007-host-only-cookies.md) | Host-only cookies (no `Domain` attribute) | Accepted |
| [0008](./0008-scope-based-authorization.md) | Scope-based authorization | Accepted |
| [0009](./0009-session-bound-jwt-1.md) | Session-bound JWT #1 for per-device revocation | Accepted |
| [0010](./0010-idle-revocation-cron.md) | Idle revocation via Cloudflare Cron Triggers | Accepted |
| [0011](./0011-email-allowlist-nfkc.md) | Email allowlist with NFKC + mixed-script rejection | Accepted |
| [0012](./0012-domain-layer.md) | Domain layer for all DB access | Accepted |
