import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../dist/index.html", () => ({ default: "<!doctype html><title>Reader</title>" }))
vi.mock("./github", () => ({ fetchFeed: vi.fn() }))
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => ({})),
  jwtVerify: vi.fn(),
  customFetch: Symbol("customFetch"),
}))

import worker from "./index"
import type { Env } from "./env"
import { fetchFeed } from "./github"
import { jwtVerify } from "jose"

const feed = vi.mocked(fetchFeed)
const verify = vi.mocked(jwtVerify)

const env: Env = {
  AUTH_BASE_URL: "https://auth.test",
  FEEDS_OWNER: "o",
  FEEDS_REPO: "r",
  GITHUB_TOKEN: "x",
}

function get(path: string, headers: Record<string, string> = {}): Request {
  return new Request(`https://alexwilson.tech${path}`, { headers })
}

const bearer = { authorization: "Bearer jwt" }

describe("worker.fetch", () => {
  beforeEach(() => {
    feed.mockReset()
    verify.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it("proxies the service worker same-origin, with no-cache", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("self.skipWaiting()", { headers: { "content-type": "application/javascript" } })),
    )
    const res = await worker.fetch(get("/reader/sw.js"), env)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("javascript")
    expect(res.headers.get("cache-control")).toBe("no-cache")
    expect(await res.text()).toBe("self.skipWaiting()")
  })

  it("serves the SPA shell (with CSP) for non-API paths", async () => {
    for (const path of ["/reader/", "/reader/feeds", "/reader/feed/abc"]) {
      const res = await worker.fetch(get(path), env)
      expect(res.status).toBe(200)
      expect(res.headers.get("content-type")).toContain("text/html")
      expect(res.headers.get("content-security-policy")).toContain("default-src 'self'")
      expect(feed).not.toHaveBeenCalled()
    }
  })

  it("405s on non-GET", async () => {
    const res = await worker.fetch(
      new Request("https://alexwilson.tech/reader/api/river", { method: "POST", headers: bearer }),
      env,
    )
    expect(res.status).toBe(405)
  })

  it("404s for an off-allowlist path, before auth", async () => {
    const res = await worker.fetch(get("/reader/api/secrets", bearer), env)
    expect(res.status).toBe(404)
    expect(verify).not.toHaveBeenCalled()
    expect(feed).not.toHaveBeenCalled()
  })

  it("401s without a bearer token", async () => {
    expect((await worker.fetch(get("/reader/api/river"), env)).status).toBe(401)
    expect(verify).not.toHaveBeenCalled()
  })

  it("401s when the token does not verify", async () => {
    verify.mockRejectedValue(new Error("bad signature"))
    expect((await worker.fetch(get("/reader/api/river", bearer), env)).status).toBe(401)
    expect(feed).not.toHaveBeenCalled()
  })

  it("serves the file, marked private, for a valid token", async () => {
    verify.mockResolvedValue({} as never)
    feed.mockResolvedValue(JSON.stringify({ entries: [] }))
    const res = await worker.fetch(get("/reader/api/river", bearer), env)
    expect(res.status).toBe(200)
    expect(res.headers.get("cache-control")).toBe("private, max-age=60")
    expect(await res.json()).toEqual({ entries: [] })
    expect(verify).toHaveBeenCalledWith("jwt", expect.anything(), {
      issuer: "https://auth.test",
      audience: "https://auth.test",
    })
  })

  it("404s when the file is missing", async () => {
    verify.mockResolvedValue({} as never)
    feed.mockResolvedValue(null)
    expect((await worker.fetch(get("/reader/api/feeds/missing", bearer), env)).status).toBe(404)
  })
})
