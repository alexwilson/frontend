// User domain operations.
//
// The `user` table is owned primarily by better-auth (it does create/update
// via OAuth callbacks + the admin plugin). We only need read access here for
// the admin UI's user list. Mutations (set role, ban, delete) go through
// better-auth's admin API directly from the handler — wrapping them here
// would add an indirection hop with no value.
import { asc, desc } from 'drizzle-orm'
import { user } from '../schema'
import type { Db } from './db'

export interface AdminUser {
  id: string
  email: string
  name?: string
  role?: string
  banned?: boolean
  banReason?: string | null
}

// Admins first (desc role string sorts 'admin' > 'cms-editor' > 'user'),
// then alpha by email. Direct DB read rather than paginating through
// better-auth's admin.listUsers — we already have the binding and this gives
// us full control over ordering + the exact columns we need.
export async function list(db: Db): Promise<AdminUser[]> {
  const rows = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
    })
    .from(user)
    .orderBy(desc(user.role), asc(user.email))
    .all()
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name ?? undefined,
    role: r.role ?? undefined,
    banned: r.banned ?? undefined,
    banReason: r.banReason ?? undefined,
  }))
}
