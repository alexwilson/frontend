import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./github", () => ({ fetchFeed: vi.fn() }))

import worker from "./index"
import type { Env } from "./env"
import { fetchFeed } from "./github"

const feed = vi.mocked(fetchFeed)

const env: Env = {
  AUTH_BASE_URL: "https://auth.test",
  FEEDS_OWNER: "o",
  FEEDS_REPO: "r",
  GITHUB_TOKEN: "x",
}

function get(path: string, headers: Record<string, string> = {}): Request {
  return new Request(`https://alexwilson.tech${path}`, { headers })
}

const withCookie = { cookie: "auth.session=x" }

// Stub the introspection call: /auth/get-session reflects whether we're signed in.
function stubSession(signedIn: boolean) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(signedIn ? { user: { id: "u" } } : {}))),
  )
}

describe("worker.fetch", () => {
  beforeEach(() => feed.mockReset())
  afterEach(() => vi.restoreAllMocks())

  it("405s on non-GET", async () => {
    const res = await worker.fetch(
      new Request("https://alexwilson.tech/reader/api/river", { method: "POST" }),
      env,
    )
    expect(res.status).toBe(405)
  })

  it("404s for an off-allowlist path, before auth", async () => {
    const res = await worker.fetch(get("/reader/api/secrets", withCookie), env)
    expect(res.status).toBe(404)
    expect(feed).not.toHaveBeenCalled()
  })

  it("401s without a cookie", async () => {
    expect((await worker.fetch(get("/reader/api/river"), env)).status).toBe(401)
    expect(feed).not.toHaveBeenCalled()
  })

  it("401s when the session does not resolve", async () => {
    stubSession(false)
    expect((await worker.fetch(get("/reader/api/river", withCookie), env)).status).toBe(401)
    expect(feed).not.toHaveBeenCalled()
  })

  it("serves the file, marked private, for a signed-in request", async () => {
    stubSession(true)
    feed.mockResolvedValue(JSON.stringify({ entries: [] }))
    const res = await worker.fetch(get("/reader/api/river", withCookie), env)
    expect(res.status).toBe(200)
    expect(res.headers.get("cache-control")).toBe("private, max-age=60")
    expect(await res.json()).toEqual({ entries: [] })
  })

  it("404s when the file is missing", async () => {
    stubSession(true)
    feed.mockResolvedValue(null)
    expect((await worker.fetch(get("/reader/api/feeds/missing", withCookie), env)).status).toBe(404)
  })
})
