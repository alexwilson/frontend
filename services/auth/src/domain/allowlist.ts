// Email allowlist domain operations.
//
// Owns the `allowed_email` table. Wraps normalization (NFKC + mixed-script
// rejection) so handlers don't need to remember to call it. Single source of
// truth for "is this email allowed to sign up?"
import { asc, eq } from 'drizzle-orm'
import { allowedEmail } from '../schema'
import { normalizeEmail } from '../email-normalize'
import type { Db } from './db'

export interface AllowedEmail {
  email: string
  createdAt: string
  createdBy: string | null
}

export type MutationResult = { ok: true } | { ok: false; error: string }

export async function list(db: Db): Promise<AllowedEmail[]> {
  return db
    .select({
      email: allowedEmail.email,
      createdAt: allowedEmail.createdAt,
      createdBy: allowedEmail.createdBy,
    })
    .from(allowedEmail)
    .orderBy(asc(allowedEmail.email))
    .all()
}

// Membership check used by the sign-up gate. Normalizes the GitHub-supplied
// email before comparing so a homoglyph won't accidentally match a Latin
// allowlist entry (the normalization yields different canonical forms for
// e.g. Cyrillic а vs Latin a).
export async function isAllowed(db: Db, rawEmail: string): Promise<boolean> {
  const result = normalizeEmail(rawEmail)
  if (!result.ok) return false
  const row = await db
    .select({ email: allowedEmail.email })
    .from(allowedEmail)
    .where(eq(allowedEmail.email, result.email))
    .get()
  return !!row
}

export async function allow(db: Db, rawEmail: string, createdBy: string): Promise<MutationResult> {
  const result = normalizeEmail(rawEmail)
  if (!result.ok) return { ok: false, error: result.error }
  // ON CONFLICT DO NOTHING — idempotent. Re-adding an existing email is a no-op.
  await db
    .insert(allowedEmail)
    .values({
      email: result.email,
      createdAt: new Date().toISOString(),
      createdBy,
    })
    .onConflictDoNothing()
    .run()
  return { ok: true }
}

export async function revoke(db: Db, rawEmail: string): Promise<MutationResult> {
  const result = normalizeEmail(rawEmail)
  if (!result.ok) return { ok: false, error: result.error }
  await db
    .delete(allowedEmail)
    .where(eq(allowedEmail.email, result.email))
    .run()
  return { ok: true }
}
