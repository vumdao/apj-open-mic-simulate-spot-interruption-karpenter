import { Stack, StackProps, CfnOutput, Fn, CfnJson } from 'aws-cdk-lib';
import { Role, FederatedPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { NTH_SERVICEACCOUNT } from './shared/constants';
import { EnvironmentConfig } from './shared/environment';


export class NTHServiceAccount extends Stack {
  constructor(scope: Construct, id: string, reg: EnvironmentConfig, props: StackProps) {
    super(scope, id, props);

    const iamOidcProvider = Fn.importValue(`${reg.pattern}-iam-oidc-${reg.stage}-url`).toString();
    const iamOidcArn = Fn.importValue(`${reg.pattern}-iam-oidc-${reg.stage}-arn`).toString();

    const nthSQSName = `${reg.pattern}-nth-sqs-${reg.stage}`;

    const sqsSts = new PolicyStatement({
      sid: 'SQSSpotEvent',
      actions: [
        "sqs:DeleteMessage",
        "sqs:ReceiveMessage"
      ],
      resources: [`arn:aws:sqs:${this.region}:${this.account}:${nthSQSName}`]
    });

    const ec2Sts = new PolicyStatement({
        sid: "EC2Handle",
        actions: [
            "ec2:DescribeInstances",
            "autoscaling:Describe*"
        ],
        resources: ['*'],
        conditions: {
            StringEquals: {
                'aws:RequestedRegion': this.region,
                'aws:PrincipalAccount': this.account
            },
        },
    });

    const stringEqualsJson = new CfnJson(this, 'NTHCondiftionJson', {
      value: {
        [`${iamOidcProvider}:sub`]: `system:serviceaccount:kube-system:${NTH_SERVICEACCOUNT}`,
        [`${iamOidcProvider}:aud`]: 'sts.amazonaws.com',
      }
    });

    const NTHRole = new Role(this, `${reg.pattern}-nth-role-${reg.stage}`, {
      roleName: `${reg.pattern}-nth-role-${reg.stage}`,
      assumedBy: new FederatedPrincipal(
        iamOidcArn,
        {
          StringEquals: stringEqualsJson
        },
        'sts:AssumeRoleWithWebIdentity'
      )
    });

    NTHRole.addToPolicy(sqsSts);
    NTHRole.addToPolicy(ec2Sts);

    new CfnOutput(this, `${reg.pattern}-nth-role-${reg.stage}-output`, { value: NTHRole.roleArn });
  }
}