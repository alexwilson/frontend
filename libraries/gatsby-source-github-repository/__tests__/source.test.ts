import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createState, runSource, type GatsbyHelpers } from "../src/lib/source.js";
import type { GitHubClient, TreeEntry } from "../src/lib/client.js";
import type { FileNode } from "../src/lib/nodes.js";

let tmpdir: string;
let nodes: Map<string, FileNode>;
let actions: { createNode: ReturnType<typeof vi.fn>; deleteNode: ReturnType<typeof vi.fn> };
let gatsby: GatsbyHelpers;

beforeEach(async () => {
  tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), "gs-ghr-"));
  nodes = new Map<string, FileNode>();
  actions = {
    createNode: vi.fn((node: FileNode) => nodes.set(node.id, node)),
    deleteNode: vi.fn((node: FileNode) => nodes.delete(node.id)),
  };
  gatsby = {
    actions,
    cache: {
      directory: tmpdir,
      get: vi.fn(async () => undefined),
      set: vi.fn(async () => {}),
    },
    createNodeId: (input: string) => `id:${input}`,
    getNode: (id: string) => nodes.get(id),
  };
});

afterEach(async () => {
  await fs.rm(tmpdir, { recursive: true, force: true });
});

interface Fixture {
  sha: string;
  files: Array<{ entry: TreeEntry; content: string }>;
}

function blob(p: string, sha: string, content: string) {
  return { entry: { path: p, sha, size: content.length, mode: "100644" }, content };
}

function fakeClient(commits: Fixture[]): GitHubClient {
  let i = -1;
  const current = (): Fixture => commits[Math.max(0, Math.min(i, commits.length - 1))]!;
  return {
    resolveRef: vi.fn(async () => {
      i += 1;
      return { commitSha: current().sha, fromCache: false };
    }),
    getTree: vi.fn(async () => ({
      entries: current().files.map((f) => f.entry),
      truncated: false as const,
      fromCache: false,
    })),
    getBlob: vi.fn(async (sha: string) => {
      const f = current().files.find((x) => x.entry.sha === sha)!;
      return { buffer: Buffer.from(f.content), fromCache: false };
    }),
    rateLimit: { snapshot: null },
  };
}

const options = { name: "posts", ref: "main", patterns: ["**"], concurrency: 8 };

