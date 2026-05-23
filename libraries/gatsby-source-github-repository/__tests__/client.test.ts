import { describe, expect, it, vi } from "vitest";
import { RequestError } from "@octokit/request-error";

import { createClient, parseRetryAfter } from "../src/lib/client.js";

function makeCache(seed: Record<string, unknown> = {}): {
  store: Map<string, unknown>;
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
} {
  const store = new Map<string, unknown>(Object.entries(seed));
  return {
    store,
    get: vi.fn(async (k: string) => store.get(k)),
    set: vi.fn(async (k: string, v: unknown) => {
      store.set(k, v);
    }),
  };
}

function makeClient({
  request,
  cache,
  sleep,
}: {
  request?: any;
  cache?: ReturnType<typeof makeCache>;
  sleep?: any;
} = {}) {
  return createClient({
    getToken: async () => "test-token",
    cache: (cache ?? makeCache()) as never,
    owner: "o",
    repo: "r",
    userAgent: "test",
    request,
    sleep: sleep ?? (async () => {}),
  });
}

function ok(data: unknown, headers: Record<string, string> = {}) {
  return { status: 200, headers, data, url: "https://api.github.com/x" };
}

function notModifiedError() {
  return new RequestError("not modified", 304, {
    response: { status: 304, headers: {}, url: "x", data: undefined },
    request: { method: "GET", url: "x", headers: {} },
  });
}

function rateLimitedError(status: number, headers: Record<string, string>) {
  return new RequestError("rate limited", status, {
    response: { status, headers, url: "x", data: undefined },
    request: { method: "GET", url: "x", headers: {} },
  });
}

describe("resolveRef", () => {
  it("returns the input directly when it is a 40-char commit SHA", async () => {
    const request = vi.fn();
    const client = makeClient({ request });
    const result = await client.resolveRef("a".repeat(40));
    expect(result).toEqual({ commitSha: "a".repeat(40), fromCache: false });
    expect(request).not.toHaveBeenCalled();
  });

  it("stores etag and commit SHA on a fresh response", async () => {
    const cache = makeCache();
    const request = vi.fn(async () =>
      ok({ sha: "deadbeef".padEnd(40, "0") }, { etag: '"abc"' }),
    );
    const client = makeClient({ request, cache });

    const result = await client.resolveRef("main");
    expect(result.fromCache).toBe(false);
    expect(result.commitSha).toBe("deadbeef".padEnd(40, "0"));
    expect(cache.set).toHaveBeenCalledWith("ref:o/r:main", {
      etag: '"abc"',
      commitSha: "deadbeef".padEnd(40, "0"),
    });
  });

  it("sends If-None-Match when an etag is cached, and returns cached SHA on 304", async () => {
    const cache = makeCache({
      "ref:o/r:main": { etag: '"abc"', commitSha: "cached-sha".padEnd(40, "0") },
    });
    const request = vi.fn(async () => {
      throw notModifiedError();
    });
    const client = makeClient({ request, cache });

    const result = await client.resolveRef("main");
    expect(result).toEqual({
      commitSha: "cached-sha".padEnd(40, "0"),
      fromCache: true,
    });
    expect(request).toHaveBeenCalledWith(
      "GET /repos/{owner}/{repo}/commits/{ref}",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer test-token",
          "if-none-match": '"abc"',
        }),
      }),
    );
  });
});

describe("authedRequest header merging", () => {
  it("always sends authorization, even when caller passes other headers", async () => {
    const request = vi.fn(async () => ok({ sha: "x".repeat(40) }, {}));
    const client = makeClient({ request });
    await client.resolveRef("main");

    const passed = request.mock.calls[0][1];
    expect(passed.headers).toMatchObject({
      authorization: "Bearer test-token",
      "user-agent": "test",
      accept: "application/vnd.github+json",
    });
  });

  it("merges caller headers on top of auth headers without dropping auth", async () => {
    const cache = makeCache({
      "ref:o/r:main": { etag: '"e"', commitSha: "y".repeat(40) },
    });
    const request = vi.fn(async () => ok({ sha: "z".repeat(40) }, { etag: '"f"' }));
    const client = makeClient({ request, cache });

    await client.resolveRef("main");

    const passed = request.mock.calls[0][1];
    expect(passed.headers.authorization).toBe("Bearer test-token");
    expect(passed.headers["if-none-match"]).toBe('"e"');
  });
});

