// Allowlist: paths not listed return null (404). Stops the server-side GitHub
// credential being pointed at arbitrary repo files.
const FEED_ID = /^[a-z0-9][a-z0-9-]*$/

export function resolveRepoPath(pathname: string): string | null {
  const apiMatch = pathname.replace(/\/+$/, "").match(/\/reader\/api\/(.+)$/)
  if (!apiMatch) return null
  const rest = apiMatch[1]

  if (rest === "river") return "data/river.json"
  if (rest === "index") return "data/index.json"

  const feed = rest.match(/^feeds\/([^/]+)$/)
  if (feed && FEED_ID.test(feed[1])) return `data/feeds/${feed[1]}.json`

  return null
}
