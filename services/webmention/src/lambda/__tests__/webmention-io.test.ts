import { beforeEach, describe, expect, it, vi } from "vitest";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: class {},
}));

vi.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: () => ({ send: sendMock }),
  },
  PutCommand: class PutCommand {
    constructor(public input: unknown) {}
  },
}));

const TABLE = "webmentions-test-table";
const TOKEN = "shared-secret-abc";

process.env.DYNAMODB_TABLE = TABLE;
process.env.WEBMENTION_IO_WEBHOOK_TOKEN = TOKEN;

const { handler } = await import("../webmention-io");

const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const ARTICLE_UUID = "2316421a-4edc-43cd-b983-70e1c9553bf4";

type WmProperty =
  | "in-reply-to"
  | "like-of"
  | "repost-of"
  | "bookmark-of"
  | "mention-of"
  | "rsvp";

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    type: "entry",
    author: {
      name: "Amy Guy",
      photo: "https://webmention.io/avatar/rhiaro.co.uk/abc.png",
      url: "https://rhiaro.co.uk/about#me",
    },
    url: "https://rhiaro.co.uk/2015/11/1446953889",
    published: "2015-11-08T03:38:09+00:00",
    "wm-id": 12345,
    "wm-property": "repost-of" as WmProperty,
    "wm-source": "https://rhiaro.co.uk/2015/11/1446953889",
    "wm-target": `https://alexwilson.tech/content/${ARTICLE_UUID}`,
    ...overrides,
  };
}

function makeEvent(body: unknown): APIGatewayProxyEvent {
  return {
    body: typeof body === "string" ? body : JSON.stringify(body),
  } as APIGatewayProxyEvent;
}

const context = {} as Context;

async function call(body: unknown) {
  return (await handler(makeEvent(body), context, () => {})) as {
    statusCode: number;
    body: string;
  };
}

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({});
});

