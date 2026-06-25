import { createAppAuth } from "@octokit/auth-app"
import { Octokit } from "@octokit/core"
import type { Env } from "./env"

// Reads a file from the private feeds repo via Octokit. App credentials are
// preferred; a flat token (PAT) is the fallback — the deployment picks by which
// env vars it sets. The credential never leaves the Worker.
let client: Octokit | null = null

export async function fetchFeed(repoPath: string, env: Env): Promise<string | null> {
  try {
    const res = await (await github(env)).request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: env.FEEDS_OWNER,
      repo: env.FEEDS_REPO,
      path: repoPath,
      mediaType: { format: "raw" },
    })
    return typeof res.data === "string" ? res.data : JSON.stringify(res.data)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

async function github(env: Env): Promise<Octokit> {
  if (client) return client

  if (env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY) {
    const auth = { appId: env.GITHUB_APP_ID, privateKey: env.GITHUB_APP_PRIVATE_KEY }
    // No installation id to configure: resolve the one covering the feeds repo.
    const app = new Octokit({ authStrategy: createAppAuth, auth, request: { fetch: cfFetch } })
    const { data } = await app.request("GET /repos/{owner}/{repo}/installation", {
      owner: env.FEEDS_OWNER,
      repo: env.FEEDS_REPO,
    })
    client = new Octokit({
      authStrategy: createAppAuth,
      auth: { ...auth, installationId: data.id },
      request: { fetch: cfFetch },
    })
  } else {
    client = new Octokit({ auth: env.GITHUB_TOKEN, request: { fetch: cfFetch } })
  }
  return client
}

// Cache the (server-side, already-gated) GitHub leg at Cloudflare's edge, keyed
// on URL — the payload is identical for all callers.
const cfFetch = ((input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, { ...init, cf: { cacheEverything: true, cacheTtl: 60 } })) as typeof fetch
