import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GitHubClient } from "../src/lib/client.js";
import { pollOnce, withOverlapGuard, type PollContext } from "../src/lib/poller.js";
import { createState } from "../src/lib/source.js";
import type { FileNode } from "../src/lib/nodes.js";
import type { PluginOptions } from "../src/lib/options.js";

let tmpdir: string;

beforeEach(async () => {
  tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), "gs-ghr-poller-"));
});

afterEach(async () => {
  await fs.rm(tmpdir, { recursive: true, force: true });
});

function makeReporter() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function makeCtx(client: GitHubClient, lastCommitSha: string | null = null): PollContext {
  const nodes = new Map<string, FileNode>();
  const reporter = makeReporter();
  const state = createState();
  state.lastCommitSha = lastCommitSha;
  return {
    gatsby: {
      actions: {
        createNode: (n) => {
          nodes.set(n.id, n);
        },
        deleteNode: (n) => {
          nodes.delete(n.id);
        },
      },
      cache: {
        directory: tmpdir,
        get: async () => undefined,
        set: async () => {},
      },
      createNodeId: (i) => `id:${i}`,
      getNode: (id) => nodes.get(id),
    },
    reporter,
    options: {
      name: "posts",
      owner: "o",
      repo: "r",
      ref: "main",
      patterns: ["**"],
      token: "x",
      userAgent: "u",
      pollInterval: 30,
      concurrency: 4,
    } as PluginOptions,
    state,
    client,
    budget: { warned: false },
  };
}

function buildClient(sha: string): GitHubClient {
  return {
    resolveRef: async () => ({ commitSha: sha, fromCache: false }),
    getTree: async () => ({ entries: [], truncated: false, fromCache: false }),
    getBlob: async () => ({ buffer: Buffer.from(""), fromCache: false }),
    rateLimit: { snapshot: null },
  };
}

describe("pollOnce", () => {
  it("returns false and logs nothing when the ref hasn't moved", async () => {
    const sha = "a".repeat(40);
    const ctx = makeCtx(buildClient(sha), sha);

    const moved = await pollOnce(ctx);

    expect(moved).toBe(false);
    expect(ctx.reporter.info).not.toHaveBeenCalled();
    expect(ctx.reporter.error).not.toHaveBeenCalled();
  });

  it("returns true and logs an info line when the ref moves", async () => {
    const newSha = "b".repeat(40);
    const ctx = makeCtx(buildClient(newSha), "a".repeat(40));

    const moved = await pollOnce(ctx);

    expect(moved).toBe(true);
    expect(ctx.reporter.info).toHaveBeenCalledTimes(1);
    expect(ctx.reporter.info.mock.calls[0]![0]).toContain("aaaaaaa → bbbbbbb");
  });

  it("renders '—' for the previous SHA on the first move", async () => {
    const ctx = makeCtx(buildClient("c".repeat(40)));

    await pollOnce(ctx);

    expect(ctx.reporter.info.mock.calls[0]![0]).toContain("— → ccccccc");
  });

  it("calls reporter.error (not warn) on source failure and returns false", async () => {
    const client: GitHubClient = {
      resolveRef: async () => {
        throw new Error("Bad credentials");
      },
      getTree: async () => ({ entries: [], truncated: false, fromCache: false }),
      getBlob: async () => ({ buffer: Buffer.from(""), fromCache: false }),
      rateLimit: { snapshot: null },
    };
    const ctx = makeCtx(client);

    const moved = await pollOnce(ctx);

    expect(moved).toBe(false);
    expect(ctx.reporter.error).toHaveBeenCalledTimes(1);
    expect(ctx.reporter.error.mock.calls[0]![0]).toContain("Bad credentials");
    expect(ctx.reporter.warn).not.toHaveBeenCalled();
  });

  it("warns once when the rate-limit budget falls below the threshold", async () => {
    const client: GitHubClient = {
      resolveRef: async () => ({ commitSha: "b".repeat(40), fromCache: false }),
      getTree: async () => ({ entries: [], truncated: false, fromCache: false }),
      getBlob: async () => ({ buffer: Buffer.from(""), fromCache: false }),
      rateLimit: { snapshot: { limit: 5000, remaining: 100, reset: null } },
    };
    const ctx = makeCtx(client, "a".repeat(40));

    await pollOnce(ctx);

    expect(ctx.reporter.warn).toHaveBeenCalledTimes(1);
    expect(ctx.budget.warned).toBe(true);
  });
});

describe("withOverlapGuard", () => {
  it("collapses concurrent calls so only one runs at a time", async () => {
    let inFlight = 0;
    let peak = 0;
    const work = vi.fn(async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight -= 1;
    });
    const guarded = withOverlapGuard(work);

    await Promise.all([guarded(), guarded(), guarded()]);

    expect(peak).toBe(1);
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("allows sequential calls after the previous one completes", async () => {
    const work = vi.fn(async () => {});
    const guarded = withOverlapGuard(work);

    await guarded();
    await guarded();
    await guarded();

    expect(work).toHaveBeenCalledTimes(3);
  });

  it("releases the guard even if the underlying call throws", async () => {
    let calls = 0;
    const work = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
    });
    const guarded = withOverlapGuard(work);

    await guarded();
    await guarded();

    expect(work).toHaveBeenCalledTimes(2);
  });
});
