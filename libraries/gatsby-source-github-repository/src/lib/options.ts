import type Joi from "joi";

export type TokenSource = string | (() => string | Promise<string>);

export interface PluginOptions {
  name: string;
  owner: string;
  repo: string;
  ref: string;
  patterns: string[];
  token: TokenSource;
  userAgent: string;
  pollInterval: number;
  concurrency: number;
}

interface JoiArg {
  Joi: typeof Joi;
}

export const pluginOptionsSchema = ({ Joi }: JoiArg): Joi.Schema =>
  Joi.object({
    name: Joi.string()
      .description("sourceInstanceName applied to emitted File nodes.")
      .default("github"),
    owner: Joi.string().required().description("GitHub repository owner."),
    repo: Joi.string().required().description("GitHub repository name."),
    ref: Joi.string()
      .default("main")
      .description("Branch name, tag name, or commit SHA to source from."),
    patterns: Joi.array()
      .items(Joi.string())
      .default(["**"])
      .description("Minimatch patterns. Only blobs matching at least one are sourced."),
    token: Joi.alternatives(Joi.string(), Joi.function())
      .required()
      .description(
        "Bearer token for the GitHub API. Either a string (PAT, OAuth, or pre-minted installation token) or a `() => Promise<string>` callback for tokens that need to be minted or refreshed per request.",
      ),
    userAgent: Joi.string().default("gatsby-source-github-repository"),
    pollInterval: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .description(
        "Seconds between background polls during `gatsby develop`. 0 disables polling. Each poll is a conditional GET on the ref; unchanged refs return 304 and don't count against rate limits. Has no effect in `gatsby build`.",
      ),
    concurrency: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(8)
      .description(
        "Maximum number of in-flight blob fetches during sourcing. Higher values speed up cold builds at the cost of more parallel load on the GitHub API. Cached blobs don't count.",
      ),
  });
