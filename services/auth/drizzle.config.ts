// Drizzle-kit config — only for migration GENERATION.
// Application is via `wrangler d1 migrations apply`, which doesn't need
// drizzle-kit to know about the D1 connection.
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  // No `driver` set: drizzle-kit's `generate` command works from the schema
  // file alone, no DB connection needed. We avoid `push` / `migrate` which
  // would need credentials and would conflict with wrangler's migration
  // tracking anyway.
})
