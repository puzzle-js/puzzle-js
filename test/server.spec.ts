import "mocha";
import {expect} from "chai";
import {Server} from "../src/lib/server";
import request from "supertest";
import * as path from "path";
import {HTTP_METHODS} from "../src/lib/enums";
import * as fs from "fs";
const TEST_CONFIG = {
    TEST_PORT: 3242,
    TEST_URL: 'http://localhost:' + 3242,
    TEST_STATIC_FOLDER: path.join(__dirname, './static')
};
const server: Server = new Server();

describe('Server', function () {
    beforeEach(() => {
        const cache = require.cache;
        for (let moduleId in cache) {
            delete cache[moduleId];
        }
    });

    afterEach(() => {
        server.close();
    });

    it('should export server module', function () {
        expect(server).to.be.an('object');
    });

    it('should has a listen method for listening port', function () {
        expect(server.listen).to.be.a('function');
    });

    it('should has a method for adding new route', function () {
        expect(server.addRoute).to.be.a('function');
    });

    it('should start listening port', function (done) {
        const listenHandler = (e: Error) => {
            expect(e).to.eq(undefined);
            done();
        };

        server.listen(TEST_CONFIG.TEST_PORT, listenHandler);
    });

    it('should add route', function (done) {
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

    it('should add uses', function (done) {
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

    it('should has a method for serving static files', function () {
        expect(server.setStatic).to.be.a('function');
    });

    it('should serve static files from path', function (done) {
        const testFileContents = fs.readFileSync(path.join(TEST_CONFIG.TEST_STATIC_FOLDER, './test.js'), 'utf8');
        server.setStatic('/s', TEST_CONFIG.TEST_STATIC_FOLDER);

        server.listen(TEST_CONFIG.TEST_PORT, () => {
            request(TEST_CONFIG.TEST_URL).get('/s/test.js').end((err, res) => {
                expect(res.text).to.eq(testFileContents);
                done();
            });
        });
    });

    it('should serve static files from path globally', function (done) {
        const testFileContents = fs.readFileSync(path.join(TEST_CONFIG.TEST_STATIC_FOLDER, './test.js'), 'utf8');
        server.setStatic(null, TEST_CONFIG.TEST_STATIC_FOLDER);

        server.listen(TEST_CONFIG.TEST_PORT, () => {
            request(TEST_CONFIG.TEST_URL).get('/test.js').end((err, res) => {
                expect(res.text).to.eq(testFileContents);
                done();
            });
        });
    });

    it('should respond with 200', function (done) {
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

    it('should add middlewares', function (done) {

        server.addRoute('/healthcheck', HTTP_METHODS.GET, (req, res) => {
            res.status(200).end('No it is not working');
        }, [(req: any, res: any, next: any)  => {
            res.end('it is working');
        }]);

        server.listen(TEST_CONFIG.TEST_PORT, () => {
            request(TEST_CONFIG.TEST_URL).get('/healthcheck').expect(200).end((err, res) => {
                expect(res.text).to.eq('it is working');
                done();
            });
        });
    });

    it('should create another server', function (done) {
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
});
