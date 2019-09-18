import {expect} from "chai";
import {Server} from "../src/network";
import request, {Response} from "supertest";
import * as path from "path";
import {EVENTS, HTTP_METHODS} from "../src/enums";
import * as fs from "fs";
import {pubsub} from "../src/util";
import {TLS_CERT_SET, TLS_KEY, TLS_CERT} from "./core.settings";
import faker from "faker";
import {NO_COMPRESS_QUERY_NAME} from "../src/config";
import {ICustomHeader} from "../src/types";

const TEST_CONFIG = {
    TEST_PORT: 3242,
    TEST_URL: 'http://localhost:' + 3242,
    TEST_STATIC_FOLDER: path.join(__dirname, './static')
};

const SERVER_OPTIONS = {
    port: TEST_CONFIG.TEST_PORT
};


describe('Server', () => {
    beforeEach(() => {
        const cache = require.cache;
        for (let moduleId in cache) {
            delete cache[moduleId];
        }
    });

    it('should export server module', () => {
        const server: Server = new Server(SERVER_OPTIONS);
        expect(server).to.be.an('object');
    });

    it('should has a listen method for listening port', () => {
        const server: Server = new Server(SERVER_OPTIONS);
        expect(server.listen).to.be.a('function');
    });

    it('should start listening port', done => {
        const server: Server = new Server(SERVER_OPTIONS);
        const listenHandler = (e: Error) => {
            expect(e).to.eq(undefined);
        };

        server.listen(listenHandler as any);
        server.close(done);
    });

    it('should add route', done => {
        const server: Server = new Server(SERVER_OPTIONS);
        server.handler.addRoute('/test', HTTP_METHODS.GET, (req, res, next) => {
            res.end('OK');
        });

        server.listen(() => {
            request(TEST_CONFIG.TEST_URL).get('/test').expect(200).end((err, res) => {
                expect(res.text).to.eq('OK');
            });
        });
        server.close(done);
    });

    it('should add route by event', (done) => {
        const server: Server = new Server(SERVER_OPTIONS);
        pubsub.emit(EVENTS.ADD_ROUTE, {
            path: '/test',
            method: HTTP_METHODS.GET,
            handler: (req: any, res: any, next: any) => {
                res.end('OK');
            }
        });

        server.listen(() => {
            request(TEST_CONFIG.TEST_URL).get('/test').expect(200).end((err, res) => {
                expect(res.text).to.eq('OK');
            });
        });

        server.close(done);

    });

    it('should add uses', done => {
        const server: Server = new Server(SERVER_OPTIONS);
        let doneCount = 0;
        server.handler.addUse('/test2', (req, res, next) => {
            res.status(404).end();
            doneCount++;
            if (doneCount === 2) done();
        });
        server.handler.addUse(null, (req, res, next) => {
            res.end();
            doneCount++;
            if (doneCount === 2) done();
        });
        server.listen(() => {
            request(TEST_CONFIG.TEST_URL).get('/').expect(200).end(() => {
            });
            request(TEST_CONFIG.TEST_URL).get('/test2').expect(404).end(() => {
            });
        });
        server.close(done);
    });

    it('should has a method for serving static files', () => {
        const server: Server = new Server(SERVER_OPTIONS);
        expect(server.handler.setStatic).to.be.a('function');
    });

    it('should serve static files from path', done => {
        const server: Server = new Server(SERVER_OPTIONS);
        const testFileContents = fs.readFileSync(path.join(TEST_CONFIG.TEST_STATIC_FOLDER, './test.js'), 'utf8');
        server.handler.setStatic('/s', TEST_CONFIG.TEST_STATIC_FOLDER);

        server.listen(() => {
            request(TEST_CONFIG.TEST_URL).get('/s/test.js').end((err, res) => {
                expect(res.text).to.eq(testFileContents);
            });
        });
        server.close(done);
    });

    it('should serve static files from path globally', done => {
        const server: Server = new Server(SERVER_OPTIONS);
        const testFileContents = fs.readFileSync(path.join(TEST_CONFIG.TEST_STATIC_FOLDER, './test.js'), 'utf8');
        server.handler.setStatic(null, TEST_CONFIG.TEST_STATIC_FOLDER);

        server.listen(() => {
            request(TEST_CONFIG.TEST_URL).get('/test.js').end((err, res) => {
                expect(res.text).to.eq(testFileContents);
            });
        });

        server.close(done);

    });

    it('should respond with 200', done => {
        const server: Server = new Server(SERVER_OPTIONS);
        server.handler.addRoute('/healthcheck', HTTP_METHODS.GET, (req, res) => {
            res.status(200).end();
        });

        server.listen(() => {
            request(TEST_CONFIG.TEST_URL).get('/healthcheck').expect(200).end((err, res) => {
                expect(res.status).to.eq(200);
            });
        });

        server.close(done);

    });

    it('should add middlewares', done => {
        const server: Server = new Server(SERVER_OPTIONS);
        server.handler.addRoute('/healthcheck', HTTP_METHODS.GET, (req, res) => {
            res.status(200).end('No it is not working');
        }, [(req: any, res: any, next: any) => {
            res.end('it is working');
        }]);

        server.listen(() => {
            request(TEST_CONFIG.TEST_URL).get('/healthcheck').expect(200).end((err, res) => {
                expect(res.text).to.eq('it is working');
            });
        });
        server.close(done);

    });

    it('should use h1 protocol when h2 configuration provided', (done) => {
        const httpServer = new Server({
            port: TEST_CONFIG.TEST_PORT,
            http2: true
        });
        const response = faker.random.words();

        httpServer.handler.addRoute('/', HTTP_METHODS.GET, (req, res) => {
            res.end(response);
        });

        httpServer.listen(() => {
            request(TEST_CONFIG.TEST_URL).get('/').expect(200).end((err, res: Response) => {
                httpServer.close(done);
                expect((res as any).res.httpVersionMajor).to.eq(1);
                expect(res.text).to.eq(response);
            });
        });
    });

    it('should use secure h1 protocol when h2 secure configuration provided', (done) => {
        const httpsServer = new Server({
            port: TEST_CONFIG.TEST_PORT,
            http2: true,
            https: {
                cert: TLS_CERT,
                key: TLS_KEY
            }
        } as any);
        const response = faker.random.words();

        httpsServer.handler.addRoute('/', HTTP_METHODS.GET, (req, res) => {
            res.end(response);
        });

        httpsServer.listen(() => {
            request(TEST_CONFIG.TEST_URL.replace('http', 'https')).get('/').expect(200).end((err, res: Response) => {
                httpsServer.close(done);
                expect((res as any).res.httpVersionMajor).to.eq(1);
                expect(res.text).to.eq(response);
            });
        });
    });

    it('should use given hostname when hostname configuration provided', (done) => {
        const httpsServer = new Server({
            port: TEST_CONFIG.TEST_PORT,
            hostname: "localhost"
        } as any);
        const response = faker.random.words();

        httpsServer.handler.addRoute('/', HTTP_METHODS.GET, (req, res) => {
            res.end(response);
        });

        httpsServer.listen(() => {
            request("http://localhost:" + TEST_CONFIG.TEST_PORT).get('/').expect(200).end((err, res: Response) => {
                httpsServer.close(done);
                expect((res as any).res.httpVersionMajor).to.eq(1);
                expect(res.text).to.eq(response);
            });
        });
    });

    it('should use https when key cert provided', (done) => {
        const server: Server = new Server(SERVER_OPTIONS);
        const httpsServer = new Server({
            port: TEST_CONFIG.TEST_PORT,
            https: {
                allowHTTP1: true,
                key:  TLS_CERT_SET.private,
                cert: TLS_CERT_SET.cert
            }
        });
        const response = faker.random.words();
        httpsServer.handler.addRoute('/', HTTP_METHODS.GET, (req, res) => {
            res.end(response);
        });

        httpsServer.listen(() => {
            request(TEST_CONFIG.TEST_URL.replace('http', 'https')).get('/').expect(200).end((err, res: Response) => {
                httpsServer.close();
                expect(res.text).to.eq(response);
            });
        });

        httpsServer.close(done);
    });

    it('should create another server', done => {
        const server: Server = new Server(SERVER_OPTIONS);
        const anotherServer = new Server({
            port: 7444
        });

        anotherServer.handler.addRoute('/', HTTP_METHODS.GET, (req, res) => {
            res.end('another');
        });

        server.handler.addRoute('/', HTTP_METHODS.GET, (req, res) => {
            res.end('current');
        });

        server.listen(() => {
            anotherServer.listen( () => {
                request(TEST_CONFIG.TEST_URL).get('/').expect(200).end((err, res) => {
                    expect(res.text).to.eq('current');
                    request('http://localhost:7444').get('/').expect(200).end((err, res) => {
                        expect(res.text).to.eq('another');
                        anotherServer.close(() => {});
                        server.close(done);
                    });
                });
            });
        });
    });

    it('should disable compression when no compress query is set', (done) => {
        const server: Server = new Server(SERVER_OPTIONS);
        server.handler.addRoute('/lorem.css', HTTP_METHODS.GET, (req, res) => {
            res.send(faker.lorem.paragraphs(50));
        });

        server.listen(() => {
            request(TEST_CONFIG.TEST_URL).get('/lorem.css').query({[NO_COMPRESS_QUERY_NAME]: 'true'}).expect(200).end((err, res) => {
                expect(res.header['content-encoding']).to.not.eq('gzip');
            });
        });
        server.close(done);
    });

    it('should add custom headers', (done) => {
        const server: Server = new Server(SERVER_OPTIONS);
        const customHeaders: ICustomHeader[] = [
            {key: "k1", value: "v1"},
            {key: "k2", value: "v2"},
            {key: "k3", value: "v3"},
            {key: "k4", value: 4},
            {key: "k5", value: 5},
        ];
        server.handler.addCustomHeaders(customHeaders);
        server.listen(() => {
            request(TEST_CONFIG.TEST_URL).get('/lorem.css').query({[NO_COMPRESS_QUERY_NAME]: 'true'}).expect(200).end((err, res) => {
                customHeaders.forEach((customHeader) => {
                    expect(res.header[customHeader.key]).to.eq(customHeader.value.toString());
                });
            });
        });
        server.close(done);
    });

    it('should add custom headers from env', (done) => {
        const server: Server = new Server(SERVER_OPTIONS);
        const tmpEnv = process.env;
        const env: any = {
            v1: 'v1envval',
            v2: 'v2envval'
        };
        const customHeaders: ICustomHeader[] = [
            {key: "k1", value: "v1", isEnv: true},
            {key: "k2", value: "v2", isEnv: true},
        ];
        process.env = env;
        server.handler.addCustomHeaders(customHeaders);
        server.listen(() => {
            request(TEST_CONFIG.TEST_URL).get('/lorem.css').query({[NO_COMPRESS_QUERY_NAME]: 'true'}).expect(200).end((err, res) => {
                customHeaders.forEach((customHeader) => {
                    expect(res.header[customHeader.key]).to.eq(env[customHeader.value].toString());
                });
                process.env = tmpEnv;
            });
        });
        server.close(done);
    });

});
