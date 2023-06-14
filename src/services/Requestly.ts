import { URLSearchParams } from 'url';
import { request, RequestOptions } from 'https';
import type { IncomingMessage } from 'http';

function parseJSON<ParseResult = Record<string, unknown>>(rawData: string): ParseResult | string {
  try {
    return JSON.parse(rawData) as ParseResult;
  } catch (ignore) {
    return rawData;
  }
}

function makeParams(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

function sendRequest<Response = unknown>(
  options: RequestOptions,
  params?: string,
): Promise<Response | string> {
  return new Promise((resolve, reject) => {
    const req = request(options, (res: IncomingMessage) => {
      const chunks = [] as Uint8Array[];

      res.on('data', (chunk: Uint8Array) => chunks.push(chunk));

      res.on('end', () => {
        const data = parseJSON<Response>(Buffer.concat(chunks).toString());

        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(data);
        }
      });

      res.on('error', (error) => {
        reject(error);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (params) {
      req.write(params);
    }

    req.end();
  });
}

export function post<DataResponse>(
  options: RequestOptions,
  params: Record<string, string>,
): Promise<DataResponse | string> {
  const postData: string = makeParams(params);

  options.method = 'POST';
  options.headers = {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'Content-Length': Buffer.byteLength(postData),
  };

  return sendRequest<DataResponse>(options, postData);
}

export function postRFC822<DataResponse>(
  options: RequestOptions,
  data: string,
): Promise<DataResponse | string> {
  options.method = 'POST';
  options.headers = Object.assign(options.headers || {}, {
    'Content-Type': 'message/rfc822',
    'Content-Length': Buffer.byteLength(data),
  });

  return sendRequest<DataResponse>(options, data);
}
