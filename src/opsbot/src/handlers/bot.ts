import { validateSlackSign } from '../libs/slackSignature';
import { logIfDebug } from '../libs/logDebug';
import { parseBotCommand } from '../botCommands/parse';
import { SlackChatClient } from '../libs/slackChatClient';
import { parse } from 'qs';

type SlackPayload = { token: string } & (
  { type: 'url_verification', challenge?: string } |
  { type: 'event_callback', event?: unknown } |
  { type: 'block_actions', actions?: [{ action_id: string, value: string }], user: { id: string }, channel: { name: string }}
);

export const streamHandler = awslambda.streamifyResponse(async (event, responseStream) => {
  responseStream.setContentType('application/json');
  logIfDebug('event', event);

  try {
    if (!event.body) throw { errorMessage: 'missing body' };
    const eventBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
    const contentType = event.headers['content-type'];

    let payload: string|undefined;
    if (contentType === 'application/json') payload = eventBody;
    else if (contentType === 'application/x-www-form-urlencoded') payload = parse(eventBody).payload?.toString();
    else throw { errorMessage: 'content-type not supported', body: 'received: '+ contentType };
    if (!payload) throw { errorMessage: 'unable to get payload' };

    logIfDebug('payload', payload);

    let body: SlackPayload;
    try {
      body = JSON.parse(payload) as SlackPayload;
    } catch (e) {
      throw { errorMessage: 'invalid json', body: 'received: '+event.body };
    }
    if (!body.token) throw { errorMessage: 'missing token', body: 'received: '+event.body };
    if (!body.type) throw { errorMessage: 'missing type', body: 'received: '+event.body };

    if (process.env['SKIP_SIGNATURE_CHECK'] !== '1') {
      try {
        if (!validateSlackSign(event)) {
          throw { errorMessage: 'invalid slack signature', event: 'received: '+JSON.stringify(event) };
        }
      } catch (e) {
        throw { errorMessage: 'error while checking slack signature', details: e };
      }
    }

    if (body.type === 'url_verification') {
      if (!body.challenge) throw { errorMessage: 'missing challenge', body: 'received: '+event.body };
      responseStream.end(JSON.stringify({ challenge: body.challenge }));
    } else if (body.type === 'event_callback') {
      if (body.event === undefined) throw { errorMessage: 'missing body event', body: 'received: '+event.body };
      if ((body.event as { type: string }).type === 'message') {
        responseStream.end('{}');
        await handleSlackMessageEvent(body.event as Message);
      } else {
        throw { errorMessage: 'unrecognised event type', type: body.type };
      }
    } else if (body.type === 'block_actions') {
      if (!body.actions) throw { errorMessage: 'expected "actions" key in body', body: 'received: '+ JSON.stringify(body) };
      const action = body.actions[0];
      if (action.action_id !== 'command') throw { errorMessage: 'only "command" action_id are supported', got: JSON.stringify(action) };
      if (!action.value) throw { errorMessage: 'required action value', got: JSON.stringify(action) };
      if (!body.channel.name) throw { errorMessage: 'unable to find channel name in event', got: JSON.stringify(body) };
      responseStream.end('{}');
      await parseBotCommand(body.channel.name, action.value, isSuperUser(body.user.id));
    } else throw { errorMessage: 'unsupported type' };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    if (process.env.SLACK_CHANNEL) await new SlackChatClient(process.env.SLACK_CHANNEL, 'bot').send(`ERROR: ${String(e)}`);
  }
});

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
    console.log('Message from a bot. Don\'t react to it.');
    return;
  }

  const { channel, text, user } = message;
  await parseBotCommand(channel, text, isSuperUser(user));
}

function isSuperUser(userId: string): boolean {
  const superusers = (process.env['SLACK_SUPERUSERS'] || '').split(',').map(u => u.trim());
  return superusers.includes(userId);
}