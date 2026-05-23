import Joi from "joi";
import { describe, expect, it } from "vitest";

import { pluginOptionsSchema } from "../src/lib/options.js";

const schema = pluginOptionsSchema({ Joi });

function validate(input: unknown): { error?: unknown; value: any } {
  return schema.validate(input, { convert: true });
}

describe("pluginOptionsSchema", () => {
  it("accepts a minimal valid config and applies defaults", () => {
    const { error, value } = validate({
      owner: "alexwilson",
      repo: "content",
      token: "ghs_x",
    });
    expect(error).toBeUndefined();
    expect(value.name).toBe("github");
    expect(value.ref).toBe("main");
    expect(value.patterns).toEqual(["**"]);
    expect(value.pollInterval).toBe(0);
    expect(value.concurrency).toBe(8);
  });

  it("rejects missing owner/repo/token", () => {
    expect(validate({}).error).toBeDefined();
    expect(validate({ owner: "o" }).error).toBeDefined();
    expect(validate({ owner: "o", repo: "r" }).error).toBeDefined();
  });

  it("accepts a function for token", () => {
    const { error } = validate({
      owner: "o",
      repo: "r",
      token: async () => "x",
    });
    expect(error).toBeUndefined();
  });

  it("rejects a non-string, non-function token", () => {
    expect(validate({ owner: "o", repo: "r", token: 123 }).error).toBeDefined();
  });

  it("accepts a positive integer pollInterval", () => {
    const { error, value } = validate({
      owner: "o",
      repo: "r",
      token: "x",
      pollInterval: 30,
    });
    expect(error).toBeUndefined();
    expect(value.pollInterval).toBe(30);
  });

  it("rejects negative / non-integer pollInterval", () => {
    expect(
      validate({ owner: "o", repo: "r", token: "x", pollInterval: -1 }).error,
    ).toBeDefined();
    expect(
      validate({ owner: "o", repo: "r", token: "x", pollInterval: 1.5 }).error,
    ).toBeDefined();
  });

  it("accepts concurrency in [1, 50]", () => {
    expect(
      validate({ owner: "o", repo: "r", token: "x", concurrency: 1 }).error,
    ).toBeUndefined();
    expect(
      validate({ owner: "o", repo: "r", token: "x", concurrency: 50 }).error,
    ).toBeUndefined();
  });

  it("rejects concurrency out of range or non-integer", () => {
    expect(
      validate({ owner: "o", repo: "r", token: "x", concurrency: 0 }).error,
    ).toBeDefined();
    expect(
      validate({ owner: "o", repo: "r", token: "x", concurrency: 51 }).error,
    ).toBeDefined();
    expect(
      validate({ owner: "o", repo: "r", token: "x", concurrency: 2.5 }).error,
    ).toBeDefined();
  });
});
