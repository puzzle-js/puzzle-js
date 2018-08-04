import {Api} from "../src/api";
import {expect} from "chai";
import {HTTP_METHODS} from "../src/enums";
import {Server} from "../src/server";
import supertest from "supertest";
import {FragmentBFF} from "../src/fragment";
import faker from "faker";

describe('Api', function () {
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


    supertest(server.app)
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


    supertest(server.app)
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

    const handler = {
      'test': (req: any, res: any) => {
        expect(req.headers.originalurl).to.eq(`/${firstParam}/${secondParam}`);
        console.log(req.path);
        res.end('working');
        done();
      }
    };

    const firstParam = faker.random.word();
    const secondParam = faker.random.number();

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


<<<<<<< HEAD
    supertest(server.app)
      .get(`/api/browsing/${firstParam}/${secondParam}`)
      .expect(200)
      .end(() => {
      });
  });
=======
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
>>>>>>> bd34369b87f7ac0f3b0aeeae9f08e0e5b4fbde59
});