describe("getTree", () => {
  it("returns cached tree without a request", async () => {
    const entries = [{ path: "a.md", sha: "s1", size: 1, mode: "100644" }];
    const cache = makeCache({ "tree:o/r:commit": { entries } });
    const request = vi.fn();
    const client = makeClient({ request, cache });

    const result = await client.getTree("commit");
    expect(result.entries).toEqual(entries);
    expect(result.fromCache).toBe(true);
    expect(request).not.toHaveBeenCalled();
  });

  it("fetches and caches the tree, dropping non-blob entries", async () => {
    const cache = makeCache();
    const request = vi.fn(async () =>
      ok({
        truncated: false,
        tree: [
          { path: "posts", type: "tree", sha: "t1" },
          { path: "posts/a.md", type: "blob", sha: "b1", size: 10, mode: "100644" },
          { path: "posts/b.md", type: "blob", sha: "b2", size: 20, mode: "100644" },
        ],
      }),
    );
    const client = makeClient({ request, cache });

    const result = await client.getTree("commit");
    expect(result.entries).toEqual([
      { path: "posts/a.md", sha: "b1", size: 10, mode: "100644" },
      { path: "posts/b.md", sha: "b2", size: 20, mode: "100644" },
    ]);
    expect(cache.set).toHaveBeenCalledWith(
      "tree:o/r:commit",
      expect.objectContaining({ entries: result.entries }),
    );
  });

  it("throws when the API reports the tree is truncated", async () => {
    const request = vi.fn(async () => ok({ truncated: true, tree: [] }));
    const client = makeClient({ request });
    await expect(client.getTree("commit")).rejects.toThrow(/truncated/);
  });
});

describe("getBlob", () => {
  it("returns a buffer from the cache without a request", async () => {
    const cache = makeCache({ "blob:s1": Buffer.from("hello").toString("base64") });
    const request = vi.fn();
    const client = makeClient({ request, cache });

    const { buffer, fromCache } = await client.getBlob("s1");
    expect(buffer.toString()).toBe("hello");
    expect(fromCache).toBe(true);
    expect(request).not.toHaveBeenCalled();
  });

  it("fetches, decodes base64, and caches the content", async () => {
    const cache = makeCache();
    const request = vi.fn(async () =>
      ok({ encoding: "base64", content: Buffer.from("world").toString("base64") }),
    );
    const client = makeClient({ request, cache });

    const { buffer, fromCache } = await client.getBlob("s2");
    expect(buffer.toString()).toBe("world");
    expect(fromCache).toBe(false);
    expect(cache.set).toHaveBeenCalledWith(
      "blob:s2",
      Buffer.from("world").toString("base64"),
    );
  });

  it("rejects unexpected encodings", async () => {
    const request = vi.fn(async () =>
      ok({ encoding: "utf-8", content: "raw" }),
    );
    const client = makeClient({ request });
    await expect(client.getBlob("s3")).rejects.toThrow(/encoding utf-8/);
  });
});

