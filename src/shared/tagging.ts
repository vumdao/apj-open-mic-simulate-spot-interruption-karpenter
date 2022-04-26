import { resolve } from 'path';
import { config } from 'dotenv';
import { LOCATION, SERVICE, STACK_NAME, OWNER, STAGE } from './constants';
import { EnvironmentConfig } from './environment';

config({ path: resolve(__dirname, '../.env') });

export function TagsProp(serviceName: string, envConf: EnvironmentConfig) {
  return {
    [STACK_NAME]: `${envConf.pattern}-${envConf.stage}-${serviceName}`,
    [SERVICE]: serviceName,
    [LOCATION]: envConf.pattern,
    [OWNER]: envConf.owner,
    [STAGE]: envConf.stage,
  };
}
