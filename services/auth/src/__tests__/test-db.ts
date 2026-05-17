// Test DB factory — builds a drizzle handle backed by an in-memory SQLite
// database, with tables created directly from our drizzle schema (no
// migration files loaded). Tests of domain functions consume the returned
// `db` exactly as production handlers do — same drizzle query API, no D1
// emulation in between.
//
// Why no migrations: tests should verify the *current* schema. If a
// migration is missing or wrong, that's a separate concern caught by
// `pnpm db:generate` + integration testing, not by unit tests of domain
// logic.
import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { getTableConfig, type SQLiteTable } from 'drizzle-orm/sqlite-core'
import { schema } from '../schema'
import type { Db } from '../domain/db'

export interface TestDb {
  db: Db
  close(): void
}

export function makeTestDb(): TestDb {
  const sqlite = new Database(':memory:')
  // Off by default — tests seed data without worrying about FK order.
  sqlite.pragma('foreign_keys = OFF')
  for (const table of Object.values(schema)) {
    sqlite.exec(createTableSQL(table as SQLiteTable))
  }
  // Cast through `unknown` because drizzle's better-sqlite3 and d1 handles
  // differ at the type level (their inferred generics aren't structurally
  // compatible), but the runtime query API is identical for our purposes.
  const db = drizzleSqlite(sqlite, { schema }) as unknown as Db
  return { db, close: () => sqlite.close() }
}

// Emits a single CREATE TABLE from a drizzle table definition. Covers what
// our schema actually uses: TEXT / INTEGER columns, PRIMARY KEY, NOT NULL,
// UNIQUE (column-level + named constraints). Skips: indexes (don't affect
// correctness in tests, only performance), foreign keys (we keep FK
// enforcement off in tests so seeding is order-independent), defaults
// (none in our schema), check constraints (none in our schema).
//
// If the schema grows to need any of the skipped features, extend here.
function createTableSQL(table: SQLiteTable): string {
  const cfg = getTableConfig(table)
  const lines: string[] = []
  for (const col of cfg.columns) {
    const parts = [`\`${col.name}\``, col.getSQLType()]
    if (col.primary) parts.push('PRIMARY KEY')
    if (col.notNull) parts.push('NOT NULL')
    lines.push(parts.join(' '))
  }
  for (const u of cfg.uniqueConstraints) {
    const cols = u.columns.map((c) => `\`${c.name}\``).join(', ')
    lines.push(`UNIQUE (${cols})`)
  }
  return `CREATE TABLE \`${cfg.name}\` (${lines.join(', ')})`
}
