import type { GatsbyNode } from "gatsby";

import { createClient, type GitHubClient } from "./lib/client.js";
import { pluginOptionsSchema as schema, type PluginOptions, type TokenSource } from "./lib/options.js";
import { pollOnce, withOverlapGuard } from "./lib/poller.js";
import { formatRateLimit, maybeWarnLowBudget, type LowBudgetState } from "./lib/reporter.js";
import { createState, runSource, type SourceState } from "./lib/source.js";

export const pluginOptionsSchema: GatsbyNode["pluginOptionsSchema"] = schema as never;

interface Instance {
  state: SourceState;
  client: GitHubClient;
  budget: LowBudgetState;
  interval: ReturnType<typeof setInterval> | null;
}

// Module-scoped so onCreateDevServer can re-enter (config reload) without losing the interval.
const instances = new Map<string, Instance>();

function instanceKey(opts: PluginOptions): string {
  return `${opts.owner}/${opts.repo}@${opts.ref}#${opts.name}`;
}

function tokenGetter(token: TokenSource): () => Promise<string> {
  if (typeof token === "string") {
    const trimmed = token.trim();
    return async () => trimmed;
  }
  return async () => {
    const resolved = await token();
    return typeof resolved === "string" ? resolved.trim() : "";
  };
}

function getInstance(cache: { directory: string } & Parameters<typeof createClient>[0]["cache"], options: PluginOptions): Instance {
  const key = instanceKey(options);
  let inst = instances.get(key);
  if (!inst) {
    const client = createClient({
      getToken: tokenGetter(options.token),
      cache,
      owner: options.owner,
      repo: options.repo,
      userAgent: options.userAgent,
    });
    inst = {
      state: createState(),
      client,
      budget: { warned: false },
      interval: null,
    };
    instances.set(key, inst);
  }
  return inst;
}

export const sourceNodes: GatsbyNode["sourceNodes"] = async (args, pluginOptions) => {
  const options = pluginOptions as unknown as PluginOptions;
  const { reporter, cache } = args;
  const { owner, repo, ref, name } = options;
  const inst = getInstance(cache as never, options);

  const activity = reporter.activityTimer(
    `source ${owner}/${repo}@${ref} (${name})`,
  );
  activity.start();

  try {
    const result = await runSource(args as never, options, inst.state, inst.client);
    const rateLimit = formatRateLimit(inst.client.rateLimit.snapshot);
    activity.setStatus(
      `${owner}/${repo}@${ref} → ${result.commitSha.slice(0, 7)} ` +
        `(${result.matched} files, ${result.cached} cached, ${result.fetched} fetched; ${rateLimit})`,
    );
    maybeWarnLowBudget(reporter, inst.budget, inst.client.rateLimit.snapshot, `${owner}/${repo}`);
  } finally {
    activity.end();
  }
};

export const onCreateDevServer: GatsbyNode["onCreateDevServer"] = (args, pluginOptions) => {
  const options = pluginOptions as unknown as PluginOptions;
  const interval = options.pollInterval ?? 0;
  if (interval <= 0) return;

  const { reporter, cache } = args;
  const { owner, repo, ref } = options;
  const inst = getInstance(cache as never, options);

  if (inst.interval) clearInterval(inst.interval);

  const tick = withOverlapGuard(() =>
    pollOnce({
      gatsby: args as never,
      reporter,
      options,
      state: inst.state,
      client: inst.client,
      budget: inst.budget,
    }),
  );

  inst.interval = setInterval(tick, interval * 1000);
  inst.interval.unref?.(); // poll must not keep the process alive

  reporter.info(
    `[gatsby-source-github-repository] polling ${owner}/${repo}@${ref} every ${interval}s`,
  );
};
