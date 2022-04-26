import { App, Environment } from 'aws-cdk-lib';
import { EksCluster } from './eks-cluster';
import { FisTestSpotInterrupt } from './fis';
import { KarpenterServiceAccount } from './karpenter-sa';
import { NTHServiceAccount } from './nth-sa';
import { NTHSQSEventRules } from './nth-sqs-rules';
import { devEnv } from './shared/environment';
import { TagsProp } from './shared/tagging';

const app = new App();

const eksEnv: Environment = {
  region: devEnv.region,
  account: devEnv.account,
};

const eksCluster = new EksCluster(app, 'EksCluster', devEnv, {
  description: 'EKS cluster for Development',
  env: eksEnv,
  tags: TagsProp('eks', devEnv),
});

const karpenterSA = new KarpenterServiceAccount(app, 'KarpenterServiceAccount', devEnv, {
  description: 'Karpenter serviceAccount',
  env: eksEnv,
  tags: TagsProp('irsa', devEnv),
});

new NTHSQSEventRules(app, 'NTHSQSEventRules', devEnv, {
  description: 'NTH serviceAccount',
  env: eksEnv,
  tags: TagsProp('irsa', devEnv),
});

const nthSA = new NTHServiceAccount(app, 'NTHServiceAccount', devEnv, {
  description: 'NTH serviceAccount',
  env: eksEnv,
  tags: TagsProp('irsa', devEnv),
});

karpenterSA.addDependency(eksCluster);
nthSA.addDependency(eksCluster);

new FisTestSpotInterrupt(app, 'FisTestSpotInterrupt', devEnv, {
  description: 'Fault injection simulate spot interruption',
  env: eksEnv,
  tags: TagsProp('irsa', devEnv),
});

app.synth();