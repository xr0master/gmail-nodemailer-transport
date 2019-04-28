import {Requestly} from './Requestly';

test ('send post request', (done: Function) => {
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

test ('send post JSON request', (done: Function) => {
  expect.assertions(1);

  return Requestly.postJSON({
    protocol: 'https:',
    hostname: 'httpbin.org',
    path: '/post'
  }, {
    user_id: 'test'
  })
  .then((resolve) => {
    expect(resolve).toBeDefined();
    done();
  }, (error) => {
    throw error;
  });
});
