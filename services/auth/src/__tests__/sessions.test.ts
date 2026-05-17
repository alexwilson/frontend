import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { makeTestDb, type TestDb } from './test-db'
import * as sessionsDomain from '../domain/sessions'
import { user, session } from '../schema'

let t: TestDb

beforeEach(() => { t = makeTestDb() })
afterEach(() => { t.close() })

// Seed helpers — bypass better-auth's schema validation and write directly
// via the same drizzle handle the domain uses. Keeps test setup terse.
function seedUser(id: string, email: string) {
  return t.db.insert(user).values({
    id, email, name: email, emailVerified: true,
    createdAt: new Date(), updatedAt: new Date(),
  }).run()
}

function seedSession(opts: {
  id: string
  userId: string
  expiresAt: Date
  updatedAt?: Date
  token?: string
}) {
  return t.db.insert(session).values({
    id: opts.id,
    userId: opts.userId,
    token: opts.token ?? `tok-${opts.id}`,
    expiresAt: opts.expiresAt,
    createdAt: new Date(),
    updatedAt: opts.updatedAt ?? new Date(),
  }).run()
}

describe('sessions.listStats', () => {
  it('returns an empty map when no sessions', async () => {
    const stats = await sessionsDomain.listStats(t.db)
    expect(stats.size).toBe(0)
  })

  it('counts active sessions per user', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    await seedUser('u1', 'a@example.com')
    await seedUser('u2', 'b@example.com')
    await seedSession({ id: 's1', userId: 'u1', expiresAt: future })
    await seedSession({ id: 's2', userId: 'u1', expiresAt: future })
    await seedSession({ id: 's3', userId: 'u2', expiresAt: future })

    const stats = await sessionsDomain.listStats(t.db)
    expect(stats.get('u1')?.count).toBe(2)
    expect(stats.get('u2')?.count).toBe(1)
  })

  it('excludes expired sessions from the count', async () => {
    const past = new Date(Date.now() - 1000)
    const future = new Date(Date.now() + 1000 * 60 * 60)
    await seedUser('u1', 'a@example.com')
    await seedSession({ id: 's-old', userId: 'u1', expiresAt: past })
    await seedSession({ id: 's-new', userId: 'u1', expiresAt: future })

    const stats = await sessionsDomain.listStats(t.db)
    expect(stats.get('u1')?.count).toBe(1)
  })

  it('reports lastSeen as the max updated_at across active sessions', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    const older = new Date(Date.now() - 1000 * 60 * 10)
    const newer = new Date(Date.now() - 1000 * 60 * 2)
    await seedUser('u1', 'a@example.com')
    await seedSession({ id: 's1', userId: 'u1', expiresAt: future, updatedAt: older })
    await seedSession({ id: 's2', userId: 'u1', expiresAt: future, updatedAt: newer })

    const stats = await sessionsDomain.listStats(t.db)
    expect(stats.get('u1')?.lastSeen?.getTime()).toBe(newer.getTime())
  })
})

describe('sessions.getActive', () => {
  beforeEach(async () => {
    await seedUser('u1', 'a@example.com')
  })

  it('returns the session for a valid id', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    await seedSession({ id: 's1', userId: 'u1', expiresAt: future })

    const got = await sessionsDomain.getActive(t.db, 's1')
    expect(got?.userId).toBe('u1')
    expect(got?.expiresAt.getTime()).toBe(future.getTime())
  })

  it('returns null for an unknown session id', async () => {
    expect(await sessionsDomain.getActive(t.db, 'nope')).toBeNull()
  })

  it('returns null for an expired session', async () => {
    const past = new Date(Date.now() - 1000)
    await seedSession({ id: 's1', userId: 'u1', expiresAt: past })

    expect(await sessionsDomain.getActive(t.db, 's1')).toBeNull()
  })
})

describe('sessions.revoke', () => {
  it('deletes a single session by id', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    await seedUser('u1', 'a@example.com')
    await seedSession({ id: 's1', userId: 'u1', expiresAt: future })
    await seedSession({ id: 's2', userId: 'u1', expiresAt: future })

    await sessionsDomain.revoke(t.db, 's1')

    const stats = await sessionsDomain.listStats(t.db)
    expect(stats.get('u1')?.count).toBe(1)
  })

  it('is a no-op for an unknown session id', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    await seedUser('u1', 'a@example.com')
    await seedSession({ id: 's1', userId: 'u1', expiresAt: future })

    await sessionsDomain.revoke(t.db, 'nonexistent')

    const stats = await sessionsDomain.listStats(t.db)
    expect(stats.get('u1')?.count).toBe(1)
  })
})

