import { describe, expect, it } from "vitest"
import { resolveRepoPath } from "./routes"

describe("resolveRepoPath", () => {
  it("maps the known views to repo files", () => {
    expect(resolveRepoPath("/reader/api/river")).toBe("data/river.json")
    expect(resolveRepoPath("/reader/api/index")).toBe("data/index.json")
    expect(resolveRepoPath("/reader/api/feeds/abc-123")).toBe("data/feeds/abc-123.json")
  })

  it("tolerates a trailing slash", () => {
    expect(resolveRepoPath("/reader/api/river/")).toBe("data/river.json")
  })

  it("rejects anything off the allowlist", () => {
    expect(resolveRepoPath("/reader/api/secrets")).toBeNull()
    expect(resolveRepoPath("/reader/api")).toBeNull()
    expect(resolveRepoPath("/somewhere/else")).toBeNull()
  })

  it("rejects path traversal and malformed feed ids", () => {
    expect(resolveRepoPath("/reader/api/feeds/../../secret")).toBeNull()
    expect(resolveRepoPath("/reader/api/feeds/UPPER")).toBeNull()
    expect(resolveRepoPath("/reader/api/feeds/a/b")).toBeNull()
    expect(resolveRepoPath("/reader/api/feeds/.env")).toBeNull()
  })
})
