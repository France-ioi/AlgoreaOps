import { LambdaFunctionURLResult } from 'aws-lambda';
import { logIfDebug } from './logDebug';

export function formatJSONResponse(response: Record<string, unknown>, statusCode = 200): LambdaFunctionURLResult {
  const fullResp = {
    statusCode: statusCode,
    body: JSON.stringify(response)
  };
  logIfDebug('response', fullResp);
  return fullResp;
}