describe("webmention-io handler — auth", () => {
  it("returns 401 when secret does not match the configured token", async () => {
    const res = await call({
      secret: "wrong",
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
      post: makePost(),
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body)).toEqual({ message: "Unauthorized" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("accepts a request whose secret matches the configured token", async () => {
    const res = await call({
      secret: TOKEN,
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
      post: makePost(),
    });

    expect(res.statusCode).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
  });
});

describe("webmention-io handler — DynamoDB persistence", () => {
  it("persists into the configured table with the expected key shape", async () => {
    const post = makePost({ "wm-id": 98765 });
    await call({
      secret: TOKEN,
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
      post,
    });

    expect(sendMock).toHaveBeenCalledOnce();
    const params = sendMock.mock.calls[0][0].input;
    expect(params.TableName).toBe(TABLE);
    expect(params.Item.contentId).toBe(ARTICLE_UUID);
    expect(params.Item.webmentionId).toBe("98765");
    expect(typeof params.Item.webmentionId).toBe("string");
    expect(params.Item.webmentionData).toEqual(post);
  });

  it("round-trips the full post object into webmentionData", async () => {
    const post = makePost({
      content: { text: "hi", html: "<p>hi</p>" },
      category: ["indieweb", "test"],
      extra: { nested: { value: 1 } },
    });
    await call({
      secret: TOKEN,
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
      post,
    });

    const params = sendMock.mock.calls[0][0].input;
    expect(params.Item.webmentionData).toEqual(post);
  });

  it("stringifies a numeric wm-id (so re-deliveries collide on the sort key)", async () => {
    await call({
      secret: TOKEN,
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
      post: makePost({ "wm-id": 1 }),
    });
    await call({
      secret: TOKEN,
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
      post: makePost({ "wm-id": "1" }),
    });

    const [first, second] = sendMock.mock.calls.map((c) => c[0].input);
    expect(first.Item.webmentionId).toBe("1");
    expect(second.Item.webmentionId).toBe("1");
  });

  it("returns the success body on the happy path", async () => {
    const res = await call({
      secret: TOKEN,
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
      post: makePost(),
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      message: "Webmention processed successfully",
    });
  });
});

describe("webmention-io handler — contentId extraction", () => {
  it("extracts the UUID from a /content/{uuid} target", async () => {
    await call({
      secret: TOKEN,
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
      post: makePost(),
    });
    expect(sendMock.mock.calls[0][0].input.Item.contentId).toBe(ARTICLE_UUID);
  });

  it("tolerates a query string after the UUID", async () => {
    await call({
      secret: TOKEN,
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}?utm=foo`,
      post: makePost(),
    });
    expect(sendMock.mock.calls[0][0].input.Item.contentId).toBe(ARTICLE_UUID);
  });

  it("tolerates a fragment after the UUID", async () => {
    await call({
      secret: TOKEN,
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}#section`,
      post: makePost(),
    });
    expect(sendMock.mock.calls[0][0].input.Item.contentId).toBe(ARTICLE_UUID);
  });

  it("tolerates a trailing slash", async () => {
    await call({
      secret: TOKEN,
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}/`,
      post: makePost(),
    });
    expect(sendMock.mock.calls[0][0].input.Item.contentId).toBe(ARTICLE_UUID);
  });

  it("falls back to the nil UUID when the URL does not match /content/{uuid}", async () => {
    await call({
      secret: TOKEN,
      target: "https://alexwilson.tech/blog/some-other-path",
      post: makePost(),
    });
    expect(sendMock.mock.calls[0][0].input.Item.contentId).toBe(NIL_UUID);
  });
});

describe("webmention-io handler — Webmention wm-property coverage", () => {
  const properties: WmProperty[] = [
    "in-reply-to",
    "like-of",
    "repost-of",
    "bookmark-of",
    "mention-of",
    "rsvp",
  ];

  it.each(properties)(
    "stores a %s mention without losing the wm-property",
    async (property) => {
      const post = makePost({ "wm-property": property, "wm-id": property });
      await call({
        secret: TOKEN,
        target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
        post,
      });

      const stored = sendMock.mock.calls[0][0].input.Item.webmentionData as {
        "wm-property": WmProperty;
      };
      expect(stored["wm-property"]).toBe(property);
    },
  );

  it("preserves the h-entry author sub-object", async () => {
    const author = {
      name: "Test Author",
      photo: "https://example.test/me.png",
      url: "https://example.test",
    };
    await call({
      secret: TOKEN,
      target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
      post: makePost({ author }),
    });

    const stored = sendMock.mock.calls[0][0].input.Item.webmentionData as {
      author: typeof author;
    };
    expect(stored.author).toEqual(author);
  });
});

describe("webmention-io handler — no webhook token configured", () => {
  it("skips the secret check when WEBMENTION_IO_WEBHOOK_TOKEN is unset", async () => {
    vi.resetModules();
    const previous = process.env.WEBMENTION_IO_WEBHOOK_TOKEN;
    delete process.env.WEBMENTION_IO_WEBHOOK_TOKEN;
    try {
      const { handler: unauthenticatedHandler } = await import(
        "../webmention-io"
      );
      const res = (await unauthenticatedHandler(
        makeEvent({
          target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
          post: makePost(),
        }),
        context,
        () => {},
      )) as { statusCode: number; body: string };

      expect(res.statusCode).toBe(200);
      expect(sendMock).toHaveBeenCalledOnce();
    } finally {
      process.env.WEBMENTION_IO_WEBHOOK_TOKEN = previous;
      vi.resetModules();
    }
  });
});

describe("webmention-io handler — malformed input", () => {
  it("throws on a non-JSON body (callers/API Gateway should reject upstream)", async () => {
    await expect(call("this is not json")).rejects.toThrow();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("throws on an empty body rather than silently writing garbage", async () => {
    await expect(call("")).rejects.toThrow();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("throws when the post object is missing", async () => {
    await expect(
      call({
        secret: TOKEN,
        target: `https://alexwilson.tech/content/${ARTICLE_UUID}`,
      }),
    ).rejects.toThrow();
    expect(sendMock).not.toHaveBeenCalled();
  });
});
