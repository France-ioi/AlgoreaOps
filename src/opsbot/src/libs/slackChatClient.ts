import { WebClient } from '@slack/web-api';

/**
 * Just a basic wrapper around the client which handle the error (just to make the call shorter)
*/
export class SlackChatClient {

  private client = new WebClient(process.env['SLACK_TOKEN']);

  constructor(private channel: string) {}

  async send(text: string): Promise<void> {
    // eslint-disable-next-line no-console
    if (process.env['DEBUG'] === '1') console.debug("Message send to slack: "+text);

    const resp = await this.client.chat.postMessage({ channel: this.channel, text });
    // eslint-disable-next-line no-console
    if (!resp.ok) console.error(`error while posting message to slack: ${resp.error}`);
  }

}