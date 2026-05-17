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
import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
import { schema, account } from './schema'
import { appByProviderId } from './apps/registry'
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
  const db = drizzle(env.AUTH_DB, { schema })
  const thresholdMs = Date.now() - IDLE_THRESHOLD_MS

  // COALESCE so rows from before this column existed (or rows that have an
  // access token from a fresh OAuth callback but no JWT #2 mint yet) fall
  // back to created_at. Either way: if the wall-clock age exceeds the
  // idle threshold and the token is still set, revoke it.
  const rows = await db
    .select({
      id: account.id,
      providerId: account.providerId,
      accessToken: account.accessToken,
    })
    .from(account)
    .where(
      sql`${account.accessToken} IS NOT NULL
          AND COALESCE(${account.lastIssuedAt}, ${account.createdAt}) < ${thresholdMs}`,
    )
    .all()

  if (rows.length === 0) return

  for (const row of rows) {
    if (!row.accessToken) continue
    const app = appByProviderId(row.providerId)
    if (!app?.revokeAccessToken) {
      // Unknown provider — could be a stale account row from a removed app.
      // Clear the token anyway so we don't keep retrying every tick.
      // eslint-disable-next-line no-await-in-loop
      await db.update(account).set({ accessToken: null, lastIssuedAt: null }).where(eq(account.id, row.id)).run()
      continue
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      await app.revokeAccessToken(env, row.accessToken)
    } catch (e) {
      // Best-effort. The token will die at its natural upstream TTL even
      // if revoke fails; we'll retry on next tick (row still has accessToken).
      console.error(`[cron] revoke ${app.id} account=${row.id} failed:`, e)
      continue
    }
    // eslint-disable-next-line no-await-in-loop
    await db.update(account).set({ accessToken: null }).where(eq(account.id, row.id)).run()
  }
}
