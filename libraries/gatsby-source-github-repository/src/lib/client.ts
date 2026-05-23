import { request as defaultRequest } from "@octokit/request";

import { blobKey, refKey, treeKey, type CacheLike } from "./cache.js";

const MAX_RETRIES = 2;
const MAX_RETRY_SLEEP_MS = 60_000;

export interface RateLimitSnapshot {
  limit: number;
  remaining: number;
  reset: number | null;
}

export interface TreeEntry {
  path: string;
  sha: string;
  size: number;
  mode: string;
}

export interface RefResolution {
  commitSha: string;
  fromCache: boolean;
}

export interface TreeResult {
  entries: TreeEntry[];
  truncated: false;
  fromCache: boolean;
}

export interface BlobResult {
  buffer: Buffer;
  fromCache: boolean;
}

export interface GitHubClient {
  resolveRef(ref: string): Promise<RefResolution>;
  getTree(commitSha: string): Promise<TreeResult>;
  getBlob(sha: string): Promise<BlobResult>;
  rateLimit: { snapshot: RateLimitSnapshot | null };
}

interface ApiResponse {
  status: number;
  headers: Record<string, string | undefined>;
  data: any;
  url?: string;
}
type RequestFn = (route: string, params: Record<string, unknown>) => Promise<ApiResponse>;
type SleepFn = (ms: number) => Promise<void>;

export interface ClientOptions {
  getToken: () => Promise<string>;
  cache: CacheLike;
  owner: string;
  repo: string;
  userAgent: string;
  request?: RequestFn;
  sleep?: SleepFn;
}

interface CachedRef {
  etag: string | null;
  commitSha: string;
}

interface CachedTree {
  entries: TreeEntry[];
}

interface ApiError {
  status?: number;
  response?: { headers?: Record<string, string | undefined> };
}

