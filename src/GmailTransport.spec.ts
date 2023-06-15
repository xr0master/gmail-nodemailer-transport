import { createTransport } from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';
import GmailTransport, { Options } from './GmailTransport';

const accessToken: string = '';
const refreshToken: string = '';
const clientId: string = '';
const clientSecret: string = '';

it('should send the mail', async () => {
  return createTransport(
    new GmailTransport(<Options>{
      userId: 'me',
      auth: {
        clientId: clientId,
        clientSecret: clientSecret,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    }),
  )
    .sendMail({
      from: 'sergey@emailjs.com',
      to: 'sergey@emailjs.com',
      subject: 'Gmail Transport HTML Test',
      html: '<!DOCTYPE html><html><body><b>This is HTML content</b></body></html>',
      text: 'This is HTML content',
    })
    .then((info) => {
      expect(info).toBeDefined();
    })
    .catch((error) => {
      throw error;
    });
});

it('should send mail to bcc', async () => {
  return createTransport(
    new GmailTransport(<Options>{
      userId: 'me',
      auth: {
        clientId: clientId,
        clientSecret: clientSecret,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    }),
  )
    .sendMail({
      from: 'sergey@emailjs.com',
      to: 'sergey@emailjs.com',
      bcc: 'xr0master@gmail.com',
      subject: 'Gmail Transport BCC Test',
      html: '<!DOCTYPE html><html><body><b>This is HTML content</b></body></html>',
      text: 'This is HTML content',
    })
    .then((info) => {
      expect(info).toBeDefined();
    })
    .catch((error) => {
      throw error;
    });
});

it('should send mail with embedded attachments as URL', async () => {
  return createTransport(
    new GmailTransport(<Options>{
      auth: {
        accessToken: accessToken,
      },
    }),
  )
    .sendMail({
      from: 'sergey@emailjs.com',
      to: 'Sergey <sergey@emailjs.com>',
      subject: 'Gmail Transport Embedded Image',
      html: '<!DOCTYPE html><html><body><img src="cid:cat" alt="cat"></body></html>',
      attachments: [
        <Attachment>{
          cid: 'cat',
          path: 'https://emailjs-dev-attachments.s3.us-west-2.amazonaws.com/sdk-test/cat.jpg',
        },
      ],
    })
    .then((info) => {
      expect(info).toBeDefined();
    })
    .catch((error) => {
      throw error;
    });
});

it('should send mail with embedded attachments as base64', async () => {
  return createTransport(
    new GmailTransport(<Options>{
      auth: {
        accessToken: accessToken,
      },
    }),
  )
    .sendMail({
      from: 'sergey@emailjs.com',
      to: 'Sergey <sergey@emailjs.com>',
      subject: 'Gmail Transport Embedded Image (Base64)',
      html: '<!DOCTYPE html><html><body><img src="cid:cat" alt="cat"></body></html>',
      attachments: [
        <Attachment>{
          content:
            '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',
          cid: 'cat',
          contentType: 'image/jpeg',
          filename: 'cat.jpg',
          encoding: 'base64',
        },
      ],
    })
    .then((info) => {
      expect(info).toBeDefined();
    })
    .catch((error) => {
      throw error;
    });
});

it(
  'should send mail with 7mb attachments as URL',
  async () => {
    return createTransport(
      new GmailTransport(<Options>{
        auth: {
          accessToken: accessToken,
        },
      }),
    )
      .sendMail({
        from: 'sergey@emailjs.com',
        to: 'Sergey <sergey@emailjs.com>',
        subject: 'Gmail Transport Huge Attachment',
        html: '<!DOCTYPE html><html><body>This is a test email</body></html>',
        attachments: [
          <Attachment>{
            path: 'https://emailjs-dev-attachments.s3.us-west-2.amazonaws.com/sdk-test/VK0IR_Voyage.PDF',
            filename: 'file.pdf',
          },
        ],
      })
      .then((info) => {
        expect(info).toBeDefined();
      })
      .catch((error) => {
        throw error;
      });
  },
  5 * 60 * 1000,
); // 5min

it('should refresh token and send the mail', async () => {
  expect.assertions(1);

  return createTransport(
    new GmailTransport(<Options>{
      userId: 'me',
      auth: {
        clientId: clientId,
        clientSecret: clientSecret,
        accessToken: accessToken + 'wrong',
        refreshToken: refreshToken,
      },
    }),
  )
    .sendMail({
      from: 'sergey@emailjs.com',
      to: 'sergey@emailjs.com',
      subject: 'Gmail Transport HTML Test',
      html: '<!DOCTYPE html><html><body><b>This is HTML content</b></body></html>',
      text: 'This is HTML content',
    })
    .then((info) => {
      expect(info).toBeDefined();
    })
    .catch((error) => {
      throw error;
    });
});

it('should fail with Gmail error', async () => {
  return createTransport(
    new GmailTransport(<Options>{
      auth: {
        accessToken: accessToken + 'wrong',
      },
    }),
  )
    .sendMail({})
    .then(
      (info) => {
        throw info;
      },
      (error) => {
        expect(error).toBeDefined();
      },
    );
});

it('should failed with refreshToken and accessToken', async () => {
  return createTransport(
    new GmailTransport(<Options>{
      userId: 'me',
      auth: {
        clientId: clientId,
        clientSecret: clientSecret,
        accessToken: accessToken + 'wrong',
        refreshToken: refreshToken + 'wrong',
      },
    }),
  )
    .sendMail({
      from: 'sergey@emailjs.com',
      to: 'sergey@emailjs.com',
      subject: 'Gmail Transport HTML Test',
      html: '<!DOCTYPE html><html><body><b>This is HTML content</b></body></html>',
      text: 'This is HTML content',
    })
    .then((info) => {
      throw info;
    })
    .catch((error) => {
      expect(error).toBeDefined();
    });
});
