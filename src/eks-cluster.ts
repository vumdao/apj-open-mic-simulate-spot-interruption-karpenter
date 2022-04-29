import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { InstanceType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, KubernetesVersion, AwsAuth, NodegroupAmiType, CapacityType } from 'aws-cdk-lib/aws-eks';
import { CfnInstanceProfile, Role, ServicePrincipal, User } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './shared/environment';
import { EksIamOIDC } from './iam-oidc';
import { TagsProp } from './shared/tagging';


export class EksCluster extends Stack {
  constructor(scope: Construct, id: string, reg: EnvironmentConfig, props: StackProps) {
    super(scope, id, props);

    const eksNodeRole = new Role(this, `${reg.pattern}-eks-node-role-${reg.stage}`, {
      description: 'EKS Node role to be added to system master of Kubernetes RBAC group',
      roleName: `${reg.pattern}-eks-node-role-${reg.stage}`,
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });
    for (var pol of ['AmazonEKS_CNI_Policy', 'AmazonEKSWorkerNodePolicy', 'AmazonEC2ContainerRegistryReadOnly', 'AmazonSSMManagedInstanceCore']) {
      eksNodeRole.addManagedPolicy({ managedPolicyArn: `arn:aws:iam::aws:policy/${pol}` });
    }

    const instanceProfile = new CfnInstanceProfile(this, `${reg.pattern}-eks-node-instance-profile-${reg.stage}`, {
      instanceProfileName: `${reg.pattern}-eks-node-role-${reg.stage}`,
      roles: [eksNodeRole.roleName]
    });

    new CfnOutput(this, `${reg.pattern}-eks-node-role-${reg.stage}-output`, {value: eksNodeRole.roleName});
    new CfnOutput(this, `${reg.pattern}-eks-node-role-${reg.stage}-output`, {value: instanceProfile.instanceProfileName || ''});

    const eksClusterRole = new Role(this, `${reg.pattern}-eks-cluster-role-${reg.stage}`, {
      description: 'Role for Kubernetes control plane',
      roleName: `${reg.pattern}-eks-cluster-role-${reg.stage}`,
      assumedBy: new ServicePrincipal('eks.amazonaws.com'),
    });
    eksClusterRole.addManagedPolicy({ managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy' });

    const eksVpc = new Vpc(this, 'EKSVpc');

    const eksCluster = new Cluster(this, `${reg.pattern}-${reg.stage}`, {
      clusterName: `${reg.pattern}-${reg.stage}`,
      vpc: eksVpc,
      defaultCapacity: 0,
      mastersRole: eksNodeRole,
      role: eksClusterRole,
      version: KubernetesVersion.V1_22,
    });

    // Optionally add IAM user to access EKS cluster
    const awsAuth = new AwsAuth(this, 'AWSAuthUser', { cluster: eksCluster });
    awsAuth.addUserMapping(User.fromUserName(this, 'IAMUSER', 'vu.dao'), { groups: ['system:masters'], username: 'admin' });
    awsAuth.addRoleMapping(eksNodeRole, { groups: ['system:bootstrappers', 'system:nodes'], username: 'system:node:{{EC2PrivateDNSName}}' });

    eksCluster.addNodegroupCapacity(`${reg.pattern}-eks-nodegroup-${reg.stage}`, {
      nodegroupName: `${reg.pattern}-eks-nodegroup-${reg.stage}`,
      instanceTypes: [new InstanceType('t3.small'), new InstanceType('t3a.small')],
      minSize: 1,
      maxSize: 1,
      nodeRole: eksNodeRole,
      amiType: NodegroupAmiType.BOTTLEROCKET_X86_64,
      diskSize: 20,
      capacityType: CapacityType.SPOT,
      labels: {
        type: 'common',
        lifecycle: 'spot',
      }
    });

    new EksIamOIDC(this, 'EksIamOIDC', eksCluster, reg, {
      description: 'EKS IAM OIDC Provider',
      env: props.env,
      tags: TagsProp('iam-oidc', reg),
    });
  }
}