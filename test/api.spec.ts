import {Api} from "../src/lib/api";
import {expect} from "chai";
import {HTTP_METHODS} from "../src/lib/enums";
import {Server} from "../src/lib/server";
import supertest from "supertest";


export default () => {
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
                    '1.0.0': [
                        {
                            method: HTTP_METHODS.GET,
                            path: '/history',
                            handler: (req: any, res: any) => {
                                res.end('working');
                            },
                            middlewares: []
                        }
                    ]
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
                    '1.0.0': [
                        {
                            method: HTTP_METHODS.GET,
                            path: '/history',
                            handler: (req: any, res: any) => {
                                res.end('working');
                            },
                            middlewares: []
                        }
                    ]
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
    });
}
