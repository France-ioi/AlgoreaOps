import { Release, gatherReleaseInfo } from '../ops/releases';
import { EnvDeployments, gatherDeploymentsInfo } from '../ops/deployments';

export async function textStatus(): Promise<string> {
  const info = await gatherInfo();
  let output = 'Releases:\n';
  output += info.releases.map(r => `- ${r.function}@${r.alias} -> ${r.lambdaVersion}`).join('\n');
  output += '\nDeployments:\n';
  output += info.deployments
    .map(de => `- ${de.app} ${de.env}\n${de.deployments.map(d => `    - ${d.deploymentId} => ${d.lambdaVersion}\n`).join('')}`).join('\n');
  return output;
}

async function gatherInfo(): Promise<{ releases: Release[], deployments: EnvDeployments[] }> {
  const info = await Promise.all([ gatherReleaseInfo(), gatherDeploymentsInfo() ]);
  return { releases: info[0], deployments: info[1] };
}
