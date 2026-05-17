// Idle-revocation cron. Wired in src/index.ts via the Workers `scheduled`
// handler, fires per the crons schedule in wrangler.toml (every 5 min).
//
// Purpose: a user who closes their tab without signing out leaves an
// upstream access token (e.g. GitHub ghu_*) alive for its natural TTL
// (~8h). The session cookie has its own lifetime, but the *upstream* token
// is what an attacker would steal. We cap stolen-token lifetime at
// (cron interval + idle threshold) by sweeping idle accounts here and
// revoking the access token at the upstream provider.
//
// Refresh tokens are intentionally NOT revoked — they survive in the row
// untouched, so when the user comes back the next /auth/app/<id>/token call
// refresh-grants a fresh access token transparently.
import { appByProviderId } from './apps/registry'
import * as accounts from './domain/accounts'
import type { Env } from './env'

// Tokens whose last_issued_at (or, for pre-migration rows, created_at) is
// older than this are considered idle and have their access token revoked
// at the upstream provider on the next cron tick.
const IDLE_THRESHOLD_MS = 10 * 60 * 1000

export async function handleScheduled(
  _event: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  // Don't block the cron event loop — Workers will keep the runtime alive
  // until ctx.waitUntil resolves. If revoke calls hang, the next tick still
  // fires independently.
  ctx.waitUntil(revokeIdleTokens(env))
}

async function revokeIdleTokens(env: Env): Promise<void> {
  const thresholdMs = Date.now() - IDLE_THRESHOLD_MS
  const rows = await accounts.listIdle(env, thresholdMs)
  if (rows.length === 0) return

  for (const row of rows) {
    const app = appByProviderId(row.providerId)
    // eslint-disable-next-line no-await-in-loop
    await accounts.clearByRowId(env, row, app)
  }
}
