import type {
  DynamoDBStreamEvent,
  DynamoDBStreamHandler,
  StreamRecord,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const cloudfront = new CloudFrontClient({});
const tableName = process.env.DYNAMODB_TABLE || "";
const bucketName = process.env.S3_BUCKET || "";
const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID || "";

export const handler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent,
) => {
  const contentIds: Set<string> = new Set();
  for (const record of event.Records) {
    if (record?.dynamodb?.NewImage?.contentId?.S) {
      contentIds.add(record.dynamodb.NewImage.contentId.S);
    }
    if (record?.dynamodb?.OldImage?.contentId?.S) {
      contentIds.add(record.dynamodb.OldImage.contentId.S);
    }
  }

  const promises: Array<Promise<void>> = Array.from(contentIds).map(
    async (contentId) => {
      // Query all webmentions for this article
      const allWebmentions = await dynamoDb.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "contentId = :contentId",
          ExpressionAttributeValues: {
            ":contentId": contentId,
          },
        }),
      );

      const webmentions = (allWebmentions.Items ?? []).map(
        (data) => (data as { webmentionData: object }).webmentionData,
      );
      const responseBody = {
        type: "feed",
        name: "Webmentions",
        children: webmentions,
      };

      // Serialize webmentions to S3.
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `webmentions/${contentId}.json`,
          Body: JSON.stringify(responseBody),
          ContentType: "application/json",
        }),
      );

      // Purge cache for invalidation.
      await cloudfront.send(
        new CreateInvalidationCommand({
          DistributionId: distributionId,
          InvalidationBatch: {
            CallerReference: String(Date.now()),
            Paths: {
              Quantity: 1,
              Items: [`/v1/webmention/${contentId}`],
            },
          },
        }),
      );
    },
  );

  await Promise.all(promises);
};
