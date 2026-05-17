import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { makeTestDb, type TestDb } from './test-db'
import * as accounts from '../domain/accounts'
import { account, user } from '../schema'
import type { AppPlugin } from '../apps/types'
import type { Env } from '../env'
import { SCOPES } from '../scopes'

let t: TestDb
const env = {} as Env  // not touched by the domain when the app's revoke is a stub

beforeEach(() => { t = makeTestDb() })
afterEach(() => { t.close() })

function seedUser(id: string, email = `${id}@example.com`) {
  return t.db.insert(user).values({
    id, email, name: email, emailVerified: true,
    createdAt: new Date(), updatedAt: new Date(),
  }).run()
}

function seedAccount(opts: {
  id: string
  userId: string
  providerId: string
  accessToken?: string | null
  lastIssuedAt?: Date | null
  createdAt?: Date
}) {
  return t.db.insert(account).values({
    id: opts.id,
    accountId: opts.id,
    providerId: opts.providerId,
    userId: opts.userId,
    accessToken: opts.accessToken === undefined ? 'tok' : opts.accessToken,
    refreshToken: 'rtok',
    createdAt: opts.createdAt ?? new Date(),
    updatedAt: new Date(),
    lastIssuedAt: opts.lastIssuedAt ?? null,
  }).run()
}

// Minimal AppPlugin double for tests. revokeAccessToken records the token
// it was called with so we can assert on it without hitting GitHub.
function stubApp(id: string, providerId: string, revoke?: (env: Env, token: string) => Promise<void>): AppPlugin {
  return {
    id,
    name: id.toUpperCase(),
    providerId,
    grantedScopes: [SCOPES.CMS_READ],
    oauthConfig: () => ({ providerId, clientId: '', clientSecret: '', authorizationUrl: '', tokenUrl: '' }),
    revokeAccessToken: revoke,
  }
}

describe('accounts.listAllByUser', () => {
  it('returns an empty map when no rows', async () => {
    const map = await accounts.listAllByUser(t.db)
    expect(map.size).toBe(0)
  })

  it('groups rows by user and then by providerId', async () => {
    await seedUser('u1'); await seedUser('u2')
    await seedAccount({ id: 'a1', userId: 'u1', providerId: 'github-cms' })
    await seedAccount({ id: 'a2', userId: 'u1', providerId: 'github-photo' })
    await seedAccount({ id: 'a3', userId: 'u2', providerId: 'github-cms', accessToken: null })

    const map = await accounts.listAllByUser(t.db)
    expect(map.get('u1')?.size).toBe(2)
    expect(map.get('u1')?.get('github-cms')?.hasToken).toBe(true)
    expect(map.get('u1')?.get('github-photo')?.hasToken).toBe(true)
    expect(map.get('u2')?.get('github-cms')?.hasToken).toBe(false)
    expect(map.get('u2')?.get('github-cms')?.hasRow).toBe(true)
  })
})

describe('accounts.listIdle', () => {
  it('returns rows older than the threshold', async () => {
    const now = Date.now()
    await seedUser('u1')
    await seedAccount({
      id: 'a-old',
      userId: 'u1',
      providerId: 'github-cms',
      lastIssuedAt: new Date(now - 60_000),  // 60s ago
    })
    await seedAccount({
      id: 'a-fresh',
      userId: 'u1',
      providerId: 'github-photo',
      lastIssuedAt: new Date(now - 1_000),   // 1s ago
    })

    const rows = await accounts.listIdle(t.db, now - 30_000)  // 30s threshold
    expect(rows.map((r) => r.id)).toEqual(['a-old'])
  })

  it('excludes rows with NULL access_token (already cleared)', async () => {
    const now = Date.now()
    await seedUser('u1')
    await seedAccount({
      id: 'a-null',
      userId: 'u1',
      providerId: 'github-cms',
      accessToken: null,
      lastIssuedAt: new Date(now - 60_000),
    })

    const rows = await accounts.listIdle(t.db, now - 30_000)
    expect(rows).toEqual([])
  })

  it('falls back to created_at via COALESCE when last_issued_at is NULL', async () => {
    const now = Date.now()
    await seedUser('u1')
    await seedAccount({
      id: 'a',
      userId: 'u1',
      providerId: 'github-cms',
      lastIssuedAt: null,
      createdAt: new Date(now - 60_000),
    })

    const rows = await accounts.listIdle(t.db, now - 30_000)
    expect(rows.map((r) => r.id)).toEqual(['a'])
  })
})

describe('accounts.markIssued', () => {
  it('sets last_issued_at on the matching row', async () => {
    await seedUser('u1')
    await seedAccount({ id: 'a', userId: 'u1', providerId: 'github-cms', lastIssuedAt: null })

    await accounts.markIssued(t.db, 'u1', 'github-cms')

    const map = await accounts.listAllByUser(t.db)
    expect(map.get('u1')?.get('github-cms')?.lastIssuedAt).toBeInstanceOf(Date)
  })

  it('is a no-op when no row matches (does not throw)', async () => {
    await expect(accounts.markIssued(t.db, 'no-such-user', 'no-such-provider')).resolves.not.toThrow()
  })
})

