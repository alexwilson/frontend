# 0010. Idle revocation via Cloudflare Cron Triggers

Date: 2026-05-17

## Status

Accepted

## Context

Upstream user-to-server tokens have a multi-hour natural TTL. The
common case for our users:

- Open the CMS, work for an hour, close the tab.
- No explicit sign-out. The sign-out path runs only when the user
  clicks "Sign out" in the UI, which they often don't.

The session row in our DB still holds a valid access token for the
remainder of that upstream TTL after the user walks away. If the
token is exfiltrated during that window (XSS, browser memory dump,
log capture), the attacker has the full window to use it.

Three eviction options:

1. **Revoke-on-overwrite.** Every token refresh revokes the previous
   one. Discussed and rejected: with our shared-upstream model, this
   would invalidate in-flight JWT #2s held by concurrent sessions on
   other devices. Bad UX. See the threat-model discussion.
2. **Force aggressive SPA polling.** Make the SPA hit the token
   broker every few minutes to force rotation. Doesn't help if the
   user has closed the tab.
3. **Server-side idle sweep.** A cron checks for accounts whose
   `last_issued_at` is older than the threshold, revokes the token
   at the upstream, and NULLs it locally.

Option 3 is the only one that handles the "user closed the tab" case
without making the active-user experience worse.

## Decision

A **Cloudflare Cron Trigger** fires on a short interval and runs an
idle sweep:

1. `account.last_issued_at` is stamped on every successful JWT #2
   mint. The mint path does the stamping; the cron reads it.
2. Find accounts whose stored access token has gone untouched longer
   than the idle threshold.
3. For each one, revoke at the upstream provider. Best-effort:
   failures don't block, and the next tick retries.
4. Clear the local access token. The refresh token is **kept**, so a
   legitimate user returning transparently refresh-grants a new one.

The query coalesces `last_issued_at` with `created_at` so rows
predating the column and freshly-linked accounts behave correctly
(neither is treated as stale).

Effective stolen-token TTL: bounded by idle threshold + cron tick,
instead of the upstream's natural multi-hour TTL.

## Consequences

**Positive:**
- Stolen-token exposure window is bounded regardless of user
  behaviour.
- Returning users see no friction. Refresh-grant produces a new
  token on their next call (via better-auth's `getAccessToken`).
- Cost is bounded: one revoke call per stale account per cron tick.
  Negligible at our scale.

**Negative:**
- Adds a deployment concern: the cron trigger must be configured on
  each environment. It deploys with the worker, but a fresh
  environment must verify the trigger actually fires.
- The handler runs inside the Workers `scheduled` context, which has
  different observability from `fetch` handlers. `wrangler tail`
  works, but the Cloudflare dashboard shows cron events separately.
- Brief inconsistency window per tick: a token might be valid in the
  DB but already revoked upstream if the revoke succeeded but the DB
  update failed. The next tick re-revokes (harmless idempotent) and
  catches the DB.

**Neutral:**
- Refresh tokens have a much longer TTL at the upstream. We never
  revoke them, which keeps access transparent for returning users.
  If the user fully unlinks, the unlink path removes the row
  including the refresh token.

## References

- [Cloudflare Workers, Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [ADR 0004](./0004-appplugin-registry.md), AppPlugin's `revokeAccessToken` method
