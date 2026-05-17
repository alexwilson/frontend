# 0009. Session-bound JWT #1 for per-device revocation

Date: 2026-05-17

## Status

Accepted

## Context

JWT #1 ([ADR 0005](./0005-two-jwt-token-exchange.md)) is the identity
assertion. Plain JWTs are stateless: once minted, they're valid until
`exp`. A leaked JWT #1 can keep brokering JWT #2s until that
expiry, even after detection.

A personal site that wants "kick this device off" semantics — e.g., a
stolen laptop or a family member's compromised browser — needs
something finer than pure statelessness. Better-auth's session model
is shared-token-per-user (one session row drives all of a user's
sessions for that provider), so per-device GitHub-token isolation
isn't available without a fork. The revocation we *can* deliver is at
our own layer: stop accepting a specific device's JWT #1.

Three design options:

1. **Per-session JWT signing keys.** Sign each device's JWTs with a
   per-device key; revoke by deleting the key. Complex, and doesn't
   compose with better-auth's single-JWKS model.
2. **Denylist.** KV-backed set of revoked `jti` claims. Adds a KV
   binding, is eventually-consistent across CF edges, and the list
   grows over time.
3. **Session-row binding.** JWT carries a `sid` claim referencing a
   session row. On verify, check the row exists.

Option 3 reuses existing state (`session` table) and gives strong
consistency at the cost of one DB read per JWT #1 verification.

## Decision

JWT #1 carries a `sid` claim: the id of the session row that
authorised its minting. Every verification runs:

1. Cryptographic verify (signature + `exp`).
2. Claim check (`typ === 'identity'`, `app === expectedApp`).
3. **Session lookup:** the referenced session row must exist and
   belong to the same user.

If the session row is gone — the user signed out on that device, an
admin revoked it, or the row expired — the JWT is treated as
invalid even if signature and exp would otherwise pass.

The "Sign out this device" action in the manage UI deletes a single
session row by id.

## Consequences

**Positive:**
- Per-device revocation works. An admin can sign out a specific
  device, and the JWT #1 cookie on that device fails on next use.
- Cleanup of orphaned sessions (e.g., post-OAuth bugs leaving stray
  rows) flows through to JWT #1 invalidation for free.
- Compatible with better-auth's shared-upstream-token model. No fork.
- The session lookup is one indexed PK query on D1 (sub-millisecond).

**Negative:**
- Every JWT #1 verification now does a DB roundtrip. Pure
  statelessness is gone. Still fast (single PK lookup), but no longer
  "verify and go".
- Role/scope changes have a staleness window. JWT #1 caches the
  user's `role` at mint and uses it to derive scopes until JWT #1
  expires. A role change takes effect within that window, or
  instantly if the admin also deletes the user's session(s).

## References

- [OpenID Connect Front-Channel Logout 1.0, `sid` claim](https://openid.net/specs/openid-connect-frontchannel-1_0.html#OPLogout) (similar use of session id in JWT)
- [ADR 0005](./0005-two-jwt-token-exchange.md), two-JWT design
- `services/cms/BFF.md`, Plan B that obviates JWT #1's role entirely
