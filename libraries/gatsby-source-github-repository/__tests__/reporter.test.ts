import { describe, expect, it, vi } from "vitest";

import { formatRateLimit, maybeWarnLowBudget } from "../src/lib/reporter.js";

function makeReporter() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe("formatRateLimit", () => {
  it("returns 'unknown' when snapshot is null", () => {
    expect(formatRateLimit(null)).toBe("rate limit: unknown");
  });

  it("renders limit, remaining, and minutes-until-reset", () => {
    const now = 1_000_000_000_000;
    const reset = Math.floor(now / 1000) + 600; // 10 minutes from now
    expect(
      formatRateLimit({ limit: 5000, remaining: 4900, reset }, now),
    ).toBe("rate limit: 4900/5000, resets in 10m");
  });

  it("omits reset segment when reset is null", () => {
    expect(
      formatRateLimit({ limit: 5000, remaining: 4900, reset: null }),
    ).toBe("rate limit: 4900/5000");
  });

  it("clamps negative minutes-until-reset to 0", () => {
    const now = 1_000_000_000_000;
    const reset = Math.floor(now / 1000) - 60; // 1 minute in the past
    expect(
      formatRateLimit({ limit: 5000, remaining: 4900, reset }, now),
    ).toMatch(/resets in 0m/);
  });
});

describe("maybeWarnLowBudget", () => {
  it("does nothing when snapshot is null", () => {
    const reporter = makeReporter();
    maybeWarnLowBudget(reporter, { warned: false }, null, "o/r");
    expect(reporter.warn).not.toHaveBeenCalled();
  });

  it("warns once when remaining drops below 10% of limit", () => {
    const reporter = makeReporter();
    const state = { warned: false };
    maybeWarnLowBudget(
      reporter,
      state,
      { limit: 5000, remaining: 400, reset: null },
      "o/r",
    );
    expect(reporter.warn).toHaveBeenCalledTimes(1);
    expect(reporter.warn.mock.calls[0]![0]).toMatch(/approaching/i);
    expect(state.warned).toBe(true);
  });

  it("does not warn again on subsequent low-budget snapshots", () => {
    const reporter = makeReporter();
    const state = { warned: true };
    maybeWarnLowBudget(
      reporter,
      state,
      { limit: 5000, remaining: 400, reset: null },
      "o/r",
    );
    expect(reporter.warn).not.toHaveBeenCalled();
  });

  it("re-arms once remaining climbs back above the threshold", () => {
    const reporter = makeReporter();
    const state = { warned: true };
    maybeWarnLowBudget(
      reporter,
      state,
      { limit: 5000, remaining: 4500, reset: null },
      "o/r",
    );
    expect(state.warned).toBe(false);
    expect(reporter.warn).not.toHaveBeenCalled();

    maybeWarnLowBudget(
      reporter,
      state,
      { limit: 5000, remaining: 400, reset: null },
      "o/r",
    );
    expect(reporter.warn).toHaveBeenCalledTimes(1);
    expect(state.warned).toBe(true);
  });

  it("uses the label in the warning message", () => {
    const reporter = makeReporter();
    maybeWarnLowBudget(
      reporter,
      { warned: false },
      { limit: 5000, remaining: 100, reset: null },
      "alexwilson/content",
    );
    expect(reporter.warn.mock.calls[0]![0]).toContain("alexwilson/content");
  });
});
