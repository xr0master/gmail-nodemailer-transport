import type {SentMessageInfo, Transport} from 'nodemailer';
import type {Options as OAuth2Options} from 'nodemailer/lib/xoauth2';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';

import {Requestly} from './services/Requestly';

type MailMessageWithBcc = MailMessage & {
  message: {
    keepBcc: boolean
  }
};

type DoneCallback = (err: Error | null, info?: SentMessageInfo) => void;

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

function getErrorCode(error: GmailError['error']) {
  return typeof error === 'object' && error !== null ? error.code : 0;
}

function refreshTokenParams(auth: OAuth2Options) {
  return {
    client_id: auth.clientId,
    client_secret: auth.clientSecret,
    refresh_token: auth.refreshToken,
    grant_type: 'refresh_token'
  };
}

function createError(ge: GmailError | string) {
  if (!(typeof ge === 'object' && ge !== null)) return new Error(ge as string);

  if (ge.error === 'invalid_grant') {
    // return a better message instead of 'Bad Request' from the Gmail error_description.
    return new Error('Invalid grant. Please reconnect your Gmail account');
  }

  if (ge.error_description) {
    return new Error(ge.error_description);
  }

  if (typeof ge.error === 'object' && ge.error !== null) {
    return new Error(ge.error.message);
  }

  return new Error(ge.error as string);
}

export class GmailTransport implements Transport {

  public name: string = 'GmailTransport';
  public version: string = 'N/A';

  constructor(private options: Options) {}

  private getAccessToken(): Promise<string> {
    return Requestly.post({
      protocol: 'https:',
      hostname: 'www.googleapis.com',
      path: '/oauth2/v4/token'
    }, refreshTokenParams(this.options.auth))
      .then((data: GoAuth2) => data.access_token);
  }

  private post(message: Buffer, accessToken: string): Promise<any> {
    return Requestly.postRFC822({
      protocol: 'https:',
      hostname: 'www.googleapis.com',
      path: `/upload/gmail/v1/users/${this.options.userId || 'me'}/messages/send?uploadType=multipart`,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }, message.toString());
  }

  private sendMail(data: Buffer, accessToken: string, mail: MailMessage, done: DoneCallback): Promise<void> {
    return this.post(data, accessToken).then((message) => {
      done(null, {
        envelope: mail.message.getEnvelope(),
        messageId: mail.message.messageId(),
        accessToken: accessToken,
        message: message
      });
    });
  }

  public send(mail: MailMessageWithBcc, done: (err: Error | null, info?: SentMessageInfo) => void): void {
    mail.message.keepBcc = true;
    mail.message.build((error, data: Buffer) => {
      if (error) return done(error);

      this.sendMail(data, this.options.auth.accessToken, mail, done)
        .catch((e: GmailError) => {

          if (getErrorCode(e.error) === 401 && this.options.auth.refreshToken) {
            this.getAccessToken().then((accessToken: string) => {
              this.sendMail(data, accessToken, mail, done)
                .catch((er: GmailError) => done(createError(er)));
            }).catch((er: GmailError) => done(createError(er)));
          }
          else {
            done(createError(e));
          }
      });
    });
  }
}

export default GmailTransport;
