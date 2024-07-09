import { resolve } from "node:path";
import * as cdk from "aws-cdk-lib/core";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as eventSources from "aws-cdk-lib/aws-lambda-event-sources";
import type { Construct } from "constructs";

export class WebmentionStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly apiv1: apigateway.Resource;
  public readonly database: dynamodb.Table;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // API Gateway to receive webmention webhooks
    this.api = new apigateway.RestApi(this, "WebmentionGateway", {
      restApiName: "Webmention Service",
    });
    this.apiv1 = this.api.root.addResource("v1");

    // DynamoDB Table
    this.database = new dynamodb.Table(this, "WebmentionsTable", {
      partitionKey: { name: "contentId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "webmentionId", type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // S3 Bucket
    this.bucket = new s3.Bucket(this, "WebmentionsBucket");
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${this.bucket.bucketArn}/*`],
        principals: [new iam.ServicePrincipal("apigateway.amazonaws.com")],
      }),
    );

    // Lambda Function to handle webmentions
    const webmentionIOLambda = new lambdaNodeJS.NodejsFunction(
      this,
      "WebmentionIOHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: resolve("src", "lambda", "webmention-io.ts"),
        handler: "index.handler",
        environment: {
          DYNAMODB_TABLE: this.database.tableName,
          S3_BUCKET: this.bucket.bucketName,
        },
      },
    );

    // Grant permissions to Lambda
    this.database.grantReadWriteData(webmentionIOLambda);
    this.bucket.grantReadWrite(webmentionIOLambda);

    // WebmentionIO webhook handler
    const webmentionIoResource = this.apiv1.addResource("webmention-io");
    webmentionIoResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(webmentionIOLambda),
    );

    // Lambda Function to serialize webmentions to S3
    const processWebmentionsLambda = new lambdaNodeJS.NodejsFunction(
      this,
      "ProcessWebmentionsHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: resolve("src", "lambda", "process-webmentions.ts"),
        handler: "index.handler",
        environment: {
          DYNAMODB_TABLE: this.database.tableName,
          S3_BUCKET: this.bucket.bucketName,
        },
      },
    );

    // Event source for DynamoDB table to trigger serialization Lambda
    processWebmentionsLambda.addEventSource(
      new eventSources.DynamoEventSource(this.database, {
        startingPosition: lambda.StartingPosition.LATEST,
      }),
    );

    // Grant permissions to Lambda
    this.database.grantReadWriteData(processWebmentionsLambda);
    this.bucket.grantReadWrite(processWebmentionsLambda);

    const s3Integration = new apigateway.AwsIntegration({
      service: "s3",
      integrationHttpMethod: "GET",
      path: `${this.bucket.bucketName}/webmentions/{contentId}.json`,
      options: {
        credentialsRole: new iam.Role(this, "ApiGatewayS3Role", {
          assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
          inlinePolicies: {
            allowS3Read: new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  actions: ["s3:GetObject"],
                  resources: [`${this.bucket.bucketArn}/webmentions/*`],
                  effect: iam.Effect.ALLOW,
                }),
              ],
            }),
          },
        }),
        requestParameters: {
          "integration.request.path.contentId": "method.request.path.contentId",
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type":
                "integration.response.header.Content-Type",
            },
          },
        ],
      },
    });

    const s3Resource = this.apiv1
      .addResource("webmention")
      .addResource("{contentId}");
    s3Resource.addMethod("GET", s3Integration, {
      requestParameters: {
        "method.request.path.contentId": true,
      },
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Content-Type": true,
          },
        },
      ],
    });
  }
}
