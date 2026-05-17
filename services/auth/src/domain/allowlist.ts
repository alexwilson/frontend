// Email allowlist domain operations.
//
// Owns the `allowed_email` table. Wraps normalization (NFKC + mixed-script
// rejection) so handlers don't need to remember to call it. Single source of
// truth for "is this email allowed to sign up?"
import { drizzle } from 'drizzle-orm/d1'
import { asc, eq } from 'drizzle-orm'
import type { Env } from '../env'
import { schema, allowedEmail } from '../schema'
import { normalizeEmail } from '../email-normalize'

const dbFor = (env: Env) => drizzle(env.AUTH_DB, { schema })

export interface AllowedEmail {
  email: string
  createdAt: string
  createdBy: string | null
}

export type MutationResult = { ok: true } | { ok: false; error: string }

export async function list(env: Env): Promise<AllowedEmail[]> {
  return dbFor(env)
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
export async function isAllowed(env: Env, rawEmail: string): Promise<boolean> {
  const result = normalizeEmail(rawEmail)
  if (!result.ok) return false
  const row = await dbFor(env)
    .select({ email: allowedEmail.email })
    .from(allowedEmail)
    .where(eq(allowedEmail.email, result.email))
    .get()
  return !!row
}

export async function allow(env: Env, rawEmail: string, createdBy: string): Promise<MutationResult> {
  const result = normalizeEmail(rawEmail)
  if (!result.ok) return { ok: false, error: result.error }
  // ON CONFLICT DO NOTHING — idempotent. Re-adding an existing email is a no-op.
  await dbFor(env)
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

export async function revoke(env: Env, rawEmail: string): Promise<MutationResult> {
  const result = normalizeEmail(rawEmail)
  if (!result.ok) return { ok: false, error: result.error }
  await dbFor(env)
    .delete(allowedEmail)
    .where(eq(allowedEmail.email, result.email))
    .run()
  return { ok: true }
}
