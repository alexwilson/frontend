export interface Env {
  AUTH_BASE_URL: string
  FEEDS_OWNER: string
  FEEDS_REPO: string

  // GitHub credential. App is preferred (its installation is resolved at
  // runtime); the flat token is the fallback — the deployment picks by which
  // vars it sets (see worker/github.ts). App private key + PAT are secrets.
  GITHUB_APP_ID?: string
  GITHUB_APP_PRIVATE_KEY?: string
  GITHUB_TOKEN?: string
}
