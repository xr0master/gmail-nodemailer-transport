import {Requestly} from './Requestly';

it ('should send post request', (done) => {
  expect.assertions(1);

  return Requestly.post({
    protocol: 'https:',
    hostname: 'httpbin.org',
    path: '/post'
  }, {
    user_id: 'test'
  })
    .then((resolve) => {
      expect(resolve.form.user_id).toBeDefined();
      done();
    }, (error) => {
      throw error;
    });
});

it ('should send post RFC822 request', (done) => {
  expect.assertions(1);

  return Requestly.postRFC822({
    protocol: 'https:',
    hostname: 'httpbin.org',
    path: '/post'
  }, 'test')
  .then((resolve) => {
    expect(resolve).toBeDefined();
    done();
  }, (error) => {
    throw error;
  });
});
