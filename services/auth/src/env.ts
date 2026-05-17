export interface Env {
  // Bindings
  AUTH_DB: D1Database

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
