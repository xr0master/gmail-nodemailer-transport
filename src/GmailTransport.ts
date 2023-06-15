import type { SentMessageInfo, Transport } from 'nodemailer';
import type { Options as OAuth2Options } from 'nodemailer/lib/xoauth2';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';

import { post, postRFC822 } from './services/Requestly';

type MailMessageWithBcc = MailMessage & {
  message: {
    keepBcc: boolean;
  };
};

type DoneCallback = (err: Error | null, info?: SentMessageInfo) => void;

export interface Options {
  auth: OAuth2Options;
  userId?: string;
}

function refreshTokenParams(auth: OAuth2Options) {
  return {
    client_id: auth.clientId!,
    client_secret: auth.clientSecret!,
    refresh_token: auth.refreshToken!,
    grant_type: 'refresh_token',
  };
}

interface GmailError {
  error_description: string;
  error:
    | {
        code: number;
        message: string;
      }
    | string;
}

function getErrorCode(error: GmailError['error']) {
  return typeof error === 'object' && error !== null ? error.code : 0;
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

interface GoAuth2 {
  access_token: string;
  token_type: string;
  id_token: string;
  scope: string;
  expires_in: number;
}

export class GmailTransport implements Transport {
  public name: string = 'GmailTransport';
  public version: string = 'N/A';

  constructor(private options: Options) {}

  private getAccessToken(): Promise<GoAuth2['access_token']> {
    return post<GoAuth2>(
      {
        protocol: 'https:',
        hostname: 'www.googleapis.com',
        path: '/oauth2/v4/token',
      },
      refreshTokenParams(this.options.auth),
    ).then((data) => {
      if (typeof data === 'string') {
        return Promise.reject(data);
      }

      return data.access_token;
    });
  }

  private sendMail(message: Buffer, accessToken: string): Promise<unknown> {
    return postRFC822(
      {
        protocol: 'https:',
        hostname: 'www.googleapis.com',
        path: `/upload/gmail/v1/users/${
          this.options.userId || 'me'
        }/messages/send?uploadType=multipart`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      message.toString(),
    );
  }

  public send(mail: MailMessageWithBcc, done: DoneCallback): void {
    mail.message.keepBcc = true;
    mail.message.build((error, data: Buffer) => {
      if (error) return done(error);
      if (!data) return done(new Error('The email data is corrapted.'));

      this.sendMail(data, this.options.auth.accessToken!).then(
        (message) => {
          done(null, {
            envelope: mail.message.getEnvelope(),
            messageId: mail.message.messageId(),
            accessToken: this.options.auth.accessToken!,
            message: message,
          });
        },
        (err: GmailError) => {
          if (getErrorCode(err.error) === 401 && this.options.auth.refreshToken) {
            this.getAccessToken()
              .then((accessToken: GoAuth2['access_token']) => {
                this.sendMail(data, accessToken).then(
                  (message) => {
                    done(null, {
                      envelope: mail.message.getEnvelope(),
                      messageId: mail.message.messageId(),
                      accessToken: accessToken,
                      message: message,
                    });
                  },
                  (err: GmailError | string) => done(createError(err)),
                );
              })
              .catch((err: GmailError | string) => done(createError(err)));
          } else {
            done(createError(err));
          }
        },
      );
    });
  }
}

export default GmailTransport;
