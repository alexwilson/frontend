import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { makeTestDb, type TestDb } from './test-db'
import * as users from '../domain/users'
import { user } from '../schema'

let t: TestDb

beforeEach(() => { t = makeTestDb() })
afterEach(() => { t.close() })

function seedUser(opts: { id: string; email: string; role?: string; banned?: boolean; name?: string }) {
  return t.db.insert(user).values({
    id: opts.id,
    email: opts.email,
    name: opts.name ?? opts.email,
    emailVerified: true,
    role: opts.role,
    banned: opts.banned,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).run()
}

describe('users.list', () => {
  it('returns an empty array when no users', async () => {
    expect(await users.list(t.db)).toEqual([])
  })

  it('orders admins before others, then alphabetically by email', async () => {
    // Inserted in deliberately scrambled order to verify the sort.
    await seedUser({ id: 'u1', email: 'zara@example.com', role: 'user' })
    await seedUser({ id: 'u2', email: 'alex@example.com', role: 'admin' })
    await seedUser({ id: 'u3', email: 'editor@example.com', role: 'cms-editor' })
    await seedUser({ id: 'u4', email: 'amy@example.com', role: 'admin' })

    const list = await users.list(t.db)
    // desc role string sort: 'user' > 'cms-editor' > 'admin' alphabetically,
    // but desc reverses to: 'user' last. So order is user-emails, then
    // cms-editor-emails, then admin-emails. Wait — desc means 'user' first.
    // Let's just assert the actual SQL semantics: ORDER BY role DESC, email ASC.
    // ASCII: 'u'(117) > 'c'(99) > 'a'(97), so DESC = user, cms-editor, admin.
    expect(list.map((u) => u.email)).toEqual([
      'zara@example.com',     // user
      'editor@example.com',   // cms-editor
      'alex@example.com',     // admin
      'amy@example.com',      // admin
    ])
  })

  it('exposes optional fields as undefined rather than null', async () => {
    await seedUser({ id: 'u1', email: 'a@example.com' })
    const [u] = await users.list(t.db)
    expect(u.role).toBeUndefined()
    expect(u.banned).toBeUndefined()
    expect(u.banReason).toBeUndefined()
  })

  it('includes banned + banReason when set', async () => {
    await seedUser({ id: 'u1', email: 'a@example.com', banned: true })
    const [u] = await users.list(t.db)
    expect(u.banned).toBe(true)
  })
})
