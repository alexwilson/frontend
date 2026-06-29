import { createRemoteJWKSet, customFetch, jwtVerify } from "jose"

import index from "../dist/index.html"
import type { Env } from "./env"
import { fetchFeed } from "./github"
import { resolveRepoPath } from "./routes"

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://static.alexwilson.tech",
  "style-src 'self' 'unsafe-inline' https://static.alexwilson.tech",
  "img-src 'self' data: https:",
  "font-src 'self' data: https://static.alexwilson.tech",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy": CSP,
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith("/reader/api/")) return handleApi(request, env, url)

    if (url.pathname === "/reader/sw.js") {
      const upstream = await fetch("https://static.alexwilson.tech/reader/sw.js")
      return new Response(upstream.body, {
        status: upstream.status,
        headers: { "content-type": "text/javascript", "cache-control": "no-cache" },
      })
    }

    return new Response(index, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
        "cache-control": "max-age=600, must-revalidate",
        ...SECURITY_HEADERS,
      },
    })
  },
}

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 })

  const repoPath = resolveRepoPath(url.pathname)
  if (!repoPath) return new Response("Not Found", { status: 404 })

  if (!(await authorized(request, env))) return new Response("Unauthorized", { status: 401 })

  const body = await fetchFeed(repoPath, env)
  if (body === null) return new Response("Not Found", { status: 404 })

  return new Response(body, {
    headers: { "content-type": "application/json", "cache-control": "private, max-age=60" },
  })
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

async function authorized(request: Request, env: Env): Promise<boolean> {
  const token = bearer(request)
  if (!token) return false

  jwks ??= createRemoteJWKSet(new URL("/auth/jwks", env.AUTH_BASE_URL), {
    [customFetch]: (async (url, options) => {
      const viaBinding = await env.AUTH?.fetch(url, options).catch(() => null)
      return viaBinding?.ok ? viaBinding : fetch(url, options)
    }) as typeof fetch,
  })
  try {
    await jwtVerify(token, jwks, { issuer: env.AUTH_BASE_URL, audience: env.AUTH_BASE_URL })
    return true
  } catch {
    return false
  }
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization")
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null
}
