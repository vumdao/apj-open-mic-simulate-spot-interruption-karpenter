import { awscdk } from "projen";
import { ApprovalLevel } from "projen/lib/awscdk";
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: "2.21.1",
  defaultReleaseBranch: "master",
  name: "apj-open-mic-simulate-spot-interruption-karpenter",
  projenrcTs: true,
  deps: ['env-var', 'dotenv'],
  gitignore: ['.idea'],
  requireApproval: ApprovalLevel.NEVER

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});

const dotEnvFile = '.env';
project.gitignore.addPatterns(dotEnvFile);
project.gitignore.addPatterns('cdk.context.json');
project.gitignore.addPatterns('.github');

project.synth();