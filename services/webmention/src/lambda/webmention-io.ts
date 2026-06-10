import { createHash, timingSafeEqual } from "node:crypto";
import type { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const tableName = process.env.DYNAMODB_TABLE || "";
const webhookToken = process.env.WEBMENTION_IO_WEBHOOK_TOKEN || undefined;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
) => {
  let body: unknown;
  try {
    body = JSON.parse(event.body || "");
  } catch {
    return reply(400, "Request body must be JSON");
  }
  if (typeof body !== "object" || body === null) {
    return reply(400, "Request body must be a JSON object");
  }

  const { secret, post, target } = body as Record<string, unknown>;

  if (!secretMatches(secret)) {
    return reply(401, "Unauthorized");
  }

  const problem = validateWebmention(post, target);
  if (problem) {
    return reply(400, problem);
  }

  const webmentionData = post as Record<string, unknown>;
  const webmentionId = String(webmentionData["wm-id"]);
  const contentId = extractArticleIdFromUrl(target as string);

  // Persist entire webmention
  await dynamoDb.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        contentId,
        webmentionId,
        webmentionData,
      },
    }),
  );

  return reply(200, "Webmention processed successfully");
};

function reply(statusCode: number, message: string) {
  return { statusCode, body: JSON.stringify({ message }) };
}

// Constant-time comparison; a missing token configuration denies everything.
function secretMatches(secret: unknown): boolean {
  if (!webhookToken || typeof secret !== "string") {
    return false;
  }
  const provided = createHash("sha256").update(secret).digest();
  const expected = createHash("sha256").update(webhookToken).digest();
  return timingSafeEqual(provided, expected);
}

/**
 * Webmentions are third-party content that ends up rendered on the site, so
 * anything that doesn't look like a genuine webmention.io payload — in
 * particular URL fields with a scheme other than http(s) — is rejected
 * before it is stored.
 */
function validateWebmention(post: unknown, target: unknown): string | null {
  if (typeof target !== "string") {
    return "target must be a string";
  }
  if (typeof post !== "object" || post === null || Array.isArray(post)) {
    return "post must be an object";
  }

  const p = post as Record<string, unknown>;
  const id = p["wm-id"];
  if (typeof id !== "string" && typeof id !== "number") {
    return "post is missing wm-id";
  }

  for (const field of ["url", "wm-source", "wm-target"]) {
    if (p[field] !== undefined && !isHttpUrl(p[field])) {
      return `post ${field} must be an http(s) URL`;
    }
  }

  if (p.author !== undefined) {
    if (typeof p.author !== "object" || p.author === null) {
      return "author must be an object";
    }
    const author = p.author as Record<string, unknown>;
    for (const field of ["url", "photo"]) {
      if (author[field] !== undefined && !isHttpUrl(author[field])) {
        return `author ${field} must be an http(s) URL`;
      }
    }
  }

  return null;
}

function isHttpUrl(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Extracts the article ID from a URL.
 * @param {string} url The URL to extract the article ID from.
 * @returns {string} The article ID, or NIL.
 */
function extractArticleIdFromUrl(url: string): string | null {
  const match = url.match(/\/content\/(........-....-....-....-............)/);
  return match ? match[1] : NIL_UUID;
}
