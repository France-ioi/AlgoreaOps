import { DeleteFunctionCommand, GetAliasCommand, LambdaClient, UpdateAliasCommand } from '@aws-sdk/client-lambda';
import { lambdaFunctionName } from './envToFunctionNames';
import { awsConfig } from '../libs/awsConfig';

export interface Release {
  function: string,
  alias: string,
  lambdaVersion: string|undefined,
}

export async function gatherReleaseInfo(): Promise<Release[]> {
  const client = new LambdaClient(awsConfig);
  return await Promise.all(
    [
      { function: lambdaFunctionName('frontend', 'fioi'), alias: 'prod' },
      { function: lambdaFunctionName('backend', 'fioi'), alias: 'prod' },
    ]
      .map(async req => ({ ...req, lambdaVersion: await aliasInfo(client, req.function, req.alias) }))
  );
}

async function aliasInfo(client: LambdaClient, functionName: string, alias: string): Promise<string|undefined> {
  const command = new GetAliasCommand({ FunctionName: functionName, Name: alias });
  const response = await client.send(command);
  return response.FunctionVersion;
}

export async function changeAliasVersion(functionName: string, alias: string, version: string): Promise<void> {
  const client = new LambdaClient(awsConfig);
  const command = new UpdateAliasCommand({ FunctionName: functionName, Name: alias, FunctionVersion: version });
  await client.send(command);
}

export async function removeVersion(functionName: string, version: string): Promise<void> {
  const client = new LambdaClient(awsConfig);
  const command = new DeleteFunctionCommand({ FunctionName: functionName, Qualifier: version });
  await client.send(command);
}
