gmail-nodemailer-transport
============================

## Intro
The custom transport plugin that allows to send email using Nodemailer via [Gmail](https://developers.google.com/gmail/api/)

## Why?
With the help of the Gmail API it is possible to use the send scope and Nodemailer v4+. The plugin is very small, optimized and written in TypeScript

## Support the project
If you like to use this module please click the star button - it is very motivating.

## Quick Start
Install gmail-nodemailer-transport using [npm](https://www.npmjs.com/):

``` bash
$ npm install gmail-nodemailer-transport --save
```

## Documentation
[Nodemailer](https://nodemailer.com/message/#common-fields) common fields are supported and replyTo

## Examples

__send simple email by accessToken__
``` js
  'use strict';
  const nodemailer = require('nodemailer');
  const GmailTransport = require('gmail-nodemailer-transport');

  let transporter = nodemailer.createTransport(new GmailTransport({
    userId: 'my-address@gmail.com',
    auth: {
      accessToken: 'ya29.Glv5BvE5y-access-token'
    }
  }));

  transporter.sendMail({
    from: 'email@gmail.com',
    to: 'recipient@test.com',
    replyTo: 'reply-to@example.com',
    subject: 'Gmail Transport',
    text: 'This is text content'
  }).then((info) => {
    console.log('SUCCESS');
  }).catch((error) => {
    console.log('Something is wrong');
  });
```

__send simple email by refreshToken__
``` js
  'use strict';
  const nodemailer = require('nodemailer');
  const GmailTransport = require('gmail-nodemailer-transport');

  let transporter = nodemailer.createTransport(new GmailTransport({
    userId: 'my-address@gmail.com',
    autoRefreshToken: true,
    auth: {
      clientId: 'clien-id.apps.googleusercontent.com',
      clientSecret: 'clint-secret',
      refreshToken: '1/EAATBaMn-refresh-token'
    }
  }));

  transporter.sendMail({
    from: 'email@gmail.com',
    to: 'recipient@test.com',
    replyTo: 'reply-to@example.com',
    subject: 'Gmail Transport',
    text: 'This is text content'
  }).then((info) => {
    console.log('SUCCESS');
  }).catch((error) => {
    console.log('Something is wrong');
  });
```

__send attachment and add to content__
``` js
  'use strict';
  const nodemailer = require('nodemailer');
  const GmailTransport = require('gmail-nodemailer-transport');

  let transporter = nodemailer.createTransport(new GmailTransport({
    userId: 'my-address@gmail.com',
    auth: {
      accessToken: 'ya29.Glv5BvE5y-access-token'
    }
  }));

  transporter.sendMail({
    from: 'email@example.com',
    to: 'recipient@test.com',
    replyTo: 'reply-to@example.com',
    subject: 'Gmail Transport',
    html: '<!DOCTYPE html><html><body><img src="cid:attachment" alt="attachment"></body></html>',
    attachments: [{
      content: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAA...', // base64 content
      cid: 'attachment',
      contentType: 'image/jpeg',
      filename: 'attachment.jpg',
      encoding: 'base64'
    }]
  }).then((info) => {
    console.log('SUCCESS');
  }).catch((error) => {
    console.log('Something is wrong');
  });
```

## License

[MIT](./LICENSE)
