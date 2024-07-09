import type {
  DynamoDBStreamEvent,
  DynamoDBStreamHandler,
  StreamRecord,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import axios from "axios";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const tableName = process.env.DYNAMODB_TABLE || "";
const bucketName = process.env.S3_BUCKET || "";

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

  for (const contentId of contentIds) {
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

    // Serialize webmentions to S3.
    await s3
      .putObject({
        Bucket: bucketName,
        Key: `webmentions/${contentId}.json`,
        Body: JSON.stringify(
          allWebmentions.Items.map(
            (data: { webmentionData: object }) => data.webmentionData,
          ),
        ),
        ContentType: "application/json",
      })
      .promise();
  }
};
