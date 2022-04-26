import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import { SqsQueue } from 'aws-cdk-lib/aws-events-targets';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './shared/environment';


export class NTHSQSEventRules extends Stack {
  constructor(scope: Construct, id: string, reg: EnvironmentConfig, props: StackProps) {
    super(scope, id, props);

    const spotSqs = new Queue(this, `${reg.pattern}-nth-sqs-${reg.stage}`, {
        queueName: `${reg.pattern}-nth-sqs-${reg.stage}`
    });

    const sqsTarget = new SqsQueue(spotSqs);

    new Rule(this, `${reg.pattern}-ec2-spot-event-rule-${reg.stage}`, {
        ruleName: `${reg.pattern}-ec2-spot-event-rule-${reg.stage}`,
        targets: [sqsTarget],
        eventPattern: {
            source: ["aws.ec2"],
            detailType: [
                "EC2 Spot Instance Interruption Warning",
                "EC2 Instance Rebalance Recommendation",
                "EC2 Instance State-change Notification"
            ]
        }
    });

    new Rule(this, `${reg.pattern}-aws-health-event-rule-${reg.stage}`, {
        ruleName: `${reg.pattern}-aws-health-event-rule-${reg.stage}`,
        targets: [sqsTarget],
        eventPattern: {
            source: ["aws.health"],
            detailType: [ "AWS Health Event" ]
        }
    });

    new CfnOutput(this, 'nth-dev-sqs-output', { value: spotSqs.queueUrl});
  }
}