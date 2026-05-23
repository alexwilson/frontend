# gatsby-source-github-repository

Source Gatsby `File` nodes from a GitHub repository via the GitHub API, without cloning. Uses content-addressed caching to keep API usage near zero across builds.

## Why

The standard options for sourcing content from a GitHub repo at build time are:

- `gatsby-source-filesystem` against a working tree (you must clone separately).
- `gatsby-source-git`, which clones at build time.

This plugin fetches files directly via the GitHub REST API. Compared to cloning, that means:

- **Content-addressed caching.** Blob SHAs are immutable, so once a file is in the cache it never needs to be re-fetched.
- **ETag-based ref short-circuit.** When the source branch hasn't moved, the conditional request returns `304 Not Modified` and doesn't count against your rate limit.

Steady-state incremental builds use 1–2 API calls regardless of how many files are in the repo.

## Install

```sh
pnpm add gatsby-source-github-repository
```

Peer-depends on `gatsby >= 5`.

## Usage

```ts
{
  resolve: `gatsby-source-github-repository`,
  options: {
    name: `posts`,
    owner: `alexwilson`,
    repo: `content`,
    ref: `main`,
    patterns: [`posts/**`],
    token: process.env.GITHUB_TOKEN,
  },
}
```

Downstream transformers (`gatsby-transformer-remark`, `gatsby-transformer-sharp`, etc.) work without modification: the plugin materialises blobs into Gatsby's cache directory and emits `File` nodes pointing at them.

## Options

| Option       | Type                                | Default      | Notes                                                                 |
| ------------ | ----------------------------------- | ------------ | --------------------------------------------------------------------- |
| `name`       | string                              | `"github"`   | `sourceInstanceName` on emitted File nodes.                           |
| `owner`      | string                              | —            | Required. Repository owner.                                           |
| `repo`       | string                              | —            | Required. Repository name.                                            |
| `ref`        | string                              | `"main"`     | Branch, tag, or 40-character commit SHA.                              |
| `patterns`   | string[]                            | `["**"]`     | Minimatch patterns. A blob is sourced if it matches at least one.     |
| `token`      | string \| `() => Promise<string>`   | —            | Required. See below.                                                  |
| `userAgent`  | string                              | plugin name  | Sent as `User-Agent`.                                                 |
| `pollInterval` | number (seconds)                  | `0`          | Background poll cadence during `gatsby develop`. `0` disables. See below. |
| `concurrency` | number (1–50)                      | `8`          | Maximum in-flight blob fetches during sourcing. Higher = faster cold builds. |

### `token`

Either a string or an async callback that resolves to one.

- **String.** A bearer token sent as `Authorization: token <value>`. Works with PATs, OAuth tokens, and pre-minted GitHub App installation tokens.
- **Callback.** `() => string | Promise<string>`. Called per request, so it owns minting and renewal. Use this when the token expires within the build window — most often, GitHub App installation tokens (1h TTL) and broker-issued tokens.

#### GitHub App installation tokens

```ts
import { createAppAuth } from "@octokit/auth-app";

const appAuth = createAppAuth({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
  installationId: process.env.GITHUB_APP_INSTALLATION_ID,
});

// ...inside gatsby-config.ts plugins:
{
  resolve: `gatsby-source-github-repository`,
  options: {
    // ...
    token: async () => (await appAuth({ type: "installation" })).token,
  },
}
```

`@octokit/auth-app` caches and refreshes the token internally.

## Live updates during development

By default, `gatsby develop` sources content once at startup. To pick up upstream changes without restarting, set `pollInterval` (seconds) and the plugin will check the ref in the background:

```ts
{
  // ...
  pollInterval: process.env.NODE_ENV === "development" ? 30 : 0,
}
```

Each poll is a conditional `GET` on the ref. Unchanged refs return `304 Not Modified` and don't count against your rate limit, so a 30-second poll is essentially free. When the ref moves, the plugin fetches only blobs whose SHAs changed, re-emits their `File` nodes, and deletes nodes for paths that have disappeared.

Polling only runs under `gatsby develop` (via `onCreateDevServer`). `gatsby build` ignores `pollInterval`.

If you'd rather trigger refreshes manually instead of polling, leave `pollInterval` at `0` and use Gatsby's built-in refresh endpoint: start develop with `ENABLE_GATSBY_REFRESH_ENDPOINT=true` and `POST` to `http://localhost:8000/__refresh` whenever you want to re-source. Webhook-driven refreshes work the same way.

## Rate limits

The plugin captures GitHub's `x-ratelimit-*` headers from every response and surfaces them in the reporter:

```
source alexwilson/content@main (posts) → abc1234 (223 files, 220 cached, 3 fetched; rate limit: 4823/5000, resets in 38m)
```

When less than 10% of the budget remains, you'll see a `warn` line so you can react before the build fails:

```
[gatsby-source-github-repository] alexwilson/content: rate limit: 412/5000, resets in 14m — approaching GitHub API rate limit
```

The plugin also retries on rate-limit responses (`429 Too Many Requests` and `403 Forbidden` with a `retry-after` header or `x-ratelimit-remaining: 0`). Retries are bounded — at most 2 — and honour `retry-after` up to 60 seconds; beyond that the error propagates to Gatsby.

## Caching

Two cache namespaces in Gatsby's persistent cache:

- `ref:{owner}/{repo}:{ref}` → `{ etag, commitSha }`. Backs the conditional GET on the ref.
- `tree:{owner}/{repo}:{commitSha}` → tree entries. Trees are immutable per commit SHA.
- `blob:{sha}` → base64 blob content. Immutable.

## Limits

- The recursive tree endpoint returns at most 100,000 entries / 7MB. If your source exceeds this, narrow with `patterns` (the plugin still walks the whole tree) — a future change could fetch sub-trees per directory.
- Blob fetches are sequential. For very large first-time builds, parallelising is straightforward but not yet implemented.
