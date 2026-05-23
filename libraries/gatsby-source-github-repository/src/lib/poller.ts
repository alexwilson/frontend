import type { GitHubClient } from "./client.js";
import { formatRateLimit, maybeWarnLowBudget, type LowBudgetState, type ReporterLike } from "./reporter.js";
import { runSource, type GatsbyHelpers, type SourceState } from "./source.js";
import type { PluginOptions } from "./options.js";

export interface PollContext {
  gatsby: GatsbyHelpers;
  reporter: ReporterLike;
  options: PluginOptions;
  state: SourceState;
  client: GitHubClient;
  budget: LowBudgetState;
}

/**
 * One poll tick: re-source, log on SHA change, surface errors loudly.
 * Returns true if the ref moved, false otherwise.
 *
 * Exposed for unit testing; the production scheduler invokes this on an interval.
 */
export async function pollOnce(ctx: PollContext): Promise<boolean> {
  const { gatsby, reporter, options, state, client, budget } = ctx;
  const { owner, repo, ref } = options;
  const previousSha = state.lastCommitSha;
  try {
    const result = await runSource(gatsby, options, state, client);
    if (result.commitSha !== previousSha) {
      reporter.info(
        `[gatsby-source-github-repository] ${owner}/${repo}@${ref}: ` +
          `${previousSha?.slice(0, 7) ?? "—"} → ${result.commitSha.slice(0, 7)} ` +
          `(${result.fetched} fetched; ${formatRateLimit(client.rateLimit.snapshot)})`,
      );
    }
    maybeWarnLowBudget(reporter, budget, client.rateLimit.snapshot, `${owner}/${repo}`);
    return result.commitSha !== previousSha;
  } catch (err) {
    // reporter.error renders red without exiting; the next poll retries.
    reporter.error(
      `[gatsby-source-github-repository] poll failed for ${owner}/${repo}@${ref}: ${(err as Error).message}`,
    );
    return false;
  }
}

/**
 * Wrap an async function so concurrent calls collapse: while one invocation is
 * in flight, additional calls return immediately without running. Errors are
 * swallowed so a setInterval driver doesn't generate unhandled rejections —
 * callers should handle errors inside `fn` (e.g. via reporter.error).
 */
export function withOverlapGuard<Args extends unknown[]>(
  fn: (...args: Args) => Promise<unknown>,
): (...args: Args) => Promise<void> {
  let inFlight = false;
  return async (...args: Args) => {
    if (inFlight) return;
    inFlight = true;
    try {
      await fn(...args);
    } catch {
      // intentionally swallowed; see docstring
    } finally {
      inFlight = false;
    }
  };
}
