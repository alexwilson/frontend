// Shared DB handle type + factory.
//
// `Db` is the typed drizzle handle our domain functions accept. Production
// callers build it via `dbFor(env)`, which wires it to the D1 binding. Tests
// build their own (e.g. better-sqlite3 via `drizzle-orm/better-sqlite3`) and
// cast to `Db` — drizzle's query API is identical across sqlite-core drivers
// at runtime, so the cast is safe even though the parameterised types differ.
//
// This is the one place in the worker that knows we're on D1. Everything
// downstream (domain functions, app lifecycle hooks) just sees `Db`.
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { drizzle } from 'drizzle-orm/d1'
import type { Env } from '../env'
import { schema } from '../schema'

export type Db = DrizzleD1Database<typeof schema>

export const dbFor = (env: Env): Db => drizzle(env.AUTH_DB, { schema })
