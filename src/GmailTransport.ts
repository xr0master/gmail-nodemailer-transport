import type {SentMessageInfo, Transport} from 'nodemailer';
import type {Options as OAuth2Options} from 'nodemailer/lib/xoauth2';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';

import {Requestly} from './services/Requestly';

type MailMessageWithBcc = MailMessage & {
  message: {
    keepBcc: boolean
  }
};

interface GoAuth2 {
  access_token: string;
  token_type: string;
  id_token: string;
  scope: string;
  expires_in: number;
}

interface GmailErrorObject {
  code: number;
  message: string;
}

interface GmailError {
  error_description: string;
  error: string | GmailErrorObject;
}

export interface Options {
  auth: OAuth2Options;
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
    if (ge.error === 'invalid_grant') {
      // return a better message instead of 'Bad Request' from Gmail error_description.
      return new Error('Invalid grant. Please reconnect your Gmail account');
    }

    if (ge.error_description) {
      return new Error(ge.error_description);
    }

    if (typeof ge.error === 'object' && ge.error !== null) {
      return new Error(ge.error.message);
    }

    return new Error(<string>(ge.error || ge));
  }

  private getAccessToken(): Promise<string> {
    return Requestly.post({
      protocol: 'https:',
      hostname: 'www.googleapis.com',
      path: '/oauth2/v4/token'
    }, this.refreshTokenParams(this.options.auth))
      .then((data: GoAuth2) => data.access_token);
  }

  private sendMail(message: Buffer, accessToken: string): Promise<any> {
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

  public send(mail: MailMessageWithBcc, done: (err: Error | null, info?: SentMessageInfo) => void): void {
    mail.message.keepBcc = true;
    mail.message.build((error, data: Buffer) => {
      if (error) return done(error);

      this.sendMail(data, this.options.auth.accessToken).then((message) => {
        done(null, {
          envelope: mail.message.getEnvelope(),
          messageId: mail.message.messageId(),
          accessToken: this.options.auth.accessToken,
          message: message
        });
      }, (e: GmailError) => {
        if (e.error && (e.error as GmailErrorObject).code === 401 && this.options.auth.refreshToken) {
          this.getAccessToken().then((accessToken: string) => {
            this.sendMail(data, accessToken).then((message) => {
              done(null, {
                envelope: mail.message.getEnvelope(),
                messageId: mail.message.messageId(),
                accessToken: accessToken,
                message: message
              });
            }).catch((er: GmailError) => done(this.createError(er)));
          }).catch((er: GmailError) => done(this.createError(er)));
        } else {
          done(this.createError(e));
        }
      });
    });
  }
}

export default GmailTransport;
