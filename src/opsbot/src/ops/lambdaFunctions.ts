import { GetAliasCommand, LambdaClient, ListVersionsByFunctionCommand, UpdateAliasCommand } from '@aws-sdk/client-lambda';
import { awsConfig } from '../libs/awsConfig';

export interface Release {
  function: string,
  alias: string,
  lambdaVersion: string|undefined,
}

export async function aliasInfo(functionName: string, alias: string): Promise<{ version: string|undefined }> {
  const client = new LambdaClient(awsConfig);
  const command = new GetAliasCommand({ FunctionName: functionName, Name: alias });
  const response = await client.send(command);
  return { version: response.FunctionVersion };
}

export async function changeAliasVersion(functionName: string, alias: string, version: string): Promise<void> {
  const client = new LambdaClient(awsConfig);
  const command = new UpdateAliasCommand({ FunctionName: functionName, Name: alias, FunctionVersion: version });
  await client.send(command);
}

export async function functionVersions(functionName: string): Promise<{ description: string, version: string }[]> {
  const client = new LambdaClient(awsConfig);
  const command = new ListVersionsByFunctionCommand({ FunctionName: functionName });
  const response = await client.send(command);
  return (response.Versions ?? [])
    .filter(v => v.Version !== '$LATEST')
    .map(v => ({ description: v.Description!, version: v.Version! }));
}

