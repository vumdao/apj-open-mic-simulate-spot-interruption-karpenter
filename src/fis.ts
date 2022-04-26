import { Stack, StackProps } from "aws-cdk-lib";
import { CfnExperimentTemplate } from "aws-cdk-lib/aws-fis";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { EnvironmentConfig } from "./shared/environment";

export class FisTestSpotInterrupt extends Stack {
    constructor(scope: Construct, id: string, reg: EnvironmentConfig, props: StackProps) {
        super(scope, id, props);

        const fisRole = new Role(this, `${reg.pattern}-fis-role-${reg.stage}`, {
            roleName: `${reg.pattern}-fis-role-${reg.stage}`,
            assumedBy: new ServicePrincipal('fis.amazonaws.com')
        });

        const fisPolicySts = new PolicyStatement({
            sid: "SpotFisTest",
            actions: [
                'ec2:DescribeInstances',
                'ec2:StopInstances',
                'ec2:SendSpotInstanceInterruptions'
            ],
            resources: [`arn:aws:ec2:${this.region}:${this.account}:instance/*`],
        });

        fisRole.addToPolicy(fisPolicySts);

        new CfnExperimentTemplate(this, `${reg.pattern}-fis-exp-template-${reg.stage}`, {
            description: 'Spot Interruption Simulate',
            tags: {
                'Name': `${reg.pattern}-fis-exp-template-${reg.stage}`,
                'stage': reg.stage
            },
            roleArn: fisRole.roleArn,
            stopConditions: [{source: 'none'}],
            targets: {
                [`${reg.pattern}-spot-fis-target-${reg.stage}`]: {
                    resourceType: 'aws:ec2:spot-instance',
                    resourceTags: {'accountingEC2Tag': 'karpenter'},
                    selectionMode: 'COUNT(1)',
                    filters: [{
                        path: 'State.Name',
                        values: ['running']
                    }]
                }
            },
            actions: {
                [`${reg.pattern}-send-spot-event-${reg.stage}`]: {
                    actionId: 'aws:ec2:send-spot-instance-interruptions',
                    parameters: {'durationBeforeInterruption': 'PT2M'},
                    targets: {'SpotInstances': `${reg.pattern}-spot-fis-target-${reg.stage}`}
                }
            }
        });
    }
}