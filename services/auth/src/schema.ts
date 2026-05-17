// Drizzle schema for the auth worker.
//
// Convention:
//   • SQL: snake_case for table and column names. Standard SQL practice.
//   • TypeScript: camelCase for field names. Standard JS/TS practice.
//   • Drizzle bridges via the first arg to text()/integer() (the SQL name)
//     and the JS property name (the TS name).
//   • Dates use `integer({ mode: 'timestamp_ms' })` — stored as INTEGER
//     (Unix ms), exposed in JS as Date. Drizzle's TEXT type has no date
//     mode in this version, and better-auth passes Date objects through
//     to the adapter so transparent conversion is required.
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  // admin plugin fields
  role: text('role'),
  banned: integer('banned', { mode: 'boolean' }),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp_ms' }),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  // admin plugin field
  impersonatedBy: text('impersonated_by'),
}, (t) => ({
  userIdIdx: index('session_user_id_idx').on(t.userId),
}))

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  // Our addition: timestamp of the most recent JWT #2 issuance for this
  // (user, provider). Used by the idle-revocation cron in src/cron.ts to
  // identify access tokens that haven't been handed to a client recently.
  // Nullable for pre-migration rows and freshly-OAuth-linked rows that
  // haven't yet had a token brokered; the cron uses
  // COALESCE(last_issued_at, created_at) so existing rows fall back to
  // their creation time (and get revoked on first tick if old enough).
  lastIssuedAt: integer('last_issued_at', { mode: 'timestamp_ms' }),
}, (t) => ({
  userIdIdx: index('account_user_id_idx').on(t.userId),
}))

// Signing-key store for the JWT plugin. Plugin generates a keypair on first
// use and rotates per its config. Schema declared by better-auth's
// plugins/jwt/schema; we mirror it in Drizzle for migration generation.
export const jwks = sqliteTable('jwks', {
  id: text('id').primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => ({
  identifierIdx: index('verification_identifier_idx').on(t.identifier),
}))

// ─── Our extension ──────────────────────────────────────────────────────────
// TS export `allowedEmail`, SQL table `allowed_email`. `created_at` here is
// inserted by us (we control both ends), so we keep it as text/ISO string
// for human-readable rows when inspecting the DB.
export const allowedEmail = sqliteTable('allowed_email', {
  email: text('email').primaryKey(),
  createdAt: text('created_at').notNull(),
  createdBy: text('created_by'),
})

export const schema = {
  user,
  session,
  account,
  verification,
  jwks,
  allowedEmail,
}
