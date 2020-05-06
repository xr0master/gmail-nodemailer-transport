import {request, RequestOptions} from 'https';
import {ClientRequest, IncomingMessage} from 'http';

export namespace Requestly {

  function parseJSON(rawData: string): Object | string {
    try {
      return JSON.parse(rawData);
    } catch (ignore) {
      return rawData;
    }
  }

  function makeParams(params: Object): string {
    return Object.keys(params)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
  }

  function sendRequest(options: RequestOptions, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let req: ClientRequest = request(options, (res: IncomingMessage) => {
        let chunks: Array<any> = [];

        res.on('data', (chunk) => chunks.push(chunk));

        res.on('end', () => {
          let answer: any = parseJSON(Buffer.concat(chunks).toString());

          if (res.statusCode === 200) {
            resolve(answer);
          } else {
            reject(answer);
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
    });
  }

  export function post(options: RequestOptions, params?: Object): Promise<any> {
    let postData: string = makeParams(params);

    options.method = 'POST';
    options.headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Content-Length': Buffer.byteLength(postData)
    };

    return sendRequest(options, postData);
  }

  export function postRFC822(options: RequestOptions, data: string): Promise<any> {
    options.method = 'POST';
    options.headers = Object.assign(options.headers || {}, {
      'Content-Type': 'message/rfc822',
      'Content-Length': Buffer.byteLength(data)
    });

    return sendRequest(options, data);
  }
}
