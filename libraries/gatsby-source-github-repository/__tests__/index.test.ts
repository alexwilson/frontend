import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadNodeContent } from "../src/index.js";

let tmpdir: string;

beforeEach(async () => {
  tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), "gs-ghr-index-"));
});

afterEach(async () => {
  await fs.rm(tmpdir, { recursive: true, force: true });
});

describe("loadNodeContent", () => {
  it("reads the file at the node's absolutePath as utf-8", async () => {
    const filePath = path.join(tmpdir, "hello.md");
    await fs.writeFile(filePath, "hello world", "utf-8");

    const content = await loadNodeContent({ absolutePath: filePath });
    expect(content).toBe("hello world");
  });
});
