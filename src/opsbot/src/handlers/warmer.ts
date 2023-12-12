import { request } from 'https';

export async function handler(event: { urls: string[] }): Promise<void> {
  if (!Array.isArray(event.urls)) throw new Error('expected a list of urls as input (only)');
  await Promise.all(event.urls.map(async url => callAndReport(url)));
}

async function callAndReport(url: string): Promise<void> {
  const before = Date.now();
  let error = null;
  try {
    await httpRequest(url);
  } catch (e) {
    error = e;
  }
  const timeElapsed = Date.now() - before;
  // eslint-disable-next-line no-console
  console.log(`${url}, ${timeElapsed}ms, ${ error !== null ? JSON.stringify(error) : 'success' }`);
}

async function httpRequest(params: string): Promise<string> {
  return new Promise(function(resolve, reject) {
    const req = request(params, res => {
      // reject on bad status
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        return reject(new Error('statusCode=' + res.statusCode));
      }
      // cumulate data
      const body: Uint8Array[] = [];
      res.on('data', function(chunk: Uint8Array) {
        body.push(chunk);
      });
      // resolve on end
      res.on('end', function() {
        let finalBody = '';
        try {
          finalBody = Buffer.concat(body).toString();
        } catch (e) {
          reject(e);
        }
        resolve(finalBody);
      });
    });
    // reject on request error
    req.on('error', function(err) {
      // This is not a "Second reject", just a different sort of failure
      reject(err);
    });
    req.end();
  });
}