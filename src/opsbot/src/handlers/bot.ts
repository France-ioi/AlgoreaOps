import { LambdaFunctionURLEvent, LambdaFunctionURLResult } from 'aws-lambda';
import { formatJSONResponse } from '../libs/formatJson';
import { validateSlackSign } from '../libs/slackSignature';
import { logIfDebug } from '../libs/logDebug';
import { SlackChatClient } from '../libs/slackChatClient';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { awsConfig } from '../libs/awsConfig';
import { Task } from './worker';

export async function handler(event: LambdaFunctionURLEvent): Promise<LambdaFunctionURLResult> {
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

  const { channel, text } = message;
  const client = new SlackChatClient(channel);

  const releaseMatch = /^release (frontend|backend) (fioi|tez) (prod) (\d+)$/.exec(text);
  if (/^help$/.test(text)) {
    await client.send(`
  Commands: 
      help - this help
      status - info about deployments and releases
      release frontend|backend fioi|tez prod <lambdaversion>`);

  } else if (/^status$/.test(text)) {
    await Promise.all([
      client.send('Retrieving status...'),
      invokeWorkerWithTask({ channel, action: 'printStatus' }),
    ]);
  } else if (releaseMatch !== null) {
    if (!releaseMatch[1] || !releaseMatch[2] || !releaseMatch[3] || !releaseMatch[4]) throw new Error('unexpected: no arg match');
    await Promise.all([
      client.send('Releasing...'),
      invokeWorkerWithTask({
        channel,
        action: 'doRelease',
        app: releaseMatch[1],
        deployEnv: releaseMatch[2],
        stage: releaseMatch[3],
        lambdaVersion: releaseMatch[4]
      }),
    ]);
  } else {
    await client.send(text+': unknown command (try "help")');
  }
}

async function invokeWorkerWithTask(task: Task): Promise<void> {
  const stage = process.env['STAGE'];
  if (!stage) throw new Error('unexpected: undefined STAGE env var');
  const client = new LambdaClient(awsConfig);
  const command = new InvokeCommand({
    FunctionName: 'alg-opsbot-worker',
    InvocationType: 'Event',
    Payload: JSON.stringify(task),
  });
  await client.send(command);
}