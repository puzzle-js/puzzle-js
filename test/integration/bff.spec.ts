import "mocha";
import {expect} from "chai";
import {GatewayBFF} from "../../src/lib/gateway";
import request from "supertest";
import {IGatewayBFFConfiguration} from "../../src/types/gateway";
import {render} from "typings/dist/support/cli";
import {RENDER_MODE_QUERY_NAME} from "../../src/lib/config";
import {FRAGMENT_RENDER_MODES} from "../../src/lib/enums";

const commonGatewayConfiguration: IGatewayBFFConfiguration = {
    api: [],
    fragments: [],
    name: 'Browsing',
    url: 'http://localhost:4644',
    port: 4644
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

        it('should export fragment content', (done) => {
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
                    .expect(200)
                    .end((err, res) => {
                        bff.server.close();
                        expect(res.text).to.eq(`<html><head><title>Browsing - product</title></head><body><div>Rendered Fragment ACG</div></body></html>`);
                        done(err);
                    });
            });
        });

        it('should export fragment content', (done) => {
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
    });
}
