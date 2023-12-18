import { WebClient } from '@slack/web-api';
import { logIfDebug } from './logDebug';

/**
 * Just a basic wrapper around the client which handle the error (just to make the call shorter)
*/
export class SlackChatClient {

  private client = new WebClient(process.env['SLACK_TOKEN']);

  constructor(private channel: string, private role: string) {}

  async send(text: string): Promise<void> {
    logIfDebug(`Will send message to slack: "${text}"`);

    const resp = await this.client.chat.postMessage({ channel: this.channel, text: `[${this.role}] ${text}` });

    logIfDebug('Message sent');

    // eslint-disable-next-line no-console
    if (!resp.ok) console.error(`error while posting message to slack: ${resp.error}`);
  }

}