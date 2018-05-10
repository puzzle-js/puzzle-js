import "mocha";
import {expect} from "chai";
import {GatewayBFF} from "../../src/gateway";
import request from "supertest";
import {IGatewayBFFConfiguration} from "../../src/gateway";
import {PREVIEW_PARTIAL_QUERY_NAME, RENDER_MODE_QUERY_NAME} from "../../src/config";
import {
    FRAGMENT_RENDER_MODES,
    HTTP_METHODS,
    RESOURCE_INJECT_TYPE,
    RESOURCE_LOCATION,
    RESOURCE_TYPE
} from "../../src/enums";
import * as path from "path";
import {IFileResourceAsset} from "../../src/resourceFactory";

const commonGatewayConfiguration: IGatewayBFFConfiguration = {
    api: [],
    fragments: [],
    name: 'Browsing',
    url: 'http://localhost:4644',
    port: 4644,
    fragmentsFolder: path.join(__dirname, 'fragments')
};

export default () => {
    describe('BFF', () => {
        it('should create new gateway instance', () => {
            const bff = new GatewayBFF(commonGatewayConfiguration);

            expect(bff).to.be.instanceOf(GatewayBFF);
        });

        it('it should respond 200 from healthcheck path when gateway is ready', (done) => {
            const bff = new GatewayBFF(commonGatewayConfiguration);

            bff.init(() => {
                request(commonGatewayConfiguration.url)
                    .get('/healthcheck')
                    .expect(200).end((err) => {
                    bff.server.close();
                    done(err);
                });
            });
        });

        it('it should export configuration from / when gateway is ready', (done) => {
            const bff = new GatewayBFF(commonGatewayConfiguration);

            bff.init(() => {
                request(commonGatewayConfiguration.url)
                    .get('/')
                    .expect(200).end((err, res) => {
                    expect(res.body).to.haveOwnProperty('hash');
                    bff.server.close();
                    done(err);
                });
            });
        });

        it('should export fragment content in preview mode', (done) => {
            const bff = new GatewayBFF({
                ...commonGatewayConfiguration,
                fragments: [
                    {
                        name: 'product',
                        render: {
                            url: '/'
                        },
                        testCookie: 'product-cookie',
                        version: '1.0.0',
                        versions: {
                            '1.0.0': {
                                assets: [
                                    {
                                        name: 'bundle',
                                        location: RESOURCE_LOCATION.CONTENT_END,
                                        type: RESOURCE_TYPE.JS,
                                        fileName: 'bundle.min.js',
                                        injectType: RESOURCE_INJECT_TYPE.EXTERNAL
                                    }
                                ] as IFileResourceAsset[],
                                dependencies: [],
                                handler: {
                                    content(req, data) {
                                        return {
                                            main: `<div>Rendered Fragment ${data.username}</div>`
                                        };
                                    },
                                    data(req) {
                                        return {
                                            username: 'ACG'
                                        };
                                    },
                                    placeholder() {
                                        return '';
                                    }
                                }
                            }
                        }
                    }
                ]
            });

            bff.init(() => {
                request(commonGatewayConfiguration.url)
                    .get('/product/')
                    .expect(200)
                    .end((err, res) => {
                        bff.server.close();
                        expect(res.text).to.eq(`<html><head><title>Browsing - product</title></head><body><div id="product"><div>Rendered Fragment ACG</div></div><script puzzle-asset="bundle" src="/product/static/bundle.min.js" type="text/javascript"></script></body></html>`);
                        done(err);
                    });
            });
        });

        it('should export fragment content in preview mode with desired partial', (done) => {
            const bff = new GatewayBFF({
                ...commonGatewayConfiguration,
                fragments: [
                    {
                        name: 'product',
                        render: {
                            url: '/'
                        },
                        testCookie: 'product-cookie',
                        version: '1.0.0',
                        versions: {
                            '1.0.0': {
                                assets: [
                                    {
                                        name: 'bundle',
                                        location: RESOURCE_LOCATION.CONTENT_END,
                                        type: RESOURCE_TYPE.JS,
                                        fileName: 'bundle.min.js',
                                        injectType: RESOURCE_INJECT_TYPE.EXTERNAL
                                    }
                                ] as IFileResourceAsset[],
                                dependencies: [],
                                handler: {
                                    content(req, data) {
                                        return {
                                            main: `<div>Rendered Fragment ${data.username}</div>`,
                                            another: `<div>another partial</div>`
                                        };
                                    },
                                    data(req) {
                                        return {
                                            username: 'ACG'
                                        };
                                    },
                                    placeholder() {
                                        return '';
                                    }
                                }
                            }
                        }
                    }
                ]
            });

            bff.init(() => {
                request(commonGatewayConfiguration.url)
                    .get('/product/')
                    .query({[PREVIEW_PARTIAL_QUERY_NAME]: 'another'})
                    .expect(200)
                    .end((err, res) => {
                        bff.server.close();
                        expect(res.text).to.eq(`<html><head><title>Browsing - product</title></head><body><div id="product"><div>another partial</div></div><script puzzle-asset="bundle" src="/product/static/bundle.min.js" type="text/javascript"></script></body></html>`);
                        done(err);
                    });
            });
        });

        it('should export fragment content in stream mode', (done) => {
            const bff = new GatewayBFF({
                ...commonGatewayConfiguration,
                fragments: [
                    {
                        name: 'product',
                        render: {
                            url: '/'
                        },
                        testCookie: 'product-cookie',
                        version: '1.0.0',
                        versions: {
                            '1.0.0': {
                                assets: [],
                                dependencies: [],
                                handler: {
                                    content(req, data) {
                                        return {
                                            main: `<div>Rendered Fragment ${data.username}</div>`
                                        };
                                    },
                                    data(req) {
                                        return {
                                            username: 'ACG'
                                        };
                                    },
                                    placeholder() {
                                        return '';
                                    }
                                }
                            }
                        }
                    }
                ]
            });

            bff.init(() => {
                request(commonGatewayConfiguration.url)
                    .get('/product/')
                    .query({[RENDER_MODE_QUERY_NAME]: FRAGMENT_RENDER_MODES.STREAM})
                    .expect(200)
                    .end((err, res) => {
                        bff.server.close();
                        expect(res.body).to.deep.eq({
                            main: '<div>Rendered Fragment ACG</div>'
                        });
                        done(err);
                    });
            });
        });

        it('should export static files', (done) => {
            const bff = new GatewayBFF({
                ...commonGatewayConfiguration,
                fragments: [
                    {
                        name: 'product',
                        render: {
                            url: '/'
                        },
                        testCookie: 'product-cookie',
                        version: '1.0.0',
                        versions: {
                            '1.0.0': {
                                assets: [
                                    {
                                        name: 'Product Bundle',
                                        fileName: 'bundle.min.css',
                                        location: RESOURCE_LOCATION.CONTENT_START,
                                        injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
                                        type: RESOURCE_TYPE.CSS
                                    }
                                ],
                                dependencies: [],
                                handler: {
                                    content(req, data) {
                                        return {
                                            main: `<div>Rendered Fragment ${data.username}</div>`
                                        };
                                    },
                                    data(req) {
                                        return {
                                            username: 'ACG'
                                        };
                                    },
                                    placeholder() {
                                        return '';
                                    }
                                }
                            }
                        }
                    }
                ]
            });

            bff.init(() => {
                request(commonGatewayConfiguration.url)
                    .get('/product/static/bundle.min.css')
                    .expect(200)
                    .end((err, res) => {
                        bff.server.close();

                        expect(res.text).to.include('version1.0.0');
                        done(err);
                    });
            });
        });

        it('should export static files with cookievalue', (done) => {
            const bff = new GatewayBFF({
                ...commonGatewayConfiguration,
                fragments: [
                    {
                        name: 'product',
                        render: {
                            url: '/'
                        },
                        testCookie: 'product-cookie',
                        version: '1.0.0',
                        versions: {
                            '1.0.0': {
                                assets: [
                                    {
                                        name: 'Product Bundle',
                                        fileName: 'bundle.min.css',
                                        location: RESOURCE_LOCATION.CONTENT_START,
                                        injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
                                        type: RESOURCE_TYPE.CSS
                                    }
                                ],
                                dependencies: [],
                                handler: {
                                    content(req, data) {
                                        return {
                                            main: `<div>Rendered Fragment ${data.username}</div>`
                                        };
                                    },
                                    data(req) {
                                        return {
                                            username: 'ACG'
                                        };
                                    },
                                    placeholder() {
                                        return '';
                                    }
                                }
                            },
                            '1.0.1': {
                                assets: [
                                    {
                                        name: 'Product Bundle',
                                        fileName: 'bundle.min.css',
                                        location: RESOURCE_LOCATION.CONTENT_START,
                                        injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
                                        type: RESOURCE_TYPE.CSS
                                    }
                                ],
                                dependencies: [],
                                handler: {
                                    content(req, data) {
                                        return {
                                            main: `<div>Rendered Fragment ${data.username}</div>`
                                        };
                                    },
                                    data(req) {
                                        return {
                                            username: 'ACG'
                                        };
                                    },
                                    placeholder() {
                                        return '';
                                    }
                                }
                            }
                        }
                    }
                ]
            });

            bff.init(() => {
                request(commonGatewayConfiguration.url)
                    .get('/product/static/bundle.min.css')
                    .set('Cookie', `product-cookie=1.0.1`)
                    .expect(200)
                    .end((err, res) => {
                        bff.server.close();

                        expect(res.text).to.include('version1.0.1');
                        done(err);
                    });
            });
        });

        it('should export api endpoints', (done) => {
            const bff = new GatewayBFF({
                ...commonGatewayConfiguration,
                api: [
                    {
                        name: 'test',
                        liveVersion: '1.0.0',
                        testCookie: 'test_v',
                        versions: {
                            '1.0.0': [
                                {
                                    middlewares: [],
                                    method: HTTP_METHODS.GET,
                                    path: '/',
                                    handler: (req: object, res: any) => {
                                        res.end('working');
                                    }
                                }
                            ]
                        }
                    }
                ]
            });

            bff.init(() => {
                request(commonGatewayConfiguration.url)
                    .get('/api/test/')
                    .expect(200)
                    .end((err, res) => {
                        bff.server.close();
                        expect(res.text).to.eq('working');
                        done(err);
                    });
            });
        });

        it('should export api endpoints with test cookie', (done) => {
            const bff = new GatewayBFF({
                ...commonGatewayConfiguration,
                api: [
                    {
                        name: 'test',
                        liveVersion: '1.0.0',
                        testCookie: 'test_v',
                        versions: {
                            '1.0.0': [
                                {
                                    middlewares: [],
                                    method: HTTP_METHODS.GET,
                                    path: '/',
                                    handler: (req: object, res: any) => {
                                        res.end('working');
                                    }
                                }
                            ],
                            '1.0.1': [
                                {
                                    middlewares: [],
                                    method: HTTP_METHODS.GET,
                                    path: '/',
                                    handler: (req: object, res: any) => {
                                        res.end('working1.0.1');
                                    }
                                }
                            ]
                        }
                    }
                ]
            });

            bff.init(() => {
                request(commonGatewayConfiguration.url)
                    .get('/api/test/')
                    .set('Cookie', `test_v=1.0.1`)
                    .expect(200)
                    .end((err, res) => {
                        bff.server.close();
                        expect(res.text).to.eq('working1.0.1');
                        done(err);
                    });
            });
        });

        it('should respond with placeholder', (done) => {
            const bff = new GatewayBFF({
                ...commonGatewayConfiguration,
                fragments: [
                    {
                        name: 'product',
                        render: {
                            url: '/',
                            placeholder: true
                        },
                        testCookie: 'product-cookie',
                        version: '1.0.0',
                        versions: {
                            '1.0.0': {
                                assets: [],
                                dependencies: [],
                                handler: {
                                    content(req, data) {
                                        return {
                                            main: `<div>Rendered Fragment ${data.username}</div>`
                                        };
                                    },
                                    data(req) {
                                        return {
                                            username: 'ACG'
                                        };
                                    },
                                    placeholder() {
                                        return 'placeholder';
                                    }
                                }
                            }
                        }
                    }
                ]
            });

            bff.init(() => {
                request(commonGatewayConfiguration.url)
                    .get('/product/placeholder')
                    .expect(200)
                    .end((err, res) => {
                        bff.server.close();
                        expect(res.text).to.eq(`placeholder`);
                        done(err);
                    });
            });
        });
    });
}
