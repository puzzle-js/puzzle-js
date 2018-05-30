import "mocha";
import {expect} from "chai";
import {GatewayBFF} from "../../src/gatewayBff";
import request from "supertest";
import {IGatewayBFFConfiguration} from "../../src/types";
import {PREVIEW_PARTIAL_QUERY_NAME, RENDER_MODE_QUERY_NAME} from "../../src/config";
import {
    CONTENT_REPLACE_SCRIPT,
    FRAGMENT_RENDER_MODES,
    HTTP_METHODS, HTTP_STATUS_CODE,
    RESOURCE_INJECT_TYPE,
    RESOURCE_LOCATION,
    RESOURCE_TYPE
} from "../../src/enums";
import * as path from "path";
import {IFileResourceAsset} from "../../src/types";

const commonGatewayConfiguration: IGatewayBFFConfiguration = {
    api: [],
    fragments: [],
    name: 'Browsing',
    url: 'http://localhost:4644',
    port: 4644,
    fragmentsFolder: path.join(__dirname, 'fragments')
};

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
                                content(req: any, data: any) {
                                    return {
                                        main: `<div>Rendered Fragment ${data.username}</div>`
                                    };
                                },
                                data(req: any) {
                                    return {
                                        data: {
                                            username: 'ACG'
                                        }
                                    };
                                },
                                placeholder() {
                                    return '';
                                }
                            } as any
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
                                content(req: any, data: any) {
                                    return {
                                        main: `<div>Rendered Fragment ${data.username}</div>`,
                                        another: `<div>another partial</div>`
                                    };
                                },
                                data(req: any) {
                                    return {
                                        data: {
                                            username: 'ACG'
                                        }
                                    };
                                },
                                placeholder() {
                                    return '';
                                }
                            } as any
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
                                content(req: any, data: any) {
                                    return {
                                        main: `<div>Rendered Fragment ${data.username}</div>`
                                    };
                                },
                                data(req: any) {
                                    return {
                                        data: {
                                            username: 'ACG'
                                        }
                                    };
                                },
                                placeholder() {
                                    return '';
                                }
                            }as any
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

    it('should export fragment 404 content in stream mode with header', (done) => {
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
                                content(req: any, data: any) {
                                    return {
                                        main: `<div>Rendered Fragment ${data.username}</div>`
                                    };
                                },
                                data(req: any) {
                                    return {
                                        data:{
                                          username: 'Fragment'
                                        },
                                        $status: 404,
                                        $headers: {
                                            'failure': 'reason',
                                        }
                                    };
                                },
                                placeholder() {
                                    return '';
                                }
                            }as any
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
                    if (err) throw new (err);
                    bff.server.close();
                    expect(res.header['failure']).to.eq('reason');
                    expect(res.body).to.deep.eq({
                        "main": "<div>Rendered Fragment Fragment</div>",
                        '$status': 404,
                        '$headers': {failure: 'reason'}
                    });
                    done();
                });
        });
    });

    it('should export fragment 404 content in stream mode without data', (done) => {
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
                                content(req: any, data: any) {

                                    return {
                                        main: `<div>Rendered Fragment ${data.username}</div>`
                                    };
                                },
                                data(req: any) {
                                    return {
                                        data: {
                                            username: 'test'
                                        },
                                        $status: 404,
                                        $headers: {
                                            'failure': 'reason',
                                            'location': 'https://blabla.com'
                                        }
                                    };
                                },
                                placeholder() {
                                    return '';
                                }
                            }as any
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
                    if (err) throw new (err);
                    bff.server.close();
                    expect(res.header['failure']).to.eq('reason');
                    expect(res.body).to.deep.eq({
                        main: '<div>Rendered Fragment test</div>',
                        '$status': 404,
                        '$headers': {failure: 'reason', location: 'https://blabla.com'}
                    });
                    done();
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
                                content(req: any, data: any) {
                                    return {
                                        main: `<div>Rendered Fragment ${data.username}</div>`
                                    };
                                },
                                data(req: any) {
                                    return {
                                        data: {
                                            username: 'ACG'
                                        }
                                    };
                                },
                                placeholder() {
                                    return '';
                                }
                            }as any
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
                                content(req: any, data: any) {
                                    return {
                                        main: `<div>Rendered Fragment ${data.username}</div>`
                                    };
                                },
                                data(req: any) {
                                    return {
                                        data: {
                                            username: 'ACG'
                                        }
                                    };
                                },
                                placeholder() {
                                    return '';
                                }
                            }as any
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
                                content(req: any, data: any) {
                                    return {
                                        main: `<div>Rendered Fragment ${data.username}</div>`
                                    };
                                },
                                data(req: any) {
                                    return {
                                        data: {
                                            username: 'ACG'
                                        }
                                    };
                                },
                                placeholder() {
                                    return '';
                                }
                            }as any
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
                        '1.0.0': {
                            handler: {
                                test: (req: object, res: any) => {
                                    res.end('working');
                                }
                            },
                            endpoints: [
                                {
                                    middlewares: [],
                                    method: HTTP_METHODS.GET,
                                    path: '/',
                                    controller: 'test'
                                }
                            ]
                        }
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
                        '1.0.0': {
                            handler: {
                                test: (req: object, res: any) => {
                                    res.end('working');
                                }
                            },
                            endpoints: [
                                {
                                    middlewares: [],
                                    method: HTTP_METHODS.GET,
                                    path: '/',
                                    controller: 'test'
                                }
                            ]
                        },
                        '1.0.1': {
                            handler: {
                                test: (req: object, res: any) => {
                                    res.end('working1.0.1');
                                }
                            },
                            endpoints: [
                                {
                                    middlewares: [],
                                    method: HTTP_METHODS.GET,
                                    path: '/',
                                    controller: 'test'
                                }
                            ]
                        }
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
                                content(req: any, data: any) {
                                    return {
                                        main: `<div>Rendered Fragment ${data.username}</div>`
                                    };
                                },
                                data(req: any) {
                                    return {
                                        data: {
                                            username: 'ACG'
                                        }
                                    };
                                },
                                placeholder() {
                                    return 'placeholder';
                                }
                            }as any
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

    it('should respond with middleware', (done) => {
        const bff = new GatewayBFF({
            ...commonGatewayConfiguration,
            fragments: [
                {
                    name: 'product',
                    render: {
                        url: '/',
                        placeholder: true,
                        middlewares: [
                            (req, res, next) => {
                                res.status(HTTP_STATUS_CODE.FORBIDDEN).end('Nope');
                            }
                        ]
                    },
                    testCookie: 'product-cookie',
                    version: '1.0.0',
                    versions: {
                        '1.0.0': {
                            assets: [],
                            dependencies: [],
                            handler: {
                                content(req: any, data: any) {
                                    return {
                                        main: `<div>Rendered Fragment ${data.username}</div>`
                                    };
                                },
                                data(req: any) {
                                    return {
                                        data: {
                                            username: 'ACG'
                                        }
                                    };
                                },
                                placeholder() {
                                    return 'placeholder';
                                }
                            }as any
                        }
                    }
                }
            ]
        });

        bff.init(() => {
            request(commonGatewayConfiguration.url)
                .get('/product')
                .expect(HTTP_STATUS_CODE.FORBIDDEN)
                .end((err, res) => {
                    bff.server.close();
                    expect(res.text).to.eq(`Nope`);
                    done(err);
                });
        });
    });

    it('should respond with placeholder with delay', (done) => {
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
                                content(req: any, data: any) {
                                    return {
                                        main: `<div>Rendered Fragment ${data.username}</div>`
                                    };
                                },
                                data(req: any) {
                                    return {
                                        data: {
                                            username: 'ACG'
                                        }
                                    };
                                },
                                placeholder() {
                                    return 'placeholder';
                                }
                            }as any
                        }
                    }
                }
            ]
        });

        bff.init(() => {
            request(commonGatewayConfiguration.url)
                .get('/product/placeholder')
                .query({delay: 1500})
                .expect(200)
                .end((err, res) => {
                    bff.server.close();
                    expect(res.text).to.eq(`<html><head><title>Browsing - product</title></head><body><div id="product">placeholder</div></body></html>${CONTENT_REPLACE_SCRIPT}<div style="display: none;" id="product-replace"><div>Rendered Fragment ACG</div></div><script>$p('#product', '#product-replace')</script>`);
                    done(err);
                });
        });
    });
});
