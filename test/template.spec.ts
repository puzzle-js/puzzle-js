import "mocha";
import {expect} from "chai";
import {Template} from "../src/lib/template";
import nock = require("nock");
import {FRAGMENT_RENDER_MODES} from "../src/lib/enums";

describe('Template', () => {
    it('should create a new Template instance', () => {
        const template = new Template('<template><div></div></template>');

        expect(template).to.be.instanceOf(Template);
    });

    it('should throw exception if template not found in html', () => {
        const test = () => {
            new Template('<div></div>');
        };

        expect(test).to.throw();
    });

    it('should prepare page class if script exists', () => {
        const template = new Template(`<script>module.exports = { onCreate(){this.testProp = 'test';} }</script><template><div></div></template>`);
        expect(template.pageClass.testProp).to.eq('test');
    });

    it('should prepare dependencies', () => {
        const template = new Template('<template><div><fragment from="Browsing" name="product"></fragment></div></template>');

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: false,
                        shouldWait: false,
                        attribs: {
                            from: "Browsing",
                            name: "product",
                        }
                    }
                }
            }
        });
    });

    it('should compile page and return a function without any fragments', async () => {
        const template = new Template('<template><div><span>Puzzle</span></div></template>');
        const handler = await template.compile({});

        handler({}, {
            write(str: string) {
                throw new Error('Wrong express method, it should be end for single fragments');
            },
            end(str: string) {
                expect(str).to.eq('<div><span>Puzzle</span></div>');
            }
        });
    });

    it('should compile page with script without fragments', async () => {
        const template = new Template('<script>module.exports = {onCreate(){this.title = "Puzzle"}}</script><template><div><span>${this.title}</span></div></template>');
        const handler = await template.compile({});

        handler({}, {
            write(str: string) {
                throw new Error('Wrong express method, it should be end for single fragments');
            },
            end(str: string) {
                expect(str).to.eq('<div><span>Puzzle</span></div>');
            }
        });
    });

    it('should parse fragment attribute primary', () => {
        const template = new Template('<template><div><fragment from="Browsing" name="product" primary></fragment></div></template>');

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: true,
                        shouldWait: true,
                        attribs: {
                            from: "Browsing",
                            name: "product",
                            primary: ""
                        }
                    }
                }
            }
        });
    });

    it('should throw error when multiple primary fragments', () => {
        const template = new Template(`
            <template>
                <div>
                <fragment from="Browsing" name="product" primary></fragment>
                <fragment from="Browsing" name="wrong" primary></fragment>
                </div>
            </template>
        `);

        const test = () => {
            const dependencyList = template.getDependencies();
        };

        expect(test).to.throw('Multiple primary');
    });

    it('should parse fragment attribute primary when fragment partials exists', () => {
        const template = new Template(`
            <template>
                <fragment from="Browsing" name="product" partial="notification"></fragment>
                <div>
                <fragment from="Browsing" name="product" primary></fragment>
                </div>
            </template>
        `);

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: true,
                        shouldWait: true,
                        attribs: {
                            from: "Browsing",
                            name: "product",
                            partial: "notification"
                        }
                    }
                }
            }
        });
    });

    it('should parse fragment attribute shouldWait', () => {
        const template = new Template(`
            <template>
                <div>
                <fragment from="Browsing" name="product" shouldWait></fragment>
                </div>
            </template>
        `);

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: false,
                        shouldWait: true,
                        attribs: {
                            from: "Browsing",
                            name: "product",
                            shouldwait: ""
                        }
                    }
                }
            }
        });
    });

    it('should parse fragment attribute shouldWait when fragment partials exists', () => {
        const template = new Template(`
            <template>
                <fragment from="Browsing" name="product" partial="a"></fragment>
                <div>
                <fragment from="Browsing" name="product" shouldWait></fragment>
                </div>
                <fragment from="Browsing" name="product" partial="b"></fragment>
            </template>
        `);

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: false,
                        shouldWait: true,
                        attribs: {
                            from: "Browsing",
                            name: "product",
                            partial: "a"
                        }
                    }
                }
            }
        });
    });

    it('should parse fragment attribute shouldWait as true if parent node is head', () => {
        const template = new Template(`
            <template>
                <html>
                    <head>
                        <fragment from="Browsing" name="product" partial="meta"></fragment>
                    </head>
                    <body>
                        <div>
                            <fragment from="Browsing" name="product"></fragment>
                        </div>
                    </body>   
                </html>             
            </template>
        `);

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: false,
                        shouldWait: true,
                        attribs: {
                            from: "Browsing",
                            name: "product",
                            partial: "meta"
                        }
                    }
                }
            }
        });
    });

    describe('Output', () => {
        it('should respond in single chunk when there is no fragments', (done) => {
            const template = new Template(`
                <template>
                    <div>
                        <span>Trendyol is the best!</span>
                    </div>
                </template>
            `);

            template.getDependencies();


            template.compile({}).then(handler => {
                handler({}, {
                    write(str: string) {

                    },
                    end(str: string) {
                        try {
                            expect(str).to.eq(`<div><span>Trendyol is the best!</span></div>`);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }
                });
            });
        });

        it('should respond with single flush, shouldwait without partial', (done) => {
            let scope = nock('http://my-test-gateway.com')
                .get('/product/')
                .query({
                    __renderMode: FRAGMENT_RENDER_MODES.STREAM
                })
                .reply(200, {
                    main: 'Trendyol'
                });


            const template = new Template(`
                <template>
                    <div>
                        <fragment from="Browsing" name="product" shouldWait></fragment>
                    </div>
                </template>
            `);

            template.getDependencies();

            template.fragments.product.update({
                render: {
                    url: '/'
                },
                dependencies: [],
                assets: [],
                testCookie: 'test',
                version: '1.0.0'
            }, 'http://my-test-gateway.com');


            template.compile({}).then(handler => {
                handler({}, {
                    write(str: string) {

                    },
                    end(str: string) {
                        try {
                            expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div>`);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }
                });
            });

        });

        it('should respond with single flush, shouldwait with partial', (done) => {
            let scope = nock('http://my-test-gateway.com')
                .get('/product/')
                .query({
                    __renderMode: FRAGMENT_RENDER_MODES.STREAM
                })
                .reply(200, {
                    main: 'Trendyol',
                    gallery: 'List of great products'
                });


            const template = new Template(`
                <template>
                    <div>
                        <fragment from="Browsing" name="product" shouldWait></fragment>
                    </div>
                    <div>
                        <fragment from="Browsing" name="product" partial="gallery"></fragment>
                    </div>
                </template>
            `);

            template.getDependencies();

            template.fragments.product.update({
                render: {
                    url: '/'
                },
                dependencies: [],
                assets: [],
                testCookie: 'test',
                version: '1.0.0'
            }, 'http://my-test-gateway.com');


            template.compile({}).then(handler => {
                handler({}, {
                    write(str: string) {

                    },
                    end(str: string) {
                        try {
                            expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="gallery">List of great products</div></div>`);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }
                });
            });
        });

        it('should respond with single flush, multiple shouldwaits with partial', (done) => {
            let scope = nock('http://my-test-gateway.com')
                .get('/product/')
                .query({
                    __renderMode: FRAGMENT_RENDER_MODES.STREAM
                })
                .reply(200, {
                    main: 'Trendyol',
                })
                .get('/product2/')
                .query({
                    __renderMode: FRAGMENT_RENDER_MODES.STREAM
                })
                .reply(200, {
                    main: 'List of great products',
                });


            const template = new Template(`
                <template>
                    <div>
                        <fragment from="Browsing" name="product" shouldWait></fragment>
                    </div>
                    <div>
                        <fragment from="Browsing" name="product2" shouldWait></fragment>
                    </div>
                </template>
            `);

            template.getDependencies();

            template.fragments.product.update({
                render: {
                    url: '/'
                },
                dependencies: [],
                assets: [],
                testCookie: 'test',
                version: '1.0.0'
            }, 'http://my-test-gateway.com');

            template.fragments.product2.update({
                render: {
                    url: '/'
                },
                dependencies: [],
                assets: [],
                testCookie: 'test',
                version: '1.0.0'
            }, 'http://my-test-gateway.com');


            template.compile({}).then(handler => {
                handler({}, {
                    write(str: string) {

                    },
                    end(str: string) {
                        try {
                            expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div puzzle-fragment="product2" puzzle-gateway="Browsing">List of great products</div></div>`);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }
                });
            });
        });

        it('should print default content not found error if partial is not being served', done => {
            let scope = nock('http://my-test-gateway.com')
                .get('/product/')
                .query({
                    __renderMode: FRAGMENT_RENDER_MODES.STREAM
                })
                .reply(200, {
                    main: 'Trendyol',
                });


            const template = new Template(`
                <template>
                    <div>
                        <fragment from="Browsing" name="product" shouldWait></fragment>
                    </div>
                    <div>
                        <fragment from="Browsing" name="product2" shouldWait></fragment>
                    </div>
                </template>
            `);

            template.getDependencies();

            template.fragments.product.update({
                render: {
                    url: '/'
                },
                dependencies: [],
                assets: [],
                testCookie: 'test',
                version: '1.0.0'
            }, 'http://my-test-gateway.com');


            template.compile({}).then(handler => {
                handler({}, {
                    write(str: string) {

                    },
                    end(str: string) {
                        try {
                            expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div puzzle-fragment="product2" puzzle-gateway="Browsing"><script>console.log('Fragment Part does not exists')</script></div></div>`);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }
                });
            });
        });

        it('should respond correctly when multiple gateways and single fragment from each', done => {
            let scope = nock('http://my-test-gateway.com')
                .get('/product/')
                .query({
                    __renderMode: FRAGMENT_RENDER_MODES.STREAM
                })
                .reply(200, {
                    main: 'Trendyol',
                });

            let scope2 = nock('http://my-test-gateway2.com')
                .get('/header/')
                .query({
                    __renderMode: FRAGMENT_RENDER_MODES.STREAM
                })
                .reply(200, {
                    main: 'Header Content',
                });


            const template = new Template(`
                <template>
                    <div>
                        <fragment from="Browsing" name="product" shouldWait></fragment>
                    </div>
                    <div>
                        <fragment from="Common" name="header" shouldWait></fragment>
                    </div>
                </template>
            `);

            template.getDependencies();

            template.fragments.product.update({
                render: {
                    url: '/'
                },
                dependencies: [],
                assets: [],
                testCookie: 'test',
                version: '1.0.0'
            }, 'http://my-test-gateway.com');

            template.fragments.header.update({
                render: {
                    url: '/'
                },
                dependencies: [],
                assets: [],
                testCookie: 'test',
                version: '1.0.0'
            }, 'http://my-test-gateway2.com');


            template.compile({}).then(handler => {
                handler({}, {
                    write(str: string) {

                    },
                    end(str: string) {
                        try {
                            expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div puzzle-fragment="header" puzzle-gateway="Common">Header Content</div></div>`);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }
                });
            });
        });
    });
});
