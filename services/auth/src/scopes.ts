// Capability scopes — the unit of authorization across apps.
//
// Roles in the `user` table are still how admins assign permissions in the
// UI (familiar, coarse), but every authorization decision at runtime is
// scope-based. Roles map to a set of scopes via ROLE_SCOPES below.
//
// Scope shape: `<app>:<verb>`. Apps declare which scopes they're willing to
// grant (AppPlugin.grantedScopes). The token-exchange endpoint computes the
// final scope as:
//   intersection(requested, app.grantedScopes, scopesForRole(user.role))
// — so an app can never hand out a scope it doesn't own, and a user can
// never receive a scope their role doesn't carry.

export const SCOPES = {
  CMS_READ: 'cms:read',
  CMS_WRITE: 'cms:write',
  CMS_PUBLISH: 'cms:publish',
} as const

export type Scope = typeof SCOPES[keyof typeof SCOPES]

// Role → scope set. New roles or scopes plug in here; the rest of the system
// is unchanged. 'admin' deliberately gets every defined scope rather than a
// wildcard — explicit lists fail safe if a new scope is added and forgotten.
export const ROLE_SCOPES: Record<string, readonly Scope[]> = {
  admin: Object.values(SCOPES),
  'cms-editor': [SCOPES.CMS_READ, SCOPES.CMS_WRITE, SCOPES.CMS_PUBLISH],
  user: [],
}

export function scopesForRole(role: string | null | undefined): readonly Scope[] {
  return ROLE_SCOPES[role ?? ''] ?? []
}

// Intersect requested scopes with what's permitted. Order of args doesn't
// matter — set intersection is commutative. Returns a sorted unique list so
// JWT payloads are stable for cache/equality checks downstream.
export function intersectScopes(...sets: readonly (readonly string[])[]): string[] {
  if (sets.length === 0) return []
  const [first, ...rest] = sets
  const out = new Set(first)
  for (const s of rest) {
    const filter = new Set(s)
    for (const v of out) if (!filter.has(v)) out.delete(v)
  }
  return [...out].sort()
}

// Parse the `scope` form/query parameter as defined by RFC 6749 §3.3 —
// space-delimited list. Strips empties and dedupes.
export function parseScopeParam(raw: string | null | undefined): string[] {
  if (!raw) return []
  return [...new Set(raw.split(/\s+/).filter(Boolean))]
}
