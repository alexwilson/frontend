import type { Env } from "./env"
import { fetchFeed } from "./github"
import { resolveRepoPath } from "./routes"

// Gate on auth, then serve a feed file from the private repo. The GitHub
// credential stays server-side; the client only ever sees JSON.
// See doc/arch/0000-feed-data-bff.md.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 })

    const repoPath = resolveRepoPath(new URL(request.url).pathname)
    if (!repoPath) return new Response("Not Found", { status: 404 })

    if (!(await authorized(request, env))) return new Response("Unauthorized", { status: 401 })

    const body = await fetchFeed(repoPath, env)
    if (body === null) return new Response("Not Found", { status: 404 })

    // private: shared caches must not store gated data; the browser/SW may.
    return new Response(body, {
      headers: { "content-type": "application/json", "cache-control": "private, max-age=60" },
    })
  },
}

// Forward the request's cookie to better-auth's get-session; a resolved user
// authorises the request. Same-origin means the session cookie is already here.
async function authorized(request: Request, env: Env): Promise<boolean> {
  const cookie = request.headers.get("cookie")
  if (!cookie) return false

  const res = await fetch(`${env.AUTH_BASE_URL}/auth/get-session`, {
    headers: { cookie, accept: "application/json", "user-agent": "reader-data-bff" },
  })
  if (!res.ok) return false

  const session = (await res.json().catch(() => null)) as { user?: unknown } | null
  return Boolean(session?.user)
}
