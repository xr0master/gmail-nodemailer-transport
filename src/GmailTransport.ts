import {Transport} from 'nodemailer';
import {Requestly} from './services/Requestly';
import {Options as OAuth2Options} from 'nodemailer/lib/xoauth2';

interface GoAuth2 {
  access_token: string;
  token_type: string;
  id_token: string;
  scope: string;
  expires_in: number;
}

interface GmailError {
  error_description: string;
  error: string | Error;
}

export interface Options {
  auth: OAuth2Options;
  autoRefreshToken?: boolean;
  userId?: string;
}

export class GmailTransport implements Transport {

  public name: string = 'GmailTransport';
  public version: string = 'N/A';

  constructor(private options: Options) {}

  private messageToBase64Raw(message: Buffer): string {
    return message.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private refreshTokenParams(auth: OAuth2Options): Object {
    return {
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      refresh_token: auth.refreshToken,
      grant_type: 'refresh_token'
    };
  }

  private createError(ge: GmailError): Error {
    if (ge.error_description) {
      return new Error(ge.error_description);
    }

    if (ge.error instanceof Error) {
      return ge.error;
    }

    return new Error(ge.error);
  }

  private getAccessToken(): Promise<string> {
    if (!this.options.autoRefreshToken) {
      return Promise.resolve(this.options.auth.accessToken);
    }

    return Requestly.post({
      protocol: 'https:',
      hostname: 'www.googleapis.com',
      path: '/oauth2/v4/token'
    }, this.refreshTokenParams(this.options.auth))
      .then((data: GoAuth2) => data.access_token);
  }

  private sendMail(message: any, accessToken: string): Promise<any> {
    return Requestly.postJSON({
      protocol: 'https:',
      hostname: 'www.googleapis.com',
      path: `/gmail/v1/users/${this.options.userId || 'me'}/messages/send`,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }, {
      raw: this.messageToBase64Raw(message)
    });
  }

  public send(mail: any, done: Function): void {
    this.getAccessToken().then((accessToken: string) => {
      mail.message.keepBcc = true;
      mail.message.build((error, data: Buffer) => {
        if (error) return done(error);

        this.sendMail(data, accessToken)
          .then((message) => {
            done(null, {
              envelope: mail.message.getEnvelope(),
              messageId: mail.message.messageId(),
              accessToken: accessToken,
              message: message
            });
          })
          .catch((e: GmailError) => done(this.createError(e)));
      });
    }).catch((e: GmailError) => done(this.createError(e)));
  }
}
