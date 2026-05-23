import type { RateLimitSnapshot } from "./client.js";

const LOW_BUDGET_FRACTION = 0.1;

export interface ReporterLike {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
}

export function formatRateLimit(
  snapshot: RateLimitSnapshot | null,
  now: number = Date.now(),
): string {
  if (!snapshot) return "rate limit: unknown";
  const { limit, remaining, reset } = snapshot;
  const minutesUntilReset = reset
    ? Math.max(0, Math.round((reset * 1000 - now) / 60_000))
    : null;
  const resetPart = minutesUntilReset !== null ? `, resets in ${minutesUntilReset}m` : "";
  return `rate limit: ${remaining}/${limit}${resetPart}`;
}

export interface LowBudgetState {
  warned: boolean;
}

export function maybeWarnLowBudget(
  reporter: ReporterLike,
  state: LowBudgetState,
  snapshot: RateLimitSnapshot | null,
  label: string,
): void {
  if (!snapshot) return;
  const low = snapshot.remaining / snapshot.limit < LOW_BUDGET_FRACTION;
  if (low && !state.warned) {
    reporter.warn(
      `[gatsby-source-github-repository] ${label}: ${formatRateLimit(snapshot)} — approaching GitHub API rate limit`,
    );
    state.warned = true;
  } else if (!low && state.warned) {
    state.warned = false;
  }
}
