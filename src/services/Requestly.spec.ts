import { post, postRFC822 } from './Requestly';

interface HTTPBin {
  form?: {
    id: string;
  };
  data?: string;
}

it('should send post request', async () => {
  return post<HTTPBin>(
    {
      protocol: 'https:',
      hostname: 'httpbin.org',
      path: '/post',
    },
    {
      id: 'test',
    },
  ).then(
    (data) => {
      expect((data as HTTPBin).form!.id).toEqual('test');
    },
    (error) => {
      throw error;
    },
  );
});

it('should send post RFC822 request', async () => {
  return postRFC822<HTTPBin>(
    {
      protocol: 'https:',
      hostname: 'httpbin.org',
      path: '/post',
    },
    'test',
  ).then(
    (data) => {
      expect((data as HTTPBin).data).toEqual('test');
    },
    (error) => {
      throw error;
    },
  );
});