export function createClient({
  getToken,
  cache,
  owner,
  repo,
  userAgent,
  request = defaultRequest as unknown as RequestFn,
  sleep = defaultSleep,
}: ClientOptions): GitHubClient {
  const rateLimit: { snapshot: RateLimitSnapshot | null } = { snapshot: null };

  const authedRequest = async (
    route: string,
    params: Record<string, unknown> & { headers?: Record<string, string> } = {},
  ): Promise<ApiResponse> => {
    const token = await getToken();
    const { headers: callerHeaders, ...rest } = params;
    const finalParams = {
      owner,
      repo,
      ...rest,
      headers: {
        // Fine-grained PATs (`github_pat_*`) reject the legacy `token` prefix.
        authorization: `Bearer ${token}`,
        "user-agent": userAgent,
        accept: "application/vnd.github+json",
        ...(callerHeaders ?? {}),
      },
    };

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = await request(route, finalParams as Record<string, unknown>);
        captureRateLimit(rateLimit, res.headers);
        return res;
      } catch (err) {
        const apiErr = err as ApiError;
        captureRateLimit(rateLimit, apiErr.response?.headers);

        const wait = retryDelayMs(apiErr);
        if (wait !== null && attempt < MAX_RETRIES) {
          await sleep(Math.min(wait, MAX_RETRY_SLEEP_MS));
          attempt += 1;
          continue;
        }
        throw err;
      }
    }
  };

  async function resolveRef(ref: string): Promise<RefResolution> {
    if (isCommitSha(ref)) {
      return { commitSha: ref, fromCache: false };
    }

    const cacheKey = refKey(owner, repo, ref);
    const cached = await cache.get<CachedRef>(cacheKey);

    const conditionalHeaders: Record<string, string> = cached?.etag
      ? { "if-none-match": cached.etag }
      : {};

    try {
      const res = await authedRequest("GET /repos/{owner}/{repo}/commits/{ref}", {
        ref,
        headers: conditionalHeaders,
      });

      const commitSha = res.data.sha as string;
      const etag = res.headers?.etag ?? null;
      await cache.set(cacheKey, { etag, commitSha });
      return { commitSha, fromCache: false };
    } catch (err) {
      // Duck-type, not instanceof: pnpm can resolve multiple copies of @octokit/request-error.
      const apiErr = err as ApiError;
      if (apiErr.status === 304 && cached?.commitSha) {
        return { commitSha: cached.commitSha, fromCache: true };
      }
      throw err;
    }
  }

  async function getTree(commitSha: string): Promise<TreeResult> {
    const cacheKey = treeKey(owner, repo, commitSha);
    const cached = await cache.get<CachedTree>(cacheKey);
    if (cached) return { entries: cached.entries, truncated: false, fromCache: true };

    const res = await authedRequest(
      "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
      { tree_sha: commitSha, recursive: "1" },
    );

    if (res.data.truncated) {
      throw new Error(
        `[gatsby-source-github-repository] tree for ${owner}/${repo}@${commitSha} is truncated; ` +
          `the recursive tree endpoint only returns up to 100,000 entries / 7MB. ` +
          `Narrow the source via patterns, or fetch sub-trees per directory.`,
      );
    }

    const entries: TreeEntry[] = (res.data.tree as Array<{ path: string; type: string; sha: string; size: number; mode: string }>)
      .filter((e) => e.type === "blob")
      .map((e) => ({ path: e.path, sha: e.sha, size: e.size, mode: e.mode }));

    await cache.set(cacheKey, { entries });
    return { entries, truncated: false, fromCache: false };
  }

  async function getBlob(sha: string): Promise<BlobResult> {
    const cacheKey = blobKey(sha);
    const cached = await cache.get<string>(cacheKey);
    if (cached) {
      return { buffer: Buffer.from(cached, "base64"), fromCache: true };
    }

    const res = await authedRequest(
      "GET /repos/{owner}/{repo}/git/blobs/{file_sha}",
      { file_sha: sha },
    );

    if (res.data.encoding !== "base64") {
      throw new Error(
        `[gatsby-source-github-repository] unexpected blob encoding ${res.data.encoding} for ${sha}`,
      );
    }

    await cache.set(cacheKey, res.data.content);
    return {
      buffer: Buffer.from(res.data.content as string, "base64"),
      fromCache: false,
    };
  }

  return { resolveRef, getTree, getBlob, rateLimit };
}

function isCommitSha(value: string): boolean {
  return /^[0-9a-f]{40}$/i.test(value);
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function captureRateLimit(
  target: { snapshot: RateLimitSnapshot | null },
  headers: Record<string, string | undefined> | undefined,
): void {
  if (!headers) return;
  const limit = Number(headers["x-ratelimit-limit"]);
  const remaining = Number(headers["x-ratelimit-remaining"]);
  const reset = Number(headers["x-ratelimit-reset"]);
  if (!Number.isFinite(limit) || !Number.isFinite(remaining)) return;
  target.snapshot = {
    limit,
    remaining,
    reset: Number.isFinite(reset) ? reset : null,
  };
}

function retryDelayMs(err: ApiError): number | null {
  const status = err.status;
  const headers = err.response?.headers;
  if (!headers) return null;

  const retryAfter = headers["retry-after"];

  if (status === 429) {
    return parseRetryAfter(retryAfter) ?? 1_000;
  }

  if (status === 403) {
    if (retryAfter) return parseRetryAfter(retryAfter);
    const remaining = Number(headers["x-ratelimit-remaining"]);
    const reset = Number(headers["x-ratelimit-reset"]);
    if (remaining === 0 && Number.isFinite(reset)) {
      const ms = reset * 1000 - Date.now();
      return Math.max(0, ms);
    }
  }

  return null;
}

export function parseRetryAfter(value: string | undefined): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const epochMs = Date.parse(value);
  if (Number.isFinite(epochMs)) return Math.max(0, epochMs - Date.now());
  return null;
}
