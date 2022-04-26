import { Stack, CfnOutput, StackProps } from 'aws-cdk-lib';
import { Cluster } from 'aws-cdk-lib/aws-eks';
import { OpenIdConnectProvider } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './shared/environment';

export class EksIamOIDC extends Stack {
  constructor(scope: Construct, id: string, eksCluster: Cluster, reg: EnvironmentConfig, props: StackProps) {
    super(scope, id, props);

    const iamOidc = new OpenIdConnectProvider(this, `${reg.pattern}-iam-oidc-${reg.stage}`, {
      url: eksCluster.clusterOpenIdConnectIssuerUrl,
      clientIds: ['sts.amazonaws.com'],
    });

    new CfnOutput(this, `${reg.pattern}-iam-oidc-${reg.stage}-url-output`, {
      value: iamOidc.openIdConnectProviderIssuer,
      exportName: `${reg.pattern}-iam-oidc-${reg.stage}-url`,
    });

    new CfnOutput(this, `${reg.pattern}-iam-oidc-${reg.stage}-arn-output`, {
      value: iamOidc.openIdConnectProviderArn,
      exportName: `${reg.pattern}-iam-oidc-${reg.stage}-arn`,
    });
  }
}