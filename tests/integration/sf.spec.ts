import {expect} from "chai";
import {Storefront} from "../../src/storefront";
import request from "supertest";
import {createGateway} from "../mock/mock";
import {DEFAULT_POLLING_INTERVAL, RENDER_MODE_QUERY_NAME} from "../../src/config";
import {EVENTS, FRAGMENT_RENDER_MODES, TRANSFER_PROTOCOLS} from "../../src/enums";
import nock from "nock";
import {IStorefrontConfig} from "../../src/types";
import faker from "faker";
import {TLS_CERT, TLS_KEY, TLS_PASS} from "../core.settings";

const commonStorefrontConfiguration = {
    gateways: [],
    serverOptions: {
        port: 4448
    },
    pages: [],
    url: 'http://localhost:4448',
    dependencies: []
} as IStorefrontConfig;


describe('Storefront', () => {
    it('should create a new storefront instance', (done) => {
        const sf = new Storefront(commonStorefrontConfiguration);

        expect(sf).to.be.instanceOf(Storefront);

        sf.server.close( () => {
           done();
        });
    });

    it('should respond 200 from healthcheck path when storefront is ready', (done) => {
        const sf = new Storefront(commonStorefrontConfiguration);

        sf.init(() => {
            request('http://localhost:4448')
                .get('/healthcheck')
                .expect(200).end((err) => {
                sf.server.close( () => {
                    done(err);
                });
            });
        });
    });

    /*
    it('should create a new storefront instance using spdy protocol', (done) => {
        const sf = new Storefront({
            ...commonStorefrontConfiguration,
            spdy: {
                protocols: [TRANSFER_PROTOCOLS.H2, TRANSFER_PROTOCOLS.SPDY, TRANSFER_PROTOCOLS.HTTP1],
                passphrase: TLS_PASS,
                key: TLS_KEY,
                cert: TLS_CERT,
            }
        } as IStorefrontConfig);

        sf.init(() => {
            request('https://localhost:4448')
                .get('/healthcheck')
                .expect(200)
                .end((err) => {
                    sf.server.close( () => {
                        done(err);
                    });
                });
        });
    }, 20000);

    it('should add page routes and respond correctly', (done) => {
        const scope = createGateway('Browsing', 'http://localhost:4446', {
            fragments: {
                'product':
                    {
                        assets: [],
                        dependencies: [],
                        render: {
                            url: '/',
                        },
                        testCookie: 'sdasd',
                        version: '1.0.0'
                    }
            },
            hash: '12345'
        }, false)
            .get('/product/')
            .query({[RENDER_MODE_QUERY_NAME]: FRAGMENT_RENDER_MODES.STREAM})
            .reply(200, {
                main: 'Product Content'
            });

        const sf = new Storefront({
            ...commonStorefrontConfiguration,
            gateways: [
                {
                    name: "Browsing",
                    url: "http://localhost:4446"
                }
            ],
            pages: [
                {
                    url: '/',
                    html: '<template><div><html><head></head><body><fragment from="Browsing" name="product"/></div></body></html></template>'
                }
            ]
        } as any);

        sf.init(() => {
            request('http://localhost:4448')
                .get('/')
                .expect(200)
                .end((err, res) => {


                    Object.values(sf.gateways).forEach(gateway => {
                        gateway.stopUpdating();
                    });

                    expect(res.text).to.include(`<div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_main">Product Content</div>`);
                    sf.server.close( () => {
                        done(err);
                    });

                });
        });
    });
*/

    it('should track gateway updates and respond with updated configuration', (done) => {
        const hash_nock = (placeholder: boolean, hash: string) => {
            return nock('http://localhost:4446')
                .persist(true)
                .get('/')
                .reply(200, {
                    fragments: {
                        'product':
                            {
                                assets: [],
                                dependencies: [],
                                render: {
                                    url: '/',
                                    placeholder
                                },
                                testCookie: 'sdasd',
                                version: '1.0.0'
                            }
                    },
                    hash: hash
                })
                .get('/product/')
                .query({[RENDER_MODE_QUERY_NAME]: FRAGMENT_RENDER_MODES.STREAM})
                .reply(200, {
                    main: 'Product Content'
                })
                .get('/product/placeholder')
                .reply(200, 'Product Placeholder');
        };

        hash_nock(false, 'disabled');

        const sf = new Storefront({
            ...commonStorefrontConfiguration,
          satisfyUpdateCount: 2,
            gateways: [
                {
                    name: "Browsing",
                    url: "http://localhost:4446"
                }
            ],
            pages: [
                {
                    url: '/',
                    html: '<template><div><html><head></head><body><fragment from="Browsing" name="product" chunked /></div></body></html></template>'
                }
            ]
        } as any);


        sf.init(() => {
            request('http://localhost:4448')
                .get('/')
                .expect(200)
                .end((err, res) => {
                    expect(res.text).to.include(`<body><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main"></div>`);
                    nock.cleanAll();
                    hash_nock(true, 'enabled');

                    sf.gateways['Browsing'].events.once(EVENTS.GATEWAY_UPDATED, () => {
                        setTimeout(() => {
                            request('http://localhost:4448')
                                .get('/')
                                .expect(200)
                                .end((err, res) => {

                                    Object.values(sf.gateways).forEach(gateway => {
                                        gateway.stopUpdating();
                                    });
                                    nock.cleanAll();

                                    expect(res.text).to.include(`<body><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main" puzzle-placeholder="product_main_placeholder">Product Placeholder</div>`);
                                    sf.server.close( () => {
                                        done();
                                    });

                                });
                        }, 500);
                    });
                });
        });
    }, DEFAULT_POLLING_INTERVAL * 5 + 2000);

    it('should respond with same status code gateway returned for primary fragments', (done) => {
        const scope = createGateway('Browsing', 'http://localhost:4446', {
            fragments: {
                'product':
                    {
                        assets: [],
                        dependencies: [],
                        render: {
                            url: '/',
                        },
                        testCookie: 'sdasd',
                        version: '1.0.0'
                    }
            },
            hash: '12345'
        }, false)
            .get('/product/')
            .query({[RENDER_MODE_QUERY_NAME]: FRAGMENT_RENDER_MODES.STREAM})
            .reply(404, {
                main: 'Product Content Not Found'
            });

        const sf = new Storefront({
            ...commonStorefrontConfiguration,
            gateways: [
                {
                    name: "Browsing",
                    url: "http://localhost:4446"
                }
            ],
            pages: [
                {
                    url: '/',
                    html: '<template><div><html><head></head><body><fragment from="Browsing" name="product" primary/></div></body></html></template>'
                }
            ]
        } as any);

        sf.init(() => {
            request('http://localhost:4448')
                .get('/')
                .expect(404)
                .end((err, res) => {


                    Object.values(sf.gateways).forEach(gateway => {
                        gateway.stopUpdating();
                    });

                    expect(res.text).to.include(`<body><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Product Content Not Found</div><`);
                    sf.server.close(() => {
                        done(err);
                    });

                });
        });
    });

    it('should add multiple routes for pages with optional params', (done) => {
        const fragment = {
            name: 'test',
            testCookie: faker.random.word(),
            hash: faker.random.uuid()
        };
        const scope = createGateway('Browsing', 'http://localhost:4446', {
            fragments: {
                [fragment.name]:
                    {
                        assets: [],
                        dependencies: [],
                        render: {
                            url: '/',
                        },
                        testCookie: fragment.testCookie,
                        version: '1.0.0'
                    }
            },
            hash: fragment.hash
        }, true)
            .get(`/${fragment.name}/detail`)
            .times(2)
            .query({[RENDER_MODE_QUERY_NAME]: FRAGMENT_RENDER_MODES.STREAM})
            .reply(200, {
                main: `Fragment: ${fragment.name}`
            });

        const sf = new Storefront({
            ...commonStorefrontConfiguration,
            satisfyUpdateCount: 2,
            gateways: [
                {
                    name: "Browsing",
                    url: "http://localhost:4446"
                }
            ],
            pages: [
                {
                    url: ['/', '/detail'],
                    html: `<template><html><head></head><body><fragment from="Browsing" name="${fragment.name}" primary /></div></body></html></template>`
                }
            ]
        } as any);

        sf.init(() => {
            request('http://localhost:4448')
                .get('/detail')
                .expect(200)
                .end((err, res) => {

                    Object.values(sf.gateways).forEach(gateway => {
                        gateway.stopUpdating();
                    });

                    expect(scope.isDone()).to.eq(true);
                    expect(res.text).to.include(`<body><div id="${fragment.name}" puzzle-fragment="${fragment.name}" puzzle-gateway="Browsing">Fragment: ${fragment.name}</div>`);
                    sf.server.close( () => {
                        done(err);
                    });

                });
        });
    });
});
