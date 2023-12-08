import { LambdaFunctionURLEvent } from 'aws-lambda';
import { createHmac } from 'crypto';

export function validateSlackSign(event: LambdaFunctionURLEvent): boolean {
    const slackSecret = process.env['SLACK_SIGNING_SECRET'];
    if (!slackSecret) throw new Error('Slack secret not found in env at key SLACK_SIGNING_SECRET')

    const rawString = `v0:${event.headers['x-slack-request-timestamp']}:${event.body}`;
    const hmac = createHmac('sha256', slackSecret);
    return `v0=${hmac.update(rawString).digest('hex')}` === event.headers['x-slack-signature'];
}