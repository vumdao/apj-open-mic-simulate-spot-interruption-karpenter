import { Environment } from 'aws-cdk-lib';
import { AWS_DEV_ENVIRONMENT_NAME, AWS_DEV_REGION } from './configs';
import { DEV_STAGE, OWNER_DEFAULT } from './constants';


export interface EnvironmentConfig extends Environment {
  pattern: string;
  stage: string;
  owner: string;
  region: string;
}

export const devEnv: EnvironmentConfig = {
  pattern: AWS_DEV_ENVIRONMENT_NAME,
  region: AWS_DEV_REGION,
  owner: OWNER_DEFAULT,
  stage: DEV_STAGE,
};
