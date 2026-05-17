// Account (linked provider credential) domain operations.
//
// Owns the `account` table. Centralizes the lifecycle of upstream access
// tokens: read them, stamp `last_issued_at` on use, revoke + clear on
// sign-out / idle / admin action, unlink the whole row.
//
// Apps (apps/cms.ts, future photo etc.) implement `revokeAccessToken` on the
// `AppPlugin` interface; this module orchestrates the DB side and delegates
// the upstream call to the app. That way there's exactly one place that
// knows "what 'revoke this token' means in our system" and exactly one
// place that knows "how does GitHub revoke a token."
import { and, eq, sql } from 'drizzle-orm'
import type { Env } from '../env'
import type { AppPlugin } from '../apps/types'
import { account } from '../schema'
import type { Db } from './db'

// Idle threshold for an account's last_issued_at to be considered stale.
// Read by:
//   • cron.ts — what counts as "sweep me"
//   • manage.ts — what counts as Active vs Idle in the status badge
// Single value across both so the UI's "Idle" state and the cron's eviction
// align (no surprising "showed Active but got revoked" race).
export const IDLE_THRESHOLD_MS = 10 * 60 * 1000

export interface AccountInfo {
  hasRow: boolean
  hasToken: boolean
  lastIssuedAt: Date | null
}

export interface IdleAccountRow {
  id: string
  providerId: string
  accessToken: string
}

// All account rows, grouped first by userId then by providerId. The admin
// UI's "Apps" column iterates the registered apps and looks up each user's
// status per app via this map (missing entry → "not linked"). Single query
// regardless of how many apps are registered.
export async function listAllByUser(db: Db): Promise<Map<string, Map<string, AccountInfo>>> {
  const rows = await db
    .select({
      userId: account.userId,
      providerId: account.providerId,
      accessToken: account.accessToken,
      lastIssuedAt: account.lastIssuedAt,
    })
    .from(account)
    .all()
  const map = new Map<string, Map<string, AccountInfo>>()
  for (const r of rows) {
    let inner = map.get(r.userId)
    if (!inner) {
      inner = new Map()
      map.set(r.userId, inner)
    }
    inner.set(r.providerId, {
      hasRow: true,
      hasToken: r.accessToken !== null,
      lastIssuedAt: r.lastIssuedAt ?? null,
    })
  }
  return map
}

// Idle sweep: rows with a still-set access_token whose
// COALESCE(last_issued_at, created_at) is older than the threshold. Used by
// the cron handler to evict tokens whose users have stopped interacting.
export async function listIdle(db: Db, thresholdMs: number): Promise<IdleAccountRow[]> {
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
  // Drizzle types accessToken as `string | null` because the column is
  // nullable; the SQL filter excludes nulls so we can narrow safely.
  return rows.filter((r): r is IdleAccountRow => r.accessToken !== null)
}

// Stamp last_issued_at on the (user, provider) row to mark "actively in use"
// for the idle sweep. Called from handleAppToken on every successful JWT #2
// mint. No-op if the row doesn't exist (better-auth's getAccessToken would
// have already failed by then).
export async function markIssued(db: Db, userId: string, providerId: string): Promise<void> {
  await db
    .update(account)
    .set({ lastIssuedAt: new Date() })
    .where(and(eq(account.userId, userId), eq(account.providerId, providerId)))
    .run()
}

// The standard "this token should die" operation. Three callers share it:
//   • Admin "Revoke token" action (manage.ts)
//   • Per-device sign-out (CmsApp.onSignOut via this helper)
//   • Cron idle sweep (via the row-keyed clearByRowId below)
// Best-effort upstream revoke (failures don't block — the token dies at its
// natural TTL anyway). Then NULL access_token + last_issued_at, keep the
// row + refresh_token so legitimate returns transparently refresh-grant.
export async function revokeAndClear(db: Db, env: Env, app: AppPlugin, userId: string): Promise<void> {
  const row = await db
    .select({ accessToken: account.accessToken })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, app.providerId)))
    .get()
  if (row?.accessToken && app.revokeAccessToken) {
    try {
      await app.revokeAccessToken(env, row.accessToken)
    } catch (e) {
      console.error(`[accounts] revoke ${app.id} user=${userId} failed:`, e)
    }
  }
  await db
    .update(account)
    .set({ accessToken: null, lastIssuedAt: null })
    .where(and(eq(account.userId, userId), eq(account.providerId, app.providerId)))
    .run()
}

// Row-keyed variant for the cron. The cron iterates `listIdle()` and already
// has the access_token; this avoids re-querying. Still calls the app's
// `revokeAccessToken` for symmetry — but skips it if the providerId no
// longer matches any registered app (stale row, app removed).
export async function clearByRowId(
  db: Db,
  env: Env,
  row: IdleAccountRow,
  app: AppPlugin | undefined,
): Promise<void> {
  if (app?.revokeAccessToken) {
    try {
      await app.revokeAccessToken(env, row.accessToken)
    } catch (e) {
      console.error(`[accounts] revoke ${app.id} account=${row.id} failed:`, e)
      // Don't clear the DB row — next tick will retry.
      return
    }
  }
  await db
    .update(account)
    .set({ accessToken: null, lastIssuedAt: null })
    .where(eq(account.id, row.id))
    .run()
}

// Hard unlink — delete the account row entirely (refresh token included).
// Forces the user through full OAuth re-link on next use. Used by admin
// "Unlink CMS" action and by CmsApp.onUnlink.
export async function unlink(db: Db, userId: string, providerId: string): Promise<void> {
  await db
    .delete(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, providerId)))
    .run()
}
