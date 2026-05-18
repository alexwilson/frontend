// Decap CMS uses createHashHistory; bare hashes get canonicalised to
// '/'-prefixed paths, so we use the canonical shape from the start.
export const PENDING_HASH = '/cms-pending-signin'

export function pendingCallbackURL(): string {
  const u = new URL(window.location.href)
  u.hash = PENDING_HASH
  return u.href
}

export function startedFromPending(): boolean {
  return window.location.hash === `#${PENDING_HASH}`
}
