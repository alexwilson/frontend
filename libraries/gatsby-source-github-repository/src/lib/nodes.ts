import fs from "node:fs/promises";
import path from "node:path";

// @ts-expect-error — gatsby-source-filesystem ships JS without types for this helper
import { createFileNode } from "gatsby-source-filesystem/create-file-node.js";

import type { TreeEntry } from "./client.js";

export interface FileNode {
  id: string;
  internal: { contentDigest: string; type: string; mediaType?: string };
  absolutePath: string;
  relativePath: string;
  [key: string]: unknown;
}

export interface EmitFileNodeArgs {
  workingDirectory: string;
  name: string;
  entry: TreeEntry;
  buffer: Buffer;
  createNodeId: (input: string) => string;
  actions: { createNode: (node: FileNode) => void };
}

export async function emitFileNode({
  workingDirectory,
  name,
  entry,
  buffer,
  createNodeId,
  actions,
}: EmitFileNodeArgs): Promise<FileNode> {
  const absolutePath = path.join(workingDirectory, name, entry.path);
  await writeIfChanged(absolutePath, buffer);

  // fastHash skips the md5 inside createFileNode; the blob SHA replaces it.
  const fileNode = (await createFileNode(absolutePath, createNodeId, {
    name,
    path: path.join(workingDirectory, name),
    fastHash: true,
  })) as FileNode;
  fileNode.internal.contentDigest = entry.sha;

  actions.createNode(fileNode);
  return fileNode;
}

async function writeIfChanged(absolutePath: string, buffer: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  try {
    const existing = await fs.readFile(absolutePath);
    if (existing.equals(buffer)) return;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  await fs.writeFile(absolutePath, buffer);
}
