#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { WebmentionStack } from "../lib/webmention-stack";
import { WebmentionCertificateStack } from "../lib/webmention-certificate-stack";

const app = new cdk.App();
const { certificate } = new WebmentionCertificateStack(
  app,
  "WebmentionCertificateStack",
  {
    domainName: "webmentions.alexwilson.tech",
    crossRegionReferences: true,
    env: {
      region: "us-east-1",
    },
  },
);
new WebmentionStack(app, "WebmentionStack", {
  domainName: "webmentions.alexwilson.tech",
  certificateArn: certificate.certificateArn,
  crossRegionReferences: true,
  env: {
    region: "eu-west-1",
  },
});
