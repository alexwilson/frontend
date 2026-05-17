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
import { drizzle } from 'drizzle-orm/d1'
import { and, eq, sql } from 'drizzle-orm'
import type { Env } from '../env'
import type { AppPlugin } from '../apps/types'
import { schema, account } from '../schema'

const dbFor = (env: Env) => drizzle(env.AUTH_DB, { schema })

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

// One entry per user that has a row for `providerId`. Caller `.get`s by
// userId; missing entry means "not linked."
export async function listByProvider(env: Env, providerId: string): Promise<Map<string, AccountInfo>> {
  const rows = await dbFor(env)
    .select({
      userId: account.userId,
      accessToken: account.accessToken,
      lastIssuedAt: account.lastIssuedAt,
    })
    .from(account)
    .where(eq(account.providerId, providerId))
    .all()
  const map = new Map<string, AccountInfo>()
  for (const r of rows) {
    map.set(r.userId, {
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
export async function listIdle(env: Env, thresholdMs: number): Promise<IdleAccountRow[]> {
  const rows = await dbFor(env)
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
export async function markIssued(env: Env, userId: string, providerId: string): Promise<void> {
  await dbFor(env)
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
export async function revokeAndClear(env: Env, app: AppPlugin, userId: string): Promise<void> {
  const db = dbFor(env)
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
  await dbFor(env)
    .update(account)
    .set({ accessToken: null, lastIssuedAt: null })
    .where(eq(account.id, row.id))
    .run()
}

// Hard unlink — delete the account row entirely (refresh token included).
// Forces the user through full OAuth re-link on next use. Used by admin
// "Unlink CMS" action and by CmsApp.onUnlink.
export async function unlink(env: Env, userId: string, providerId: string): Promise<void> {
  await dbFor(env)
    .delete(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, providerId)))
    .run()
}
