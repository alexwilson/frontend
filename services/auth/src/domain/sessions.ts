// Session domain operations.
//
// Owns the `session` table for reads + the operations better-auth's admin
// API doesn't cover well:
//   • Aggregate stats per user (listStats) — no better-auth equivalent.
//   • By-id lookup (getActive) — better-auth indexes by token (cookie value),
//     but JWT #1's `sid` claim references id, so we need this shape.
//   • Per-device revocation by id (revoke) — better-auth's revokeUserSession
//     takes the bearer token, which we don't want flowing through admin
//     form fields. Direct DB delete by id keeps the bearer token where it
//     belongs (HttpOnly cookie on the device that owns it).
//   • Bulk per-user listing for the admin render (listAllByUser) — one
//     query for the whole user table, vs N+1 if we looped through
//     auth.api.listUserSessions per user.
//
// "Sign out everywhere" (bulk) goes through auth.api.revokeUserSessions in
// the controller — better-auth's admin plugin handles it and gives us a
// free permission re-check.
import { asc, eq, gt, sql } from 'drizzle-orm'
import { session, user } from '../schema'
import type { Db } from './db'

export interface SessionStats {
  count: number
  lastSeen: Date | null
}

export interface ActiveSession {
  userId: string
  expiresAt: Date
  // Current role from `user` (joined). Source of truth — never trust role
  // claims baked into a JWT, which can survive a demote until the JWT expires.
  role: string | null
}

// Per-row session details shown in the admin UI's expandable session list.
// Excludes the bearer-secret `token` field — never expose that to anyone,
// including the admin. The session id (`id`) is fine to surface; it's what
// JWT #1's `sid` claim references and what we revoke against.
//
// Geo / network fields (country, region, city, asOrganization, timezone)
// are captured at session creation from request.cf via the databaseHooks
// in auth.ts. Null outside Cloudflare (tests, certain local dev).
export interface SessionRow {
  id: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  impersonatedBy: string | null
  country: string | null
  region: string | null
  city: string | null
  asn: number | null
  asOrganization: string | null
  timezone: string | null
}

// One row per user with at least one un-expired session. Caller `.get`s by
// userId to merge into the user list — users with no entry have no active
// sessions.
export async function listStats(db: Db): Promise<Map<string, SessionStats>> {
  const rows = await db
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

// All un-expired sessions grouped by userId, for the admin UI's expandable
// per-user detail view. Single query — avoids N+1 calls through
// auth.api.listUserSessions when rendering the user table. Token field
// deliberately not selected: it's the bearer secret and has no business in
// HTML.
export async function listAllByUser(db: Db): Promise<Map<string, SessionRow[]>> {
  const rows = await db
    .select({
      id: session.id,
      userId: session.userId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      impersonatedBy: session.impersonatedBy,
      country: session.country,
      region: session.region,
      city: session.city,
      asn: session.asn,
      asOrganization: session.asOrganization,
      timezone: session.timezone,
    })
    .from(session)
    .where(gt(session.expiresAt, new Date()))
    .orderBy(asc(session.createdAt))
    .all()
  const map = new Map<string, SessionRow[]>()
  for (const r of rows) {
    const { userId, ...rowWithoutUserId } = r
    let list = map.get(userId)
    if (!list) { list = []; map.set(userId, list) }
    list.push(rowWithoutUserId)
  }
  return map
}

// Returns null for missing OR expired sessions. Used by JWT #1's `sid` check
// in app-token.ts — a JWT whose session row is gone is treated as invalid
// even if its signature + exp would otherwise pass. This is what gives us
// per-device revocation despite better-auth's shared-upstream-token model.
//
// JOINs user so scope authorization can use the live role, not whatever
// was baked into the JWT at issuance.
export async function getActive(db: Db, sessionId: string): Promise<ActiveSession | null> {
  const row = await db
    .select({ userId: session.userId, expiresAt: session.expiresAt, role: user.role })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(eq(session.id, sessionId))
    .get()
  if (!row) return null
  if (row.expiresAt.getTime() < Date.now()) return null
  return { userId: row.userId, expiresAt: row.expiresAt, role: row.role }
}

// Per-device sign-out: delete a single session row by id. JWT #1s minted
// from this session fail their `sid` existence check on next use. Other
// sessions for the same user are untouched. Caller is responsible for
// guarding against admins signing out their own current session (foot-gun).
export async function revoke(db: Db, sessionId: string): Promise<void> {
  await db.delete(session).where(eq(session.id, sessionId)).run()
}