describe("runSource", () => {
  it("emits a File node per matching blob and records its ID in state", async () => {
    const state = createState();
    const client = fakeClient([
      {
        sha: "a".repeat(40),
        files: [blob("posts/one.md", "sha-1", "alpha"), blob("posts/two.md", "sha-2", "beta")],
      },
    ]);

    const result = await runSource(gatsby, options, state, client);

    expect(result.matched).toBe(2);
    expect(actions.createNode).toHaveBeenCalledTimes(2);
    expect(state.lastIds.size).toBe(2);
    expect(state.lastCommitSha).toBe("a".repeat(40));

    const written = await fs.readFile(
      path.join(tmpdir, "files", "posts", "posts/one.md"),
      "utf8",
    );
    expect(written).toBe("alpha");
  });

  it("filters out blobs that don't match any pattern", async () => {
    const state = createState();
    const client = fakeClient([
      {
        sha: "a".repeat(40),
        files: [blob("posts/keep.md", "k", "x"), blob("ignored/skip.md", "s", "y")],
      },
    ]);

    await runSource(gatsby, { ...options, patterns: ["posts/**"] }, state, client);

    expect(actions.createNode).toHaveBeenCalledTimes(1);
    const created = actions.createNode.mock.calls[0]![0];
    expect(created.relativePath).toMatch(/keep\.md$/);
  });

  it("uses the blob SHA as contentDigest", async () => {
    const state = createState();
    const client = fakeClient([
      { sha: "c".repeat(40), files: [blob("a.md", "blob-sha-xyz", "hi")] },
    ]);

    await runSource(gatsby, options, state, client);

    const created = actions.createNode.mock.calls[0]![0];
    expect(created.internal.contentDigest).toBe("blob-sha-xyz");
  });

  it("deletes nodes for paths that disappear between passes", async () => {
    const state = createState();
    const client = fakeClient([
      {
        sha: "a".repeat(40),
        files: [blob("keep.md", "k1", "k"), blob("gone.md", "g1", "g")],
      },
      {
        sha: "b".repeat(40),
        files: [blob("keep.md", "k1", "k")],
      },
    ]);

    await runSource(gatsby, options, state, client);
    expect(nodes.size).toBe(2);

    await runSource(gatsby, options, state, client);

    expect(nodes.size).toBe(1);
    expect(actions.deleteNode).toHaveBeenCalledTimes(1);
    const deleted = actions.deleteNode.mock.calls[0]![0];
    expect(deleted.relativePath).toMatch(/gone\.md$/);
  });

  it("skips deleteNode when the node has already been GC'd", async () => {
    const state = createState();
    const client = fakeClient([
      { sha: "a".repeat(40), files: [blob("gone.md", "g1", "g")] },
      { sha: "b".repeat(40), files: [] },
    ]);

    await runSource(gatsby, options, state, client);
    nodes.clear();
    await runSource(gatsby, options, state, client);

    expect(actions.deleteNode).not.toHaveBeenCalled();
  });

  it("re-emits unchanged nodes on subsequent passes (Gatsby treats this as idempotent)", async () => {
    const state = createState();
    const client = fakeClient([
      { sha: "a".repeat(40), files: [blob("a.md", "s1", "x")] },
      { sha: "b".repeat(40), files: [blob("a.md", "s1", "x")] },
    ]);

    await runSource(gatsby, options, state, client);
    await runSource(gatsby, options, state, client);

    expect(actions.createNode).toHaveBeenCalledTimes(2);
    expect(actions.deleteNode).not.toHaveBeenCalled();
    expect(state.lastCommitSha).toBe("b".repeat(40));
  });

  it("counts cached vs fetched blobs correctly when both occur", async () => {
    const state = createState();
    const files = [blob("a.md", "s-a", "alpha"), blob("b.md", "s-b", "beta")];
    const fromCacheMap: Record<string, boolean> = { "s-a": true, "s-b": false };
    const client: GitHubClient = {
      resolveRef: async () => ({ commitSha: "a".repeat(40), fromCache: false }),
      getTree: async () => ({
        entries: files.map((f) => f.entry),
        truncated: false,
        fromCache: false,
      }),
      getBlob: async (sha) => {
        const f = files.find((x) => x.entry.sha === sha)!;
        return { buffer: Buffer.from(f.content), fromCache: fromCacheMap[sha]! };
      },
      rateLimit: { snapshot: null },
    };

    const result = await runSource(gatsby, options, state, client);
    expect(result.cached).toBe(1);
    expect(result.fetched).toBe(1);
  });

  it("respects concurrency: runs at most N blob fetches in parallel", async () => {
    const state = createState();
    const files = Array.from({ length: 12 }, (_, i) =>
      blob(`p/${i}.md`, `s-${i}`, `c-${i}`),
    );
    let inFlight = 0;
    let peak = 0;
    const client: GitHubClient = {
      resolveRef: async () => ({ commitSha: "a".repeat(40), fromCache: false }),
      getTree: async () => ({
        entries: files.map((f) => f.entry),
        truncated: false,
        fromCache: false,
      }),
      getBlob: async (sha) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise((r) => setTimeout(r, 5));
        inFlight -= 1;
        const f = files.find((x) => x.entry.sha === sha)!;
        return { buffer: Buffer.from(f.content), fromCache: false };
      },
      rateLimit: { snapshot: null },
    };

    await runSource(gatsby, { ...options, concurrency: 4 }, state, client);

    expect(peak).toBeLessThanOrEqual(4);
    expect(actions.createNode).toHaveBeenCalledTimes(12);
  });

  it("rewrites a file if its bytes have changed on disk", async () => {
    const state = createState();
    const client = fakeClient([
      { sha: "a".repeat(40), files: [blob("changed.md", "s1", "fresh")] },
    ]);
    // Pre-populate the file with different bytes
    const target = path.join(tmpdir, "files", "posts", "changed.md");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, "stale");

    await runSource(gatsby, options, state, client);

    const written = await fs.readFile(target, "utf8");
    expect(written).toBe("fresh");
  });
});
