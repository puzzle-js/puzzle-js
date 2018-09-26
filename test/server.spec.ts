import "mocha";
import {expect} from "chai";
import {Server} from "../src/server";
import request, {Response} from "supertest";
import * as path from "path";
import {EVENTS, HTTP_METHODS, TRANSFER_PROTOCOLS} from "../src/enums";
import * as fs from "fs";
import {pubsub} from "../src/util";
import {TLS_CERT, TLS_CERT_SET, TLS_KEY, TLS_PASS} from "./core.settings";
import faker from "faker";
import {NO_COMPRESS_QUERY_NAME} from "../src/config";

const TEST_CONFIG = {
  TEST_PORT: 3242,
  TEST_URL: 'http://localhost:' + 3242,
  TEST_STATIC_FOLDER: path.join(__dirname, './static')
};
const server: Server = new Server();

describe('Server', () => {
  beforeEach(() => {
    const cache = require.cache;
    for (let moduleId in cache) {
      delete cache[moduleId];
    }
  });

  afterEach(() => {
    server.close();
  });

  it('should export server module', () => {
    expect(server).to.be.an('object');
  });

  it('should has a listen method for listening port', () => {
    expect(server.listen).to.be.a('function');
  });

  it('should has a method for adding new route', () => {
    expect(server.addRoute).to.be.a('function');
  });

  it('should start listening port', done => {
    const listenHandler = (e: Error) => {
      expect(e).to.eq(undefined);
      done();
    };

    server.listen(TEST_CONFIG.TEST_PORT, listenHandler);
  });

  it('should add route', done => {
    server.addRoute('/test', HTTP_METHODS.GET, (req, res, next) => {
      res.end('OK');
    });

    server.listen(TEST_CONFIG.TEST_PORT, () => {
      request(TEST_CONFIG.TEST_URL).get('/test').expect(200).end((err, res) => {
        expect(res.text).to.eq('OK');
        done();
      });
    });
  });

  it('should add route by event', (done) => {
    pubsub.emit(EVENTS.ADD_ROUTE, {
      path: '/test',
      method: HTTP_METHODS.GET,
      handler: (req: any, res: any, next: any) => {
        res.end('OK');
      }
    });

    server.listen(TEST_CONFIG.TEST_PORT, () => {
      request(TEST_CONFIG.TEST_URL).get('/test').expect(200).end((err, res) => {
        expect(res.text).to.eq('OK');
        done();
      });
    });
  });

  it('should add uses', done => {
    let doneCount = 0;
    server.addUse('/test2', (req, res, next) => {
      res.status(404).end();
      doneCount++;
      if (doneCount === 2) done();
    });
    server.addUse(null, (req, res, next) => {
      res.end();
      doneCount++;
      if (doneCount === 2) done();
    });
    server.listen(TEST_CONFIG.TEST_PORT, () => {
      request(TEST_CONFIG.TEST_URL).get('/').expect(200).end(() => {
      });
      request(TEST_CONFIG.TEST_URL).get('/test2').expect(404).end(() => {
      });
    });
  });

  it('should has a method for serving static files', () => {
    expect(server.setStatic).to.be.a('function');
  });

  it('should serve static files from path', done => {
    const testFileContents = fs.readFileSync(path.join(TEST_CONFIG.TEST_STATIC_FOLDER, './test.js'), 'utf8');
    server.setStatic('/s', TEST_CONFIG.TEST_STATIC_FOLDER);

    server.listen(TEST_CONFIG.TEST_PORT, () => {
      request(TEST_CONFIG.TEST_URL).get('/s/test.js').end((err, res) => {
        expect(res.text).to.eq(testFileContents);
        done();
      });
    });
  });

  it('should serve static files from path globally', done => {
    const testFileContents = fs.readFileSync(path.join(TEST_CONFIG.TEST_STATIC_FOLDER, './test.js'), 'utf8');
    server.setStatic(null, TEST_CONFIG.TEST_STATIC_FOLDER);

    server.listen(TEST_CONFIG.TEST_PORT, () => {
      request(TEST_CONFIG.TEST_URL).get('/test.js').end((err, res) => {
        expect(res.text).to.eq(testFileContents);
        done();
      });
    });
  });

  it('should respond with 200', done => {
    server.addRoute('/healthcheck', HTTP_METHODS.GET, (req, res) => {
      res.status(200).end();
    });

    server.listen(TEST_CONFIG.TEST_PORT, () => {
      request(TEST_CONFIG.TEST_URL).get('/healthcheck').expect(200).end((err, res) => {
        expect(res.status).to.eq(200);
        done();
      });
    });
  });

  it('should add middlewares', done => {

    server.addRoute('/healthcheck', HTTP_METHODS.GET, (req, res) => {
      res.status(200).end('No it is not working');
    }, [(req: any, res: any, next: any) => {
      res.end('it is working');
    }]);

    server.listen(TEST_CONFIG.TEST_PORT, () => {
      request(TEST_CONFIG.TEST_URL).get('/healthcheck').expect(200).end((err, res) => {
        expect(res.text).to.eq('it is working');
        done();
      });
    });
  });

  it('should use h2 protocol when spdy configuration provided', (done) => {
    const http2Server = new Server();
    const response = faker.random.words();
    http2Server.useProtocolOptions({
      passphrase: TLS_PASS,
      key: TLS_CERT_SET.private,
      cert: TLS_CERT_SET.cert,
      protocols: [TRANSFER_PROTOCOLS.H2, TRANSFER_PROTOCOLS.SPDY, TRANSFER_PROTOCOLS.HTTP1]
    });

    http2Server.addRoute('/', HTTP_METHODS.GET, (req, res) => {
      res.end(response);
    });

    http2Server.listen(TEST_CONFIG.TEST_PORT, () => {
      request(TEST_CONFIG.TEST_URL.replace('http', 'https')).get('/').expect(200).end((err, res: Response) => {
        http2Server.close();
        expect(res.text).to.eq(response);
        done(err);
      });
    });
  });

  it('should use https when key cert provided', (done) => {
    const httpsServer = new Server();
    const response = faker.random.words();
    httpsServer.useProtocolOptions({
      passphrase: TLS_PASS,
      key: TLS_CERT_SET.private,
      cert: TLS_CERT_SET.cert,
      protocols: [TRANSFER_PROTOCOLS.HTTP1]
    });

    httpsServer.addRoute('/', HTTP_METHODS.GET, (req, res) => {
      res.end(response);
    });

    httpsServer.listen(TEST_CONFIG.TEST_PORT, () => {
      request(TEST_CONFIG.TEST_URL.replace('http', 'https')).get('/').expect(200).end((err, res: Response) => {
        httpsServer.close();
        expect(res.text).to.eq(response);
        done(err);
      });
    });
  });

  it('should create another server', done => {
    const anotherServer = new Server();

    anotherServer.addRoute('/', HTTP_METHODS.GET, (req, res) => {
      res.end('another');
    });

    server.addRoute('/', HTTP_METHODS.GET, (req, res) => {
      res.end('current');
    });

    server.listen(TEST_CONFIG.TEST_PORT, () => {
      anotherServer.listen(7444, () => {
        request(TEST_CONFIG.TEST_URL).get('/').expect(200).end((err, res) => {
          expect(res.text).to.eq('current');
          request('http://localhost:7444').get('/').expect(200).end((err, res) => {
            expect(res.text).to.eq('another');
            anotherServer.close();
            done();
          });
        });
      });
    });
  });

  it('should disable compression when no compress query is set', (done) => {
    server.addRoute('/lorem.css', HTTP_METHODS.GET, (req, res) => {
      res.send(faker.lorem.paragraphs(50));
    });

    server.listen(TEST_CONFIG.TEST_PORT, () => {
      request(TEST_CONFIG.TEST_URL).get('/lorem.css').query({[NO_COMPRESS_QUERY_NAME]: 'true'}).expect(200).end((err, res) => {
        expect(res.header['content-encoding']).to.not.eq('gzip');
        done();
      });
    });
  });
});
