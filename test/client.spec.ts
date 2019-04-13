import "mocha";
import {expect} from "chai";
import "../src/base";
import {HttpClient} from "../src/client";
import nock from "nock";
import * as faker from "faker";

describe('Http(s) Client', function () {
  it('should create new client instance', function () {
    const client = new HttpClient();

    expect(client).to.be.instanceof(HttpClient);
  });

  it('should send get request and fetch response', async () => {
    const client = new HttpClient();
    client.init('Test');
    const scope = nock('https://trendyol.com');
    scope
      .get('/test')
      .reply(200, 'working');

    const res = await client.get('https://trendyol.com/test', '');
    expect(res.data).to.eq('working');
  });

  it('should send post request and fetch response', async () => {
    const client = new HttpClient();
    client.init('Test');
    const data = {
      test: faker.random.word()
    };
    const scope = nock('https://trendyol.com');
    scope
      .post('/test', data)
      .reply(200, 'working');

    const res = await client.post('https://trendyol.com/test', '', data);
    expect(res.data).to.eq('working');
  });
});
