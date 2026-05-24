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
  const body = JSON.parse(event.body || "");

  if (webhookToken && body.secret !== webhookToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const webmentionData = body.post;
  const webmentionId = String(body.post["wm-id"]);
  const contentId = extractArticleIdFromUrl(body.target);

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

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Webmention processed successfully" }),
  };
};

/**
 * Extracts the article ID from a URL.
 * @param {string} url The URL to extract the article ID from.
 * @returns {string} The article ID, or NIL.
 */
function extractArticleIdFromUrl(url: string): string | null {
  const match = url.match(/\/content\/(........-....-....-....-............)/);
  return match ? match[1] : NIL_UUID;
}
