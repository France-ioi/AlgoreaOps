import { APIGatewayProxyStructuredResultV2, LambdaFunctionURLEvent } from 'aws-lambda';
import { formatJSONResponse } from '../libs/formatJson';
import { validateSlackSign } from '../libs/slackSignature';
import { logIfDebug } from '../libs/logDebug';
import { parseBotCommand } from '../botCommands/parse';

export const streamHandler = awslambda.streamifyResponse(async (event, responseStream) => {
  responseStream.setContentType('application/json');
  const response = await handler(event);
  responseStream.write(response.body);
  responseStream.end();
});

async function handler(event: LambdaFunctionURLEvent): Promise<APIGatewayProxyStructuredResultV2> {
  logIfDebug('event', event);

  if (!event.body) return formatJSONResponse({ errorMessage: 'missing body' }, 400);
  const eventWithBody = event as { body: string } ;

  let body: { token: string, type: string, challenge: string, event?: unknown };
  try {
    body = JSON.parse(eventWithBody.body) as { token: string, type: string, challenge: string, event?: unknown };
  } catch (e) {
    return formatJSONResponse({ errorMessage: 'invalid json', body: 'received: '+event.body }, 400);
  }
  if (!body.token) return formatJSONResponse({ errorMessage: 'missing token', body: 'received: '+event.body }, 400);
  if (!body.type) return formatJSONResponse({ errorMessage: 'missing type', body: 'received: '+event.body }, 400);

  if (process.env['SKIP_SIGNATURE_CHECK'] !== '1') {
    try {
      if (!validateSlackSign(event)) {
        return formatJSONResponse({ errorMessage: 'invalid slack signature', event: 'received: '+JSON.stringify(event) }, 400);
      }
    } catch (e) {
      return formatJSONResponse({ errorMessage: 'error while checking slack signature', details: e }, 400);
    }
  }

  if (body.type === 'url_verification') {
    if (!body.challenge) return formatJSONResponse({ errorMessage: 'missing challenge', body: 'received: '+event.body }, 400);
    return formatJSONResponse({ challenge: body.challenge });
  }
  if (body.type === 'event_callback') {
    if (body.event === undefined) return formatJSONResponse({ errorMessage: 'missing body event', body: 'received: '+event.body }, 400);
    if ((body.event as { type: string }).type === 'message') {
      await handleSlackMessageEvent(body.event as Message);
    } else {
      // eslint-disable-next-line no-console
      console.error('unrecognised event type?');
    }
    return formatJSONResponse({});
  }

  return formatJSONResponse({ errorMessage: 'unsupported type', type: body.type }, 400);
}

// https://api.slack.com/events/message
interface Message {
  type: 'message',
  channel: string,
  user: string,
  text: string,
  ts: string,
  bot_id?: string,
}

async function handleSlackMessageEvent(message: Message): Promise<void> {

  if (message.bot_id) {
    // eslint-disable-next-line no-console
    console.log('Message from the bot itself. Don\'t react to it.');
    return;
  }

  const { channel, text, user } = message;
  await parseBotCommand(channel, text, isSuperUser(user));
}

function isSuperUser(userId: string): boolean {
  const superusers = (process.env['SLACK_SUPERUSERS'] || '').split(',').map(u => u.trim());
  return superusers.includes(userId);
}