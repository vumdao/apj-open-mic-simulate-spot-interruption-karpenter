import { Stack, StackProps, CfnOutput, Fn, CfnJson } from 'aws-cdk-lib';
import { Role, FederatedPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { KARPENTER_CONTROLLER_SERVICEACCOUNT, KARPENTER_NAMESPACE } from './shared/constants';
import { EnvironmentConfig } from './shared/environment';

export class KarpenterServiceAccount extends Stack {
    constructor(scope: Construct, id: string, reg: EnvironmentConfig, props: StackProps) {
        super(scope, id, props);

        const iamOidcProvider = Fn.importValue(`${reg.pattern}-iam-oidc-${reg.stage}-url`).toString();
        const iamOidcArn = Fn.importValue(`${reg.pattern}-iam-oidc-${reg.stage}-arn`).toString();

        const ec2Statement = new PolicyStatement({
            sid: 'Ec2Provision',
            actions: [
                "ec2:CreateLaunchTemplate",
                "ec2:CreateFleet",
                "ec2:RunInstances",
                "ec2:CreateTags",
                "iam:PassRole",
                "ec2:TerminateInstances",
                "ec2:DeleteLaunchTemplate",
                "ec2:DescribeLaunchTemplates",
                "ec2:DescribeInstances",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeSubnets",
                "ec2:DescribeInstanceTypes",
                "ec2:DescribeInstanceTypeOfferings",
                "ec2:DescribeAvailabilityZones",
                "ssm:GetParameter"
            ],
            resources: ['*'],
            conditions: {
                StringEquals: { 'aws:RequestedRegion': this.region },
            },
        });

        const stringEquals = new CfnJson(this, 'KarpenterCondiftionJson', {
            value: {
              [`${iamOidcProvider}:sub`]: `system:serviceaccount:${KARPENTER_NAMESPACE}:${KARPENTER_CONTROLLER_SERVICEACCOUNT}`,
              [`${iamOidcProvider}:aud`]: 'sts.amazonaws.com',
            }
        });

        const karpenterControllerRole = new Role(this, `${reg.pattern}-karpenter-role-${reg.stage}`, {
            roleName: `${reg.pattern}-karpenter-role-${reg.stage}`,
            assumedBy: new FederatedPrincipal(
                iamOidcArn,
                {
                  StringEquals: stringEquals,
                },
                'sts:AssumeRoleWithWebIdentity'
            )
        });

        karpenterControllerRole.addToPolicy(ec2Statement);

        new CfnOutput(this, `${reg.pattern}-karpenter-role-${reg.stage}-output`, { value: karpenterControllerRole.roleArn });
    }
}