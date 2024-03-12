import {expect} from "chai";
import "../src/base";
import {HttpClient} from "../src/client";
import nock from "nock";

describe('Http(s) Client', function () {
    it('should create new client instance', function () {
        const client = new HttpClient();

        expect(client).to.be.instanceof(HttpClient);
    });

    it('should send get request and fetch response', async () => {
        const client = new HttpClient();
        const scope = nock('https://trendyol.com');
        scope
            .get('/test')
            .reply(200, {data: 'working'});

        const res = await client.get('https://trendyol.com/test', '');
        expect(res.data).to.deep.eq({data: 'working'});
    });
});