describe('sessions.listAllByUser', () => {
  it('groups un-expired sessions by userId', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    await seedUser('u1', 'a@example.com')
    await seedUser('u2', 'b@example.com')
    await seedSession({ id: 's1', userId: 'u1', expiresAt: future })
    await seedSession({ id: 's2', userId: 'u1', expiresAt: future })
    await seedSession({ id: 's3', userId: 'u2', expiresAt: future })

    const map = await sessionsDomain.listAllByUser(t.db)
    expect(map.get('u1')?.length).toBe(2)
    expect(map.get('u2')?.length).toBe(1)
    expect(map.get('u1')?.[0].id).toBe('s1')  // sorted by createdAt asc
  })

  it('excludes expired sessions', async () => {
    const past = new Date(Date.now() - 1000)
    const future = new Date(Date.now() + 1000 * 60 * 60)
    await seedUser('u1', 'a@example.com')
    await seedSession({ id: 's-old', userId: 'u1', expiresAt: past })
    await seedSession({ id: 's-new', userId: 'u1', expiresAt: future })

    const map = await sessionsDomain.listAllByUser(t.db)
    expect(map.get('u1')?.length).toBe(1)
    expect(map.get('u1')?.[0].id).toBe('s-new')
  })

  it('returned rows do NOT include the bearer token field', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    await seedUser('u1', 'a@example.com')
    await seedSession({ id: 's1', userId: 'u1', expiresAt: future, token: 'should-not-leak' })

    const map = await sessionsDomain.listAllByUser(t.db)
    const row = map.get('u1')?.[0]
    expect(row).toBeDefined()
    // SessionRow shape — token explicitly omitted to avoid leaking the bearer.
    expect(Object.keys(row!)).not.toContain('token')
  })

  it('includes per-row metadata (createdAt, expiresAt, ipAddress, userAgent)', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    await seedUser('u1', 'a@example.com')
    await t.db.insert(session).values({
      id: 's1',
      userId: 'u1',
      token: 'tok',
      expiresAt: future,
      createdAt: new Date(Date.now() - 60_000),
      updatedAt: new Date(),
      ipAddress: '203.0.113.5',
      userAgent: 'Mozilla/5.0 Test',
    }).run()

    const row = (await sessionsDomain.listAllByUser(t.db)).get('u1')?.[0]
    expect(row?.ipAddress).toBe('203.0.113.5')
    expect(row?.userAgent).toBe('Mozilla/5.0 Test')
    expect(row?.createdAt).toBeInstanceOf(Date)
    expect(row?.expiresAt.getTime()).toBe(future.getTime())
  })

  it('includes per-row CF geo/network context when present', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    await seedUser('u1', 'a@example.com')
    await t.db.insert(session).values({
      id: 's1',
      userId: 'u1',
      token: 'tok',
      expiresAt: future,
      createdAt: new Date(),
      updatedAt: new Date(),
      country: 'GB',
      region: 'England',
      city: 'London',
      asn: 5400,
      asOrganization: 'British Telecom',
      timezone: 'Europe/London',
    }).run()

    const row = (await sessionsDomain.listAllByUser(t.db)).get('u1')?.[0]
    expect(row?.country).toBe('GB')
    expect(row?.region).toBe('England')
    expect(row?.city).toBe('London')
    expect(row?.asn).toBe(5400)
    expect(row?.asOrganization).toBe('British Telecom')
    expect(row?.timezone).toBe('Europe/London')
  })

  it('returns nulls for CF fields when the cf-capture hook did not fire (e.g. local dev)', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    await seedUser('u1', 'a@example.com')
    await t.db.insert(session).values({
      id: 's1',
      userId: 'u1',
      token: 'tok',
      expiresAt: future,
      createdAt: new Date(),
      updatedAt: new Date(),
      // country/region/city/asn/asOrganization/timezone all omitted → null
    }).run()

    const row = (await sessionsDomain.listAllByUser(t.db)).get('u1')?.[0]
    expect(row?.country).toBeNull()
    expect(row?.asn).toBeNull()
    expect(row?.asOrganization).toBeNull()
    expect(row?.timezone).toBeNull()
  })
})
