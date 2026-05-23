import path from "node:path";

import { minimatch } from "minimatch";

import type { GitHubClient } from "./client.js";
import type { CacheLike } from "./cache.js";
import { emitFileNode, type FileNode } from "./nodes.js";
import type { PluginOptions } from "./options.js";

export interface SourceState {
  lastIds: Set<string>;
  lastCommitSha: string | null;
}

export interface GatsbyHelpers {
  actions: {
    createNode: (node: FileNode) => void;
    deleteNode: (node: FileNode) => void;
  };
  cache: CacheLike & { directory: string };
  createNodeId: (input: string) => string;
  getNode: (id: string) => FileNode | undefined;
}

export interface SourceResult {
  commitSha: string;
  matched: number;
  fetched: number;
  cached: number;
}

export async function runSource(
  gatsby: GatsbyHelpers,
  options: Pick<PluginOptions, "ref" | "patterns" | "name" | "concurrency">,
  state: SourceState,
  client: GitHubClient,
): Promise<SourceResult> {
  const { actions, cache, createNodeId, getNode } = gatsby;
  const { ref, patterns, name, concurrency = 8 } = options;

  const { commitSha } = await client.resolveRef(ref);
  const { entries } = await client.getTree(commitSha);
  const matched = entries.filter((entry) => matchesAny(entry.path, patterns));

  const workingDirectory = path.join(cache.directory, "files");
  const seenIds = new Set<string>();
  let fetched = 0;
  let cached = 0;

  await pool(matched, concurrency, async (entry) => {
    const { buffer, fromCache } = await client.getBlob(entry.sha);
    if (fromCache) cached += 1;
    else fetched += 1;

    const node = await emitFileNode({
      workingDirectory,
      name,
      entry,
      buffer,
      createNodeId,
      actions,
    });
    seenIds.add(node.id);
  });

  for (const id of state.lastIds) {
    if (!seenIds.has(id)) {
      const node = getNode(id);
      if (node) actions.deleteNode(node);
    }
  }

  state.lastIds = seenIds;
  state.lastCommitSha = commitSha;

  return { commitSha, matched: matched.length, fetched, cached };
}

export function createState(): SourceState {
  return { lastIds: new Set<string>(), lastCommitSha: null };
}

function matchesAny(filepath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (minimatch(filepath, pattern)) return true;
  }
  return false;
}

async function pool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  const next = async (): Promise<void> => {
    while (cursor < items.length) {
      const idx = cursor++;
      await worker(items[idx]!);
    }
  };
  await Promise.all(Array.from({ length: workerCount }, next));
}
