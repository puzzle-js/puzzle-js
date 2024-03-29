import { Api } from "../src/api";
import { expect } from "chai";
import { HTTP_METHODS } from "../src/enums";
import { Server } from "../src/network";
import sinon from "sinon";
import supertest from "supertest";
import faker from "faker";

describe('Api',  () => {
  it('should create a new api instance', () => {
    const api = new Api({
      liveVersion: '1.0.0',
      name: 'browsing',
      testCookie: 'browsing-version',
      versions: {}
    });

    expect(api).to.be.instanceOf(Api);
  });

  it('should create a new api instance with endpoints', () => {
    const api = new Api({
      liveVersion: '1.0.0',
      name: 'browsing',
      testCookie: 'browsing-version',
      versions: {
        '1.0.0': {
          handler: {
            'test': (req: any, res: any) => {
              res.end('working');
            }
          },
          endpoints: [
            {
              method: HTTP_METHODS.GET,
              path: '/history',
              controller: 'test',
              middlewares: []
            }
          ]
        }
      }
    });

    expect(api).to.be.instanceOf(Api);
  });

  it('should respond with endpoint handlers', (done) => {
    const server = new Server();

    const api = new Api({
      liveVersion: '1.0.0',
      name: 'browsing',
      testCookie: 'browsing-version',
      versions: {
        '1.0.0': {
          handler: {
            'test': (req: any, res: any) => {
              res.end('working');
            }
          },
          endpoints: [
            {
              method: HTTP_METHODS.GET,
              path: '/history',
              controller: 'test',
              middlewares: []
            }
          ]
        }
      }
    });

    api.registerEndpoints(server);


    supertest(server.handler.getApp())
      .get('/api/browsing/history')
      .expect(200)
      .end((err, res) => {
        expect(res.text).to.eq('working');
        done();
      });
  });

  it('should respond with endpoint handlers', (done) => {
    const server = new Server();

    const api = new Api({
      liveVersion: '1.0.0',
      name: 'browsing',
      testCookie: 'browsing-version',
      versions: {
        '1.0.0': {
          handler: {
            'test': (req: any, res: any) => {
              res.end('working');
            }
          },
          endpoints: [
            {
              method: HTTP_METHODS.GET,
              path: '/history',
              controller: 'test',
              middlewares: []
            }
          ]
        },
        '1.0.1': {
          handler: {
            'test': (req: any, res: any) => {
              res.end('working1.0.1');
            }
          },
          endpoints: [
            {
              method: HTTP_METHODS.GET,
              path: '/history',
              controller: 'test',
              middlewares: []
            }
          ]
        }
      }
    });

    api.registerEndpoints(server);


    supertest(server.handler.getApp())
      .get('/api/browsing/history')
      .set('Cookie', `browsing-version=1.0.1`)
      .expect(200)
      .end((err, res) => {
        expect(res.text).to.eq('working1.0.1');
        done();
      });
  });

  it('should resolve handler when not provided', () => {
    expect(() => {
      const api = new Api({
        liveVersion: '1.0.0',
        name: 'browsing',
        testCookie: 'browsing-version',
        versions: {
          '1.0.0': {
            endpoints: [
              {
                method: HTTP_METHODS.GET,
                path: '/history',
                controller: 'test',
                middlewares: []
              }
            ]
          }
        }
      });
    }).to.throw();
  });

  it('should respond with originalurl in headers', (done) => {
    const server = new Server();
    const firstParam = faker.random.number();
    const secondParam = faker.random.number();

    const handler = {
      'test': (req: any, res: any) => {
        expect(req.headers.originalurl).to.eq(`/${firstParam}/${secondParam}`);
        expect(req.headers.originalpath).to.eq(`/${firstParam}/${secondParam}`);
        res.end('working');
        done();
      }
    };



    const api = new Api({
      liveVersion: '1.0.0',
      name: 'browsing',
      testCookie: 'browsing-version',
      versions: {
        '1.0.0': {
          handler,
          endpoints: [
            {
              method: HTTP_METHODS.GET,
              path: '/*',
              controller: 'test',
              middlewares: []
            }
          ]
        }
      }
    });

    api.registerEndpoints(server);


    supertest(server.handler.getApp())
      .get(`/api/browsing/${firstParam}/${secondParam}`)
      .expect(200)
      .end(() => {
      });
  });

  it('should forward to next middleware when "useExpressErrorForwarding" is set', (done) => {
    const consoleErrorSpy = sinon.spy(console, 'error');
    const server = new Server();

    const api = new Api({
      liveVersion: '1.0.0',
      name: 'browsing',
      testCookie: 'browsing-version',
      versions: {
        '1.0.0': {
          handler: {
            test: (req: any, res: any) => {
              throw new Error("error");
            },
          },
          endpoints: [
            {
              method: HTTP_METHODS.GET,
              path: '/history',
              controller: 'test',
              middlewares: [],
              useExpressErrorForwarding: true,
            },
          ],
        },
      },
    });

    api.registerEndpoints(server);

    supertest(server.handler.getApp())
      .get('/api/browsing/history')
      .expect(500)
      .end((err, res) => {
        expect(consoleErrorSpy.called).to.be.false;

        consoleErrorSpy.restore();
        done();
      });
  });

  it('should not forward to next middleware when "useExpressErrorForwarding" is not set', (done) => {
    const consoleErrorSpy = sinon.spy(console, 'error');
    const consoleLogSpy = sinon.spy(console, 'log');
    const server = new Server();

    const api = new Api({
      liveVersion: '1.0.0',
      name: 'browsing',
      testCookie: 'browsing-version',
      versions: {
        '1.0.0': {
          handler: {
            test: (req: any, res: any) => {
              throw new Error("error");
            },
          },
          endpoints: [
            {
              method: HTTP_METHODS.GET,
              path: '/history',
              controller: 'test',
              middlewares: [],
              useExpressErrorForwarding: false,
            },
          ],
        },
      },
    });

    api.registerEndpoints(server);

    supertest(server.handler.getApp())
      .get('/api/browsing/history')
      .expect(500)
      .end((err, res) => {
        expect(consoleErrorSpy.called).to.be.true;
        expect(consoleErrorSpy.firstCall.args[0]).to.include("PUZZLE_BFF_HANDLER_UNHANDLED_ERROR");
        expect(consoleLogSpy.firstCall.args[0]).to.be.instanceOf(Error);

        consoleErrorSpy.restore();
        consoleLogSpy.restore();
        done();
      });
  });
});