describe('accounts.revokeAndClear', () => {
  it('calls app.revokeAccessToken with the current token, then NULLs it', async () => {
    const revoke = vi.fn().mockResolvedValue(undefined)
    const app = stubApp('cms', 'github-cms', revoke)
    await seedUser('u1')
    await seedAccount({ id: 'a', userId: 'u1', providerId: 'github-cms', accessToken: 'gho_abc' })

    await accounts.revokeAndClear(t.db, env, app, 'u1')

    expect(revoke).toHaveBeenCalledWith(env, 'gho_abc')
    const map = await accounts.listAllByUser(t.db)
    expect(map.get('u1')?.get('github-cms')?.hasToken).toBe(false)
    expect(map.get('u1')?.get('github-cms')?.hasRow).toBe(true)  // row kept (refresh token)
  })

  it('does not call upstream revoke when there is no token to revoke', async () => {
    const revoke = vi.fn().mockResolvedValue(undefined)
    const app = stubApp('cms', 'github-cms', revoke)
    await seedUser('u1')
    await seedAccount({ id: 'a', userId: 'u1', providerId: 'github-cms', accessToken: null })

    await accounts.revokeAndClear(t.db, env, app, 'u1')

    expect(revoke).not.toHaveBeenCalled()
  })

  it('still NULLs the row even if upstream revoke throws', async () => {
    const revoke = vi.fn().mockRejectedValue(new Error('github down'))
    const app = stubApp('cms', 'github-cms', revoke)
    await seedUser('u1')
    await seedAccount({ id: 'a', userId: 'u1', providerId: 'github-cms', accessToken: 'gho_abc' })

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await accounts.revokeAndClear(t.db, env, app, 'u1')
    errSpy.mockRestore()

    const map = await accounts.listAllByUser(t.db)
    expect(map.get('u1')?.get('github-cms')?.hasToken).toBe(false)
  })

  it('is a no-op when the user has no row for this provider', async () => {
    const revoke = vi.fn()
    const app = stubApp('cms', 'github-cms', revoke)
    await seedUser('u1')

    await accounts.revokeAndClear(t.db, env, app, 'u1')

    expect(revoke).not.toHaveBeenCalled()
  })
})

describe('accounts.clearByRowId', () => {
  it('revokes upstream + NULLs the specific row', async () => {
    const revoke = vi.fn().mockResolvedValue(undefined)
    const app = stubApp('cms', 'github-cms', revoke)
    await seedUser('u1')
    await seedAccount({ id: 'a', userId: 'u1', providerId: 'github-cms', accessToken: 'gho_x' })

    await accounts.clearByRowId(t.db, env, { id: 'a', providerId: 'github-cms', accessToken: 'gho_x' }, app)

    expect(revoke).toHaveBeenCalledWith(env, 'gho_x')
    const map = await accounts.listAllByUser(t.db)
    expect(map.get('u1')?.get('github-cms')?.hasToken).toBe(false)
  })

  it('does NOT clear the row if upstream revoke fails — retry on next tick', async () => {
    const revoke = vi.fn().mockRejectedValue(new Error('boom'))
    const app = stubApp('cms', 'github-cms', revoke)
    await seedUser('u1')
    await seedAccount({ id: 'a', userId: 'u1', providerId: 'github-cms', accessToken: 'gho_x' })

    // The failure path logs via console.error; silence it for clean test output.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await accounts.clearByRowId(t.db, env, { id: 'a', providerId: 'github-cms', accessToken: 'gho_x' }, app)
    errSpy.mockRestore()

    const map = await accounts.listAllByUser(t.db)
    expect(map.get('u1')?.get('github-cms')?.hasToken).toBe(true)  // still set
  })

  it('clears the row anyway if no app is registered (stale provider row)', async () => {
    await seedUser('u1')
    await seedAccount({ id: 'a', userId: 'u1', providerId: 'github-removed', accessToken: 'gho_x' })

    await accounts.clearByRowId(
      t.db, env,
      { id: 'a', providerId: 'github-removed', accessToken: 'gho_x' },
      undefined,
    )

    const map = await accounts.listAllByUser(t.db)
    expect(map.get('u1')?.get('github-removed')?.hasToken).toBe(false)
  })
})

describe('accounts.unlink', () => {
  it('deletes the row entirely (refresh token gone)', async () => {
    await seedUser('u1')
    await seedAccount({ id: 'a', userId: 'u1', providerId: 'github-cms' })

    await accounts.unlink(t.db, 'u1', 'github-cms')

    const map = await accounts.listAllByUser(t.db)
    expect(map.has('u1')).toBe(false)
  })

  it('does not touch other providers for the same user', async () => {
    await seedUser('u1')
    await seedAccount({ id: 'a', userId: 'u1', providerId: 'github-cms' })
    await seedAccount({ id: 'b', userId: 'u1', providerId: 'github-photo' })

    await accounts.unlink(t.db, 'u1', 'github-cms')

    const map = await accounts.listAllByUser(t.db)
    expect(map.get('u1')?.has('github-photo')).toBe(true)
    expect(map.get('u1')?.has('github-cms')).toBe(false)
  })
})
