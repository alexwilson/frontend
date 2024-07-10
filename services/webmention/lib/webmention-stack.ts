import { resolve } from "node:path";
import * as cdk from "aws-cdk-lib/core";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as eventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import type { Construct } from "constructs";

interface WebmentionCertificateStackProps extends cdk.StackProps {
  domainName: string;
  certificateArn: string;
}

export class WebmentionStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly apiv1: apigateway.Resource;
  public readonly database: dynamodb.Table;
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(
    scope: Construct,
    id: string,
    props: WebmentionCertificateStackProps,
  ) {
    super(scope, id, props);

    // API Gateway to receive webmention webhooks
    this.api = new apigateway.RestApi(this, "WebmentionGateway", {
      restApiName: "Webmention Service",
      // name: cdk.PhysicalName.GENERATE_IF_NEEDED,
    });
    this.apiv1 = this.api.root.addResource("v1");

    // DynamoDB Table
    this.database = new dynamodb.Table(this, "WebmentionsTable", {
      partitionKey: { name: "contentId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "webmentionId", type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // S3 Bucket
    this.bucket = new s3.Bucket(this, "WebmentionsBucket", {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
    });
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${this.bucket.bucketArn}/*`],
        principals: [new iam.ServicePrincipal("apigateway.amazonaws.com")],
      }),
    );

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(
      this,
      "WebmentionDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(this.bucket, {}),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        additionalBehaviors: {
          "v1/*": {
            origin: new origins.RestApiOrigin(this.api, {
              originPath: `/${this.api.deploymentStage.stageName}`,
            }),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          },
        },
        domainNames: [props.domainName],
        certificate: acm.Certificate.fromCertificateArn(
          this,
          "Certificate",
          props.certificateArn,
        ),
      },
    );

    // Lambda Function to handle webmentions
    const webmentionIoWebhookToken = new secretsmanager.Secret(
      this,
      "WebmentionIOWebhookToken",
      {
        secretName: "webmention-io-webhook-token",
      },
    );

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
          WEBMENTION_IO_WEBHOOK_TOKEN: webmentionIoWebhookToken.secretValue
            .unsafeUnwrap() // This is security by obscurity, it isn't a sensitive secret.
            .toString(),
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
          CLOUDFRONT_DISTRIBUTION_ID: this.distribution.distributionId,
        },
      },
    );
    this.distribution.grantCreateInvalidation(processWebmentionsLambda);

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
          {
            statusCode: "404",
            responseParameters: {
              "method.response.header.Content-Type": "'application/json'",
              "method.response.header.Cache-Control":
                "'public, max-age=31536000'",
            },
            responseTemplates: {
              "application/json": JSON.stringify({
                type: "feed",
                children: [],
                message: "No webmentions found",
              }),
            },
            selectionPattern: "403",
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
        {
          responseParameters: {
            "method.response.header.Content-Type": true,
            "method.response.header.Cache-Control": true,
          },
          statusCode: "404",
        },
      ],
    });

    new cdk.CfnOutput(this, "APIGateway", {
      value: this.api.url,
    });

    // Output the CloudFront distribution URL
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.domainName,
    });
  }
}
