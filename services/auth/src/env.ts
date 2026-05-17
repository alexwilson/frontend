export interface Env {
  // Bindings
  AUTH_DB: D1Database

  // Optional so local dev and the CLI runtime work without it configured.
  RATE_LIMITER?: { limit: (opts: { key: string }) => Promise<{ success: boolean }> }

  // Secrets — set via `wrangler secret put`
  BETTER_AUTH_SECRET: string

  // Identity App — used for sign-in. No repo scope, just user:email.
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string

  // CMS App — linked lazily, only when a caller invokes /auth/cms/token.
  // Installed on the content repo; this is what produces ghu_* tokens for Decap.
  GITHUB_CMS_CLIENT_ID: string
  GITHUB_CMS_CLIENT_SECRET: string

  // Vars — set in wrangler.toml [vars]
  BASE_URL: string
  TRUSTED_ORIGINS: string
}

const validated = new WeakSet<object>()

export function validateEnv(env: Env): void {
  if (validated.has(env)) return

  requireString('BETTER_AUTH_SECRET', env.BETTER_AUTH_SECRET)
  requireString('GITHUB_CLIENT_ID', env.GITHUB_CLIENT_ID)
  requireString('GITHUB_CLIENT_SECRET', env.GITHUB_CLIENT_SECRET)
  requireString('GITHUB_CMS_CLIENT_ID', env.GITHUB_CMS_CLIENT_ID)
  requireString('GITHUB_CMS_CLIENT_SECRET', env.GITHUB_CMS_CLIENT_SECRET)
  requireOrigin('BASE_URL', env.BASE_URL)

  const origins = env.TRUSTED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
  if (origins.length === 0) throw new Error('env: TRUSTED_ORIGINS empty after split')
  for (const o of origins) requireOrigin('TRUSTED_ORIGINS entry', o)

  validated.add(env)
}

function requireString(name: string, val: unknown): asserts val is string {
  if (typeof val !== 'string' || val.length === 0) {
    throw new Error(`env: ${name} missing or empty`)
  }
}

// https-only origin (scheme + host + optional port). Localhost exempted.
function requireOrigin(name: string, val: unknown): asserts val is string {
  requireString(name, val)
  let u: URL
  try {
    u = new URL(val)
  } catch {
    throw new Error(`env: ${name} not a valid URL: ${val}`)
  }
  if (u.protocol !== 'https:' && u.hostname !== 'localhost') {
    throw new Error(`env: ${name} must use https (got ${u.protocol}//${u.hostname})`)
  }
  if (u.pathname !== '/' && u.pathname !== '') {
    throw new Error(`env: ${name} must be an origin without path (got ${val})`)
  }
  if (u.search || u.hash) {
    throw new Error(`env: ${name} must not carry query/fragment (got ${val})`)
  }
  if (val.endsWith('/')) {
    throw new Error(`env: ${name} must not have trailing slash (got ${val})`)
  }
}
