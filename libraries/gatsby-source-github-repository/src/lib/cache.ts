export interface CacheLike {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
}

export const refKey = (owner: string, repo: string, ref: string): string =>
  `ref:${owner}/${repo}:${ref}`;
export const treeKey = (owner: string, repo: string, commitSha: string): string =>
  `tree:${owner}/${repo}:${commitSha}`;
export const blobKey = (sha: string): string => `blob:${sha}`;
