import { validateSlackSign } from '../libs/slackSignature';
import { logIfDebug } from '../libs/logDebug';
import { parseBotCommand } from '../botCommands/parse';

export const streamHandler = awslambda.streamifyResponse(async (event, responseStream) => {
  responseStream.setContentType('application/json');
  logIfDebug('event', event);

  try {
    if (!event.body) throw { errorMessage: 'missing body' };
    const eventWithBody = event as { body: string } ;

    let body: { token: string, type: string, challenge: string, event?: unknown };
    try {
      body = JSON.parse(eventWithBody.body) as { token: string, type: string, challenge: string, event?: unknown };
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
      responseStream.write(JSON.stringify({ challenge: body.challenge }));
      responseStream.end();
    } else if (body.type === 'event_callback') {
      if (body.event === undefined) throw { errorMessage: 'missing body event', body: 'received: '+event.body };
      if ((body.event as { type: string }).type === 'message') {
        responseStream.write('{}');
        responseStream.end();
        await handleSlackMessageEvent(body.event as Message);
      } else {
        throw { errorMessage: 'unrecognised event type', type: body.type };
      }
    } else throw { errorMessage: 'unsupported type', type: body.type };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(e));
    responseStream.write(JSON.stringify(e));
    responseStream.end();
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