describe("rate-limit snapshot", () => {
  it("captures the latest x-ratelimit headers from successful responses", async () => {
    const request = vi.fn(async () =>
      ok({ sha: "a".repeat(40) }, {
        "x-ratelimit-limit": "5000",
        "x-ratelimit-remaining": "4998",
        "x-ratelimit-reset": "1234567890",
      }),
    );
    const client = makeClient({ request });

    await client.resolveRef("main");

    expect(client.rateLimit.snapshot).toEqual({
      limit: 5000,
      remaining: 4998,
      reset: 1234567890,
    });
  });

  it("captures headers from 304 responses too", async () => {
    const cache = makeCache({
      "ref:o/r:main": { etag: '"e"', commitSha: "y".repeat(40) },
    });
    const request = vi.fn(async () => {
      throw new RequestError("304", 304, {
        response: {
          status: 304,
          headers: {
            "x-ratelimit-limit": "5000",
            "x-ratelimit-remaining": "4999",
            "x-ratelimit-reset": "9999999999",
          },
          url: "x",
          data: undefined,
        },
        request: { method: "GET", url: "x", headers: {} },
      });
    });
    const client = makeClient({ request, cache });

    await client.resolveRef("main");

    expect(client.rateLimit.snapshot?.remaining).toBe(4999);
  });

  it("leaves snapshot null when responses lack rate-limit headers", async () => {
    const request = vi.fn(async () => ok({ sha: "a".repeat(40) }, {}));
    const client = makeClient({ request });
    await client.resolveRef("main");
    expect(client.rateLimit.snapshot).toBeNull();
  });
});

describe("retry-after handling", () => {
  it("retries on 429 with retry-after, then succeeds", async () => {
    const sleep = vi.fn(async () => {});
    let calls = 0;
    const request = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw rateLimitedError(429, { "retry-after": "0" });
      return ok({ sha: "a".repeat(40) }, {});
    });
    const client = makeClient({ request, sleep });

    const result = await client.resolveRef("main");

    expect(result.commitSha).toBe("a".repeat(40));
    expect(request).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("retries on 403 with retry-after (secondary rate limit)", async () => {
    const sleep = vi.fn(async () => {});
    let calls = 0;
    const request = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw rateLimitedError(403, { "retry-after": "2" });
      return ok({ sha: "a".repeat(40) }, {});
    });
    const client = makeClient({ request, sleep });

    await client.resolveRef("main");

    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it("retries on 403 with x-ratelimit-remaining=0 (primary rate limit)", async () => {
    const sleep = vi.fn(async () => {});
    const resetSeconds = Math.floor(Date.now() / 1000) + 5;
    let calls = 0;
    const request = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        throw rateLimitedError(403, {
          "x-ratelimit-limit": "5000",
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": String(resetSeconds),
        });
      }
      return ok({ sha: "a".repeat(40) }, {});
    });
    const client = makeClient({ request, sleep });

    await client.resolveRef("main");

    expect(sleep).toHaveBeenCalledTimes(1);
    const slept = sleep.mock.calls[0]![0];
    expect(slept).toBeGreaterThan(3000);
    expect(slept).toBeLessThanOrEqual(6000);
  });

  it("gives up after MAX_RETRIES retries", async () => {
    const sleep = vi.fn(async () => {});
    const request = vi.fn(async () => {
      throw rateLimitedError(429, { "retry-after": "0" });
    });
    const client = makeClient({ request, sleep });

    await expect(client.resolveRef("main")).rejects.toMatchObject({ status: 429 });
    expect(request).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-rate-limit errors", async () => {
    const sleep = vi.fn(async () => {});
    const request = vi.fn(async () => {
      throw rateLimitedError(500, {});
    });
    const client = makeClient({ request, sleep });

    await expect(client.resolveRef("main")).rejects.toMatchObject({ status: 500 });
    expect(request).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});

describe("parseRetryAfter", () => {
  it("parses seconds", () => {
    expect(parseRetryAfter("5")).toBe(5000);
    expect(parseRetryAfter("0")).toBe(0);
  });

  it("parses HTTP-date format", () => {
    const future = new Date(Date.now() + 3000).toUTCString();
    const ms = parseRetryAfter(future);
    expect(ms).toBeGreaterThan(2000);
    expect(ms).toBeLessThanOrEqual(4000);
  });

  it("returns null for empty / undefined / unparseable", () => {
    expect(parseRetryAfter(undefined)).toBeNull();
    expect(parseRetryAfter("")).toBeNull();
    expect(parseRetryAfter("not-a-date")).toBeNull();
  });
});
