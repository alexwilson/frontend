import * as cdk from "aws-cdk-lib/core";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import type { Construct } from "constructs";

interface WebmentionCertificateStackProps extends cdk.StackProps {
  domainName: string;
}

export class WebmentionCertificateStack extends cdk.Stack {
  public readonly certificate: acm.Certificate;
  constructor(
    scope: Construct,
    id: string,
    props: WebmentionCertificateStackProps,
  ) {
    super(scope, id, {
      ...props,
      env: { region: "us-east-1" },
    });

    // Request a certificate for this domain.
    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.domainName,
      validation: acm.CertificateValidation.fromDns(),
    });

    const certificateArn = this.certificate.certificateArn;
    new cdk.CfnOutput(this, "CertificateArn", {
      value: certificateArn,
    });
  }
}
