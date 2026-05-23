import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@octokit/request", () => ({
  request: vi.fn(),
}));

import { request as mockRequest } from "@octokit/request";
import { sourceNodes, onCreateDevServer, pluginOptionsSchema } from "../src/gatsby-node.js";

let tmpdir: string;

function ok(data: unknown, headers: Record<string, string> = {}) {
  return { status: 200, headers, data, url: "https://api.github.com/x" };
}

function makeArgs() {
  const activity = { start: vi.fn(), end: vi.fn(), setStatus: vi.fn() };
  const reporter = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    activityTimer: vi.fn(() => activity),
  };
  return {
    activity,
    reporter,
    cache: {
      directory: tmpdir,
      get: vi.fn(async () => undefined),
      set: vi.fn(async () => {}),
    },
    actions: { createNode: vi.fn(), deleteNode: vi.fn() },
    createNodeId: (i: string) => `id:${i}`,
    getNode: () => undefined,
  };
}

const baseOptions = {
  name: "test-instance",
  owner: "alexwilson",
  repo: "content",
  ref: "main",
  patterns: ["**"],
  token: "ghp_test",
  userAgent: "test",
  pollInterval: 0,
  concurrency: 4,
};

beforeEach(async () => {
  tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), "gs-ghr-gn-"));
  vi.mocked(mockRequest).mockReset();
});

afterEach(async () => {
  await fs.rm(tmpdir, { recursive: true, force: true });
});

describe("gatsby-node exports", () => {
  it("exposes the three Gatsby lifecycle hooks plus pluginOptionsSchema", () => {
    expect(typeof sourceNodes).toBe("function");
    expect(typeof onCreateDevServer).toBe("function");
    expect(typeof pluginOptionsSchema).toBe("function");
  });
});

describe("sourceNodes", () => {
  it("resolves the ref, fetches the tree, and reports a status line", async () => {
    vi.mocked(mockRequest)
      .mockResolvedValueOnce(
        ok(
          { sha: "a".repeat(40) },
          {
            etag: '"x"',
            "x-ratelimit-limit": "5000",
            "x-ratelimit-remaining": "4900",
            "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 300),
          },
        ) as never,
      )
      .mockResolvedValueOnce(ok({ truncated: false, tree: [] }) as never);

    const args = makeArgs();
    await sourceNodes!(args as never, { ...baseOptions, name: "sn-basic" } as never, undefined as never);

    expect(args.reporter.activityTimer).toHaveBeenCalledOnce();
    expect(args.activity.start).toHaveBeenCalledOnce();
    expect(args.activity.end).toHaveBeenCalledOnce();
    expect(args.activity.setStatus.mock.calls[0]![0]).toContain("aaaaaaa");
    expect(args.activity.setStatus.mock.calls[0]![0]).toContain("rate limit: 4900/5000");
  });

  it("warns when the rate-limit budget is low", async () => {
    vi.mocked(mockRequest)
      .mockResolvedValueOnce(
        ok(
          { sha: "b".repeat(40) },
          {
            "x-ratelimit-limit": "5000",
            "x-ratelimit-remaining": "100",
          },
        ) as never,
      )
      .mockResolvedValueOnce(ok({ truncated: false, tree: [] }) as never);

    const args = makeArgs();
    await sourceNodes!(args as never, { ...baseOptions, name: "sn-low" } as never, undefined as never);

    expect(args.reporter.warn).toHaveBeenCalledOnce();
    expect(args.reporter.warn.mock.calls[0]![0]).toContain("approaching");
  });

  it("re-uses the cached instance across calls (same key)", async () => {
    vi.mocked(mockRequest)
      .mockResolvedValueOnce(ok({ sha: "c".repeat(40) }) as never)
      .mockResolvedValueOnce(ok({ truncated: false, tree: [] }) as never)
      .mockResolvedValueOnce(ok({ sha: "c".repeat(40) }) as never)
      .mockResolvedValueOnce(ok({ truncated: false, tree: [] }) as never);

    const args = makeArgs();
    await sourceNodes!(args as never, { ...baseOptions, name: "sn-reuse" } as never, undefined as never);
    await sourceNodes!(args as never, { ...baseOptions, name: "sn-reuse" } as never, undefined as never);

    expect(args.activity.start).toHaveBeenCalledTimes(2);
  });
});

describe("onCreateDevServer", () => {
  it("does nothing when pollInterval is 0", () => {
    const args = makeArgs();
    onCreateDevServer!(
      args as never,
      { ...baseOptions, name: "dev-off", pollInterval: 0 } as never,
      undefined as never,
    );
    expect(args.reporter.info).not.toHaveBeenCalled();
  });

  it("logs a polling-started message when pollInterval is positive", async () => {
    vi.mocked(mockRequest).mockResolvedValue(ok({ sha: "d".repeat(40) }) as never);

    const args = makeArgs();
    onCreateDevServer!(
      args as never,
      { ...baseOptions, name: "dev-on", pollInterval: 60 } as never,
      undefined as never,
    );

    expect(args.reporter.info.mock.calls[0]![0]).toMatch(/polling .* every 60s/);
  });
});
