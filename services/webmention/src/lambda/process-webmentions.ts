import type {
  DynamoDBStreamEvent,
  DynamoDBStreamHandler,
  StreamRecord,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import axios from "axios";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();
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
      const allWebmentions = await dynamoDb
        .query({
          TableName: tableName,
          KeyConditionExpression: "contentId = :contentId",
          ExpressionAttributeValues: {
            ":contentId": contentId,
          },
        })
        .promise();

      const webmentions = allWebmentions.Items.map(
        (data: { webmentionData: object }) => data.webmentionData,
      );
      const responseBody = {
        type: "feed",
        name: "Webmentions",
        children: webmentions,
      };

      // Serialize webmentions to S3.
      await s3
        .putObject({
          Bucket: bucketName,
          Key: `webmentions/${contentId}.json`,
          Body: JSON.stringify(responseBody),
          ContentType: "application/json",
        })
        .promise();

      // Purge cache for invalidation.
      await cloudfront
        .createInvalidation({
          DistributionId: distributionId,
          InvalidationBatch: {
            CallerReference: String(Date.now()),
            Paths: {
              Quantity: 1,
              Items: [`/v1/webmention/${contentId}`],
            },
          },
        })
        .promise();
    },
  );

  await Promise.all(promises);
};
