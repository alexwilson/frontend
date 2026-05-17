// Session domain operations.
//
// Owns the `session` table. Read paths used by the admin UI ("how many
// active sessions does this user have?") and by JWT #1 verification (the
// session-row existence check that powers per-device revocation).
import { drizzle } from 'drizzle-orm/d1'
import { eq, gt, sql } from 'drizzle-orm'
import type { Env } from '../env'
import { schema, session } from '../schema'

const dbFor = (env: Env) => drizzle(env.AUTH_DB, { schema })

export interface SessionStats {
  count: number
  lastSeen: Date | null
}

export interface ActiveSession {
  userId: string
  expiresAt: Date
}

// One row per user with at least one un-expired session. Caller `.get`s by
// userId to merge into the user list — users with no entry have no active
// sessions.
export async function listStats(env: Env): Promise<Map<string, SessionStats>> {
  const rows = await dbFor(env)
    .select({
      userId: session.userId,
      count: sql<number>`count(*)`.as('count'),
      lastSeen: sql<number | null>`max(${session.updatedAt})`.as('last_seen'),
    })
    .from(session)
    .where(gt(session.expiresAt, new Date()))
    .groupBy(session.userId)
    .all()
  const map = new Map<string, SessionStats>()
  for (const r of rows) {
    map.set(r.userId, {
      count: Number(r.count),
      lastSeen: r.lastSeen ? new Date(r.lastSeen) : null,
    })
  }
  return map
}

// Returns null for missing OR expired sessions. Used by JWT #1's `sid` check
// in app-token.ts — a JWT whose session row is gone is treated as invalid
// even if its signature + exp would otherwise pass. This is what gives us
// per-device revocation despite better-auth's shared-upstream-token model.
export async function getActive(env: Env, sessionId: string): Promise<ActiveSession | null> {
  const row = await dbFor(env)
    .select({ userId: session.userId, expiresAt: session.expiresAt })
    .from(session)
    .where(eq(session.id, sessionId))
    .get()
  if (!row) return null
  if (row.expiresAt.getTime() < Date.now()) return null
  return { userId: row.userId, expiresAt: row.expiresAt }
}

// Hard sign-out: delete every session row for this user. Their JWT #1
// cookies on every device fail `getActive` on next use → fall back to session
// cookie → no session → 401. CMS account row + refresh token untouched, so
// re-login still gets transparent capability access.
export async function signOutEverywhere(env: Env, userId: string): Promise<void> {
  await dbFor(env).delete(session).where(eq(session.userId, userId)).run()
}
