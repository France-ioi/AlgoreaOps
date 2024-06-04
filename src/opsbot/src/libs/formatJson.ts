import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { logIfDebug } from './logDebug';

export function formatJSONResponse(response: Record<string, unknown>, statusCode = 200): APIGatewayProxyStructuredResultV2 {
  const fullResp = {
    statusCode: statusCode,
    body: JSON.stringify(response)
  };
  logIfDebug('response', fullResp);
  return fullResp;
}
