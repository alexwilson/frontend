export interface Env {
  AUTH?: Fetcher // service binding to the auth worker (JWKS fetch); absent in dev
  AUTH_BASE_URL: string
  FEEDS_OWNER: string
  FEEDS_REPO: string

  // GitHub credential: App preferred, flat token fallback (worker/github.ts).
  GITHUB_APP_ID?: string
  GITHUB_APP_PRIVATE_KEY?: string
  GITHUB_TOKEN?: string
}
