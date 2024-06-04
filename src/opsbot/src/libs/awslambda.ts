/* eslint-disable @typescript-eslint/no-namespace */
/**
 * Utility file used to define the type of 'awslambda' which is provided by the node runtime in lambda but which has no type definition
 */

import { Context, Handler, LambdaFunctionURLEvent } from 'aws-lambda';
import { Writable } from 'stream';

declare global {
  namespace awslambda {
    export namespace HttpResponseStream {
      function from(writable: Writable, metadata: unknown): Writable;
    }

    export type ResponseStream = Writable & { setContentType(type: string): void };

    export type StreamifyHandler = (event: LambdaFunctionURLEvent, responseStream: ResponseStream, context: Context) => Promise<unknown>;

    export function streamifyResponse(handler: StreamifyHandler): Handler<LambdaFunctionURLEvent>;
  }
}