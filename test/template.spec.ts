import "mocha";
import {expect} from "chai";
import {Template} from "../src/lib/template";
import nock = require("nock");
import {
    CONTENT_REPLACE_SCRIPT, FRAGMENT_RENDER_MODES, RESOURCE_INJECT_TYPE, RESOURCE_LOCATION,
    RESOURCE_TYPE
} from "../src/lib/enums";
import {createExpressMock} from "./mock/mock";
import ResourceFactory from "../src/lib/resourceFactory";

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
                        from: "Browsing"
                    }
                }
            }
        });
    });

    it('should compile page and return a function without any fragments', async () => {
        const template = new Template('<template><div><span>Puzzle</span></div></template>');
        const handler = await template.compile({});

        handler({}, createExpressMock({
            write(str: string) {
                throw new Error('Wrong express method, it should be end for single fragments');
            },
            end(str: string) {
                expect(str).to.eq('<div><span>Puzzle</span></div>');
            }
        }));
    });

    it('should compile page with script without fragments', async () => {
        const template = new Template('<script>module.exports = {onCreate(){this.title = "Puzzle"}}</script><template><div><span>${this.title}</span></div></template>');
        const handler = await template.compile({});

        handler({}, createExpressMock({
            write(str: string) {
                throw new Error('Wrong express method, it should be end for single fragments');
            },
            end(str: string) {
                expect(str).to.eq('<div><span>Puzzle</span></div>');
            }
        }));
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
                        from: "Browsing"
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
                        from: "Browsing"
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
                        from: "Browsing"
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
                        from: "Browsing"

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
                        from: "Browsing"
                    }
                }
            }
        });
    });

    it('should parse static config fragments and inject them into first flush', (done) => {
        let scope = nock('http://my-test-gateway-static.com')
            .get('/product/')
            .query({
                __renderMode: FRAGMENT_RENDER_MODES.STREAM
            })
            .reply(200, {
                main: '<div>Static Fragment</div>',
            });


        const template = new Template(`
            <template>
                <div>
                    <fragment from="Browsing" name="product"></fragment>
                </div>
            </template>
        `);

        template.getDependencies();

        template.fragments.product.update({
            render: {
                url: '/',
                static: true
            },
            dependencies: [],
            assets: [],
            testCookie: 'test',
            version: '1.0.0'
        }, 'http://my-test-gateway-static.com');

        template.compile({}).then(handler => {
            handler({}, createExpressMock({
                write(str: string) {
                    expect(str).to.eq(null);
                },
                end(str: string) {
                    expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="main"><div>Static Fragment</div></div></div>`);
                    done();
                },
                status: () => ''
            }));
        });
    });

    it('should render content not found static fragment that doesnt exists', (done) => {
        let scope = nock('http://my-test-gateway-static-2.com')
            .get('/product/')
            .query({
                __renderMode: FRAGMENT_RENDER_MODES.STREAM
            })
            .reply(200, {
                nope: '<div>Nope Fragment</div>',
            });


        const template = new Template(`
            <template>
                <div>
                    <fragment from="Browsing" name="product"></fragment>
                </div>
            </template>
        `);

        template.getDependencies();

        template.fragments.product.update({
            render: {
                url: '/',
                static: true
            },
            dependencies: [],
            assets: [],
            testCookie: 'test',
            version: '1.0.0'
        }, 'http://my-test-gateway-static-2.com');

        template.compile({}).then(handler => {
            handler({}, createExpressMock({
                write(str: string) {
                    expect(str).to.eq(null);
                },
                end(str: string) {
                    expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="main"><script>console.log('Fragment Part does not exists')</script></div></div>`);
                    done();
                },
                status: () => ''
            }));
        });
    });

    it('should inject fragment dependencies succesfully', (done) => {
        let randomDependency = `dep_${Math.random()}`;
        ResourceFactory.instance.registerDependencies({
            name: randomDependency,
            content: `console.log('5')`,
            type: RESOURCE_TYPE.JS
        });

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
                    <html>
                        <head>
                        
                        </head>
                        <body>
                        <div>
                            <fragment from="Browsing" name="product" shouldWait></fragment>
                        </div>
                        </body>
                    </html>
                </template>
            `);

        template.getDependencies();

        template.fragments.product.update({
            render: {
                url: '/'
            },
            dependencies: [
                {
                    name: randomDependency,
                }
            ],
            assets: [],
            testCookie: 'test',
            version: '1.0.0'
        }, 'http://my-test-gateway.com');


        template.compile({}).then(handler => {
            handler({}, createExpressMock({
                write(str: string) {

                },
                end(str: string) {
                    try {
                        expect(str).to.eq(`<html><head><script puzzle-dependency="${randomDependency}" type="text/javascript">console.log('5')</script></head><body><div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div></body></html>`);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                status: () => ''
            }));
        });
    });

    describe('Output', () => {
        describe('Without Chunks', () => {
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
                    handler({}, createExpressMock({
                        write(str: string) {

                        },
                        end(str: string) {
                            try {
                                expect(str).to.eq(`<div><span>Trendyol is the best!</span></div>`);
                                done();
                            } catch (e) {
                                done(e);
                            }
                        },
                        status: () => ''
                    }));
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
                    handler({}, createExpressMock({
                        write(str: string) {

                        },
                        end(str: string) {
                            try {
                                expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div>`);
                                done();
                            } catch (e) {
                                done(e);
                            }
                        },
                        status: () => ''
                    }));
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
                    handler({}, createExpressMock({
                        write(str: string) {

                        },
                        end(str: string) {
                            try {
                                expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="gallery">List of great products</div></div>`);
                                done();
                            } catch (e) {
                                done(e);
                            }
                        },
                        status: () => ''
                    }));
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
                    handler({}, createExpressMock({
                        write(str: string) {

                        },
                        end(str: string) {
                            try {
                                expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div puzzle-fragment="product2" puzzle-gateway="Browsing">List of great products</div></div>`);
                                done();
                            } catch (e) {
                                done(e);
                            }
                        },
                        status: () => ''
                    }));
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
                    handler({}, createExpressMock({
                        write(str: string) {

                        },
                        end(str: string) {
                            try {
                                expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div puzzle-fragment="product2" puzzle-gateway="Browsing"><script>console.log('Fragment Part does not exists')</script></div></div>`);
                                done();
                            } catch (e) {
                                done(e);
                            }
                        },
                        status: () => ''
                    }));
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
                    handler({}, createExpressMock({
                        write(str: string) {

                        },
                        end(str: string) {
                            try {
                                expect(str).to.eq(`<div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div puzzle-fragment="header" puzzle-gateway="Common">Header Content</div></div>`);
                                done();
                            } catch (e) {
                                done(e);
                            }
                        },
                        status: () => ''
                    }));
                });
            });
        });

        describe('With Chunks', () => {
            it('should respond chunked correctly without placeholders', done => {
                let scope = nock('http://my-test-gateway-chunked.com')
                    .get('/product/')
                    .query({
                        __renderMode: FRAGMENT_RENDER_MODES.STREAM
                    })
                    .reply(200, {
                        main: 'Trendyol',
                    });


                const template = new Template(`
                    <template>
                        <html>
                            <head>
                            
                            </head>
                            <body>
                            <div>
                                <fragment from="Browsing" name="product"></fragment>
                            </div>
                            </body>
                        </html>
                    </template>
                `);

                template.getDependencies();

                template.fragments.product.update({
                    render: {
                        url: '/',
                        placeholder: false
                    },
                    dependencies: [],
                    assets: [],
                    testCookie: 'test',
                    version: '1.0.0'
                }, 'http://my-test-gateway-chunked.com');

                let err: boolean | null = null;
                let chunks: string[] = [];

                template.compile({}).then(handler => {
                    handler({}, createExpressMock({
                        write(str: string) {
                            chunks.push(str);
                        },
                        end(str: string) {
                            chunks.push(str);
                            try {
                                expect(chunks[0]).to.eq(`<html><head>${CONTENT_REPLACE_SCRIPT}</head><body><div><div puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main"></div></div>`);
                                expect(chunks[1]).to.eq(`<div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_main">Trendyol</div><script>$p('[puzzle-chunk="product_main"]','[puzzle-chunk-key="product_main"]');</script>`);
                                expect(chunks[2]).to.eq(`</body></html>`);
                            } catch (e) {
                                err = e;
                            }
                            done(err);
                        },
                        set(headerName: string, value: string) {

                        }
                    }));
                });
            });

            it('should respond chunked correctly with placeholders', done => {
                let scope = nock('http://my-test-gateway-chunked.com')
                    .get('/product/')
                    .query({
                        __renderMode: FRAGMENT_RENDER_MODES.STREAM
                    })
                    .reply(200, {
                        main: 'Trendyol',
                    })
                    .get('/product/placeholder')
                    .reply(200, 'placeholder');


                const template = new Template(`
                    <template>
                        <html>
                            <head>
                            
                            </head>
                            <body>
                            <div>
                                <fragment from="Browsing" name="product"></fragment>
                            </div>
                            </body>
                        </html>
                    </template>
                `);

                template.getDependencies();

                template.fragments.product.update({
                    render: {
                        url: '/',
                        placeholder: true
                    },
                    dependencies: [],
                    assets: [],
                    testCookie: 'test',
                    version: '1.0.0'
                }, 'http://my-test-gateway-chunked.com');

                let err: boolean | null = null;
                let chunks: string[] = [];

                template.compile({}).then(handler => {
                    handler({}, createExpressMock({
                        write(str: string) {
                            chunks.push(str);
                        },
                        end(str: string) {
                            chunks.push(str);
                            try {
                                expect(chunks[0]).to.eq(`<html><head>${CONTENT_REPLACE_SCRIPT}</head><body><div><div puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main" puzzle-placeholder="product_main_placeholder">placeholder</div></div>`);
                                expect(chunks[1]).to.eq(`<div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_main">Trendyol</div><script>$p('[puzzle-chunk="product_main"]','[puzzle-chunk-key="product_main"]');</script>`);
                                expect(chunks[2]).to.eq(`</body></html>`);
                            } catch (e) {
                                err = e;
                            }
                            done(err);
                        },
                        set(headerName: string, value: string) {

                        },
                        status: () => ''
                    }));
                });
            });

            it('should respond one single wait one chunked fragment', done => {
                let scope = nock('http://my-test-gateway-chunked-2.com')
                    .get('/product/')
                    .query({
                        __renderMode: FRAGMENT_RENDER_MODES.STREAM
                    })
                    .reply(200, {
                        main: 'Trendyol Product Content',
                        meta: '<meta product="bag"/>'
                    })
                    .get('/header/')
                    .query({
                        __renderMode: FRAGMENT_RENDER_MODES.STREAM
                    })
                    .reply(200, {
                        main: 'Header Content',
                    })
                    .get('/footer/')
                    .query({
                        __renderMode: FRAGMENT_RENDER_MODES.STREAM
                    })
                    .reply(200, {
                        main: 'Footer Content',
                    });


                const template = new Template(`
                    <template>
                        <html>
                            <head>
                                <fragment from="Browsing" name="product" partial="meta"></fragment>
                            </head>
                            <body>
                                <fragment from="Browsing" name="header" shouldwait></fragment>
                                <div>
                                    <fragment from="Browsing" name="product"></fragment>
                                </div>
                                <fragment from="Browsing" name="footer"></fragment>
                            </body>
                        </html>
                    </template>
                `);

                template.getDependencies();

                template.fragments.product.update({
                    render: {
                        url: '/',
                    },
                    dependencies: [],
                    assets: [],
                    testCookie: 'test',
                    version: '1.0.0'
                }, 'http://my-test-gateway-chunked-2.com');

                template.fragments.header.update({
                    render: {
                        url: '/',
                    },
                    dependencies: [],
                    assets: [],
                    testCookie: 'test',
                    version: '1.0.0'
                }, 'http://my-test-gateway-chunked-2.com');

                template.fragments.footer.update({
                    render: {
                        url: '/',
                    },
                    dependencies: [],
                    assets: [],
                    testCookie: 'test',
                    version: '1.0.0'
                }, 'http://my-test-gateway-chunked-2.com');

                let err: boolean | null = null;
                let chunks: string[] = [];

                template.compile({}).then(handler => {
                    handler({}, createExpressMock({
                        write(str: string) {
                            chunks.push(str);
                        },
                        end(str: string) {
                            chunks.push(str);
                            try {
                                expect(chunks[0]).to.eq(`<html><head> <meta product="bag"/> ${CONTENT_REPLACE_SCRIPT}</head><body><div puzzle-fragment="header" puzzle-gateway="Browsing">Header Content</div><div><div puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol Product Content</div></div><div puzzle-fragment="footer" puzzle-gateway="Browsing" puzzle-chunk="footer_main"></div>`);
                                expect(chunks[1]).to.eq(`<div style="display: none;" puzzle-fragment="footer" puzzle-chunk-key="footer_main">Footer Content</div><script>$p('[puzzle-chunk="footer_main"]','[puzzle-chunk-key="footer_main"]');</script>`);
                                expect(chunks[2]).to.eq(`</body></html>`);
                            } catch (e) {
                                err = e;
                            }
                            done(err);
                        },
                        set(headerName: string, value: string) {

                        },
                        status: () => ''
                    }));
                });
            });

            it('should respond same fragment multiple chunked partial', done => {
                let scope = nock('http://my-test-gateway-chunked-3.com')
                    .get('/product/')
                    .query({
                        __renderMode: FRAGMENT_RENDER_MODES.STREAM
                    })
                    .reply(200, {
                        main: 'Trendyol Product Content',
                        footer: 'Footer Content',
                        header: 'Header Content',
                        side: 'Side Content'
                    })
                    .get('/product/placeholder')
                    .reply(200, 'product content placeholder');


                const template = new Template(`
                    <template>
                        <html>
                            <head>
                                
                            </head>
                            <body>
                                <fragment from="Browsing" name="product" partial="header"></fragment>
                                <fragment from="Browsing" name="product"></fragment>
                                <div>
                                    <fragment from="Browsing" name="product" partial="side"></fragment>
                                </div>
                                <fragment from="Browsing" name="product" partial="footer"></fragment>
                            </body>
                        </html>
                    </template>
                `);

                template.getDependencies();

                template.fragments.product.update({
                    render: {
                        url: '/',
                        placeholder: true
                    },
                    dependencies: [],
                    assets: [],
                    testCookie: 'test',
                    version: '1.0.0'
                }, 'http://my-test-gateway-chunked-3.com');


                let err: boolean | null = null;
                let chunks: string[] = [];

                template.compile({}).then(handler => {
                    handler({}, createExpressMock({
                        write(str: string) {
                            chunks.push(str);
                        },
                        end(str: string) {
                            chunks.push(str);
                            try {
                                expect(chunks[0]).to.eq(`<html><head><script>function $p(p,c){var z = document.querySelector(c),r = z.innerHTML;z.parentNode.removeChild(z);document.querySelector(p).innerHTML=r}</script></head><body><div puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="header" puzzle-chunk="product_header"></div><div puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main" puzzle-placeholder="product_main_placeholder">product content placeholder</div><div><div puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="side" puzzle-chunk="product_side"></div></div><div puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="footer" puzzle-chunk="product_footer"></div>`);

                                expect(chunks).to.include(`<div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_header">Header Content</div><script>$p('[puzzle-chunk="product_header"]','[puzzle-chunk-key="product_header"]');</script>`);
                                expect(chunks).to.include(`<div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_side">Side Content</div><script>$p('[puzzle-chunk="product_side"]','[puzzle-chunk-key="product_side"]');</script>`);
                                expect(chunks).to.include(`<div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_footer">Footer Content</div><script>$p('[puzzle-chunk="product_footer"]','[puzzle-chunk-key="product_footer"]');</script>`);

                                expect(str).to.eq('</body></html>');
                            } catch (e) {
                                err = e;
                            }
                            done(err);
                        },
                        set(headerName: string, value: string) {

                        },
                        status: () => ''
                    }));
                });
            });

            it('should respond without primary content statuscode', done => {
                let scope = nock('http://my-test-gateway-chunked.com')
                    .get('/product-not-exists/')
                    .query({
                        __renderMode: FRAGMENT_RENDER_MODES.STREAM
                    })
                    .reply(404, {
                        main: 'Trendyol',
                    });


                const template = new Template(`
                    <template>
                        <html>
                            <head>
                            
                            </head>
                            <body>
                            <div>
                                <fragment from="Browsing" name="product-not-exists" primary></fragment>
                            </div>
                            </body>
                        </html>
                    </template>
                `);

                template.getDependencies();

                template.fragments['product-not-exists'].update({
                    render: {
                        url: '/',
                        placeholder: false
                    },
                    dependencies: [],
                    assets: [],
                    testCookie: 'test',
                    version: '1.0.0'
                }, 'http://my-test-gateway-chunked.com');

                let err: boolean | null = null;
                let chunks: string[] = [];

                template.compile({}).then(handler => {
                    handler({}, createExpressMock({
                        write(str: string) {
                            chunks.push(str);
                        },
                        end(str: string) {
                            chunks.push(str);
                            try {
                                expect(str).to.eq(`<html><head></head><body><div><div puzzle-fragment="product-not-exists" puzzle-gateway="Browsing">Trendyol</div></div></body></html>`);
                            } catch (e) {
                                err = e;
                            }
                            done(err);
                        },
                        status(statusCode: number) {
                            expect(statusCode).to.eq(404);
                        }
                    }));
                });
            });
        });

        describe('Asset locations', () => {
            it('should return html comment not existing asset', () => {
                expect(Template.wrapJsAsset({
                    link: null,
                    injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
                    name: 'Nope',
                    content: null
                })).to.eq(`<!-- Failed to inject asset: Nope -->`)
            });

            it('should append asset locations for normal fragment, HEAD - External', (done) => {
                const productScript = `console.log('Product Script')`;

                const scope = nock('http://my-test-gateway-chunked.com')
                    .get('/product/')
                    .query({
                        __renderMode: FRAGMENT_RENDER_MODES.STREAM
                    })
                    .reply(200, {
                        main: 'Trendyol',
                    })
                    .get('/product/static/bundle.min.js')
                    .reply(200, productScript);


                const template = new Template(`
                    <template>
                        <html>
                            <head>
                            
                            </head>
                            <body>
                            <div>
                                <fragment from="Browsing" name="product"></fragment>
                            </div>
                            </body>
                        </html>
                    </template>
                `);

                template.getDependencies();

                template.fragments.product.update({
                    render: {
                        url: '/',
                        placeholder: false
                    },
                    dependencies: [],
                    assets: [
                        {
                            name: 'Product Bundle',
                            fileName: 'bundle.min.js',
                            injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
                            location: RESOURCE_LOCATION.HEAD
                        }
                    ],
                    testCookie: 'test',
                    version: '1.0.0'
                }, 'http://my-test-gateway-chunked.com');

                let err: boolean | null = null;
                let chunks: string[] = [];

                template.compile({}).then(handler => {
                    handler({}, createExpressMock({
                        write(str: string) {
                            chunks.push(str);
                        },
                        end(str: string) {
                            chunks.push(str);
                            try {
                                expect(chunks[0]).to.eq(`<html><head>${CONTENT_REPLACE_SCRIPT}<script puzzle-dependency="Product Bundle" src="http://my-test-gateway-chunked.com/product/static/bundle.min.js" type="text/javascript"/></head><body><div><div puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main"></div></div>`);
                                expect(chunks[1]).to.eq(`<div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_main">Trendyol</div><script>$p('[puzzle-chunk="product_main"]','[puzzle-chunk-key="product_main"]');</script>`);
                                expect(chunks[2]).to.eq(`</body></html>`);
                            } catch (e) {
                                err = e;
                            }
                            done(err);
                        },
                        set(headerName: string, value: string) {

                        }
                    }));
                });
            });

            it('should append asset locations for normal fragment, HEAD - Inline', (done) => {
                const productScript = `console.log('Product Script')`;

                const scope = nock('http://my-test-gateway-chunked.com')
                    .get('/product/')
                    .query({
                        __renderMode: FRAGMENT_RENDER_MODES.STREAM
                    })
                    .reply(200, {
                        main: 'Trendyol',
                    })
                    .get('/product/static/bundle.min.js')
                    .reply(200, productScript);


                const template = new Template(`
                    <template>
                        <html>
                            <head>
                            
                            </head>
                            <body>
                            <div>
                                <fragment from="Browsing" name="product"></fragment>
                            </div>
                            </body>
                        </html>
                    </template>
                `);

                template.getDependencies();

                template.fragments.product.update({
                    render: {
                        url: '/',
                        placeholder: false
                    },
                    dependencies: [],
                    assets: [
                        {
                            name: 'Product Bundle',
                            fileName: 'bundle.min.js',
                            injectType: RESOURCE_INJECT_TYPE.INLINE,
                            location: RESOURCE_LOCATION.HEAD
                        }
                    ],
                    testCookie: 'test',
                    version: '1.0.0'
                }, 'http://my-test-gateway-chunked.com');

                let err: boolean | null = null;
                let chunks: string[] = [];

                template.compile({}).then(handler => {
                    handler({}, createExpressMock({
                        write(str: string) {
                            chunks.push(str);
                        },
                        end(str: string) {
                            chunks.push(str);
                            try {
                                expect(chunks[0]).to.eq(`<html><head>${CONTENT_REPLACE_SCRIPT}<script puzzle-dependency="Product Bundle" type="text/javascript">${productScript}</script></head><body><div><div puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main"></div></div>`);
                                expect(chunks[1]).to.eq(`<div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_main">Trendyol</div><script>$p('[puzzle-chunk="product_main"]','[puzzle-chunk-key="product_main"]');</script>`);
                                expect(chunks[2]).to.eq(`</body></html>`);
                            } catch (e) {
                                err = e;
                            }
                            done(err);
                        },
                        set(headerName: string, value: string) {

                        }
                    }));
                });
            });

            it('should append asset locations for normal fragment, HEAD - Inline, External - Multiple', (done) => {
                const productScript = `console.log('Product Script')`;
                const trackerScript = `console.log('Tracking')`;

                const scope = nock('http://my-test-gateway-chunked.com')
                    .get('/product/')
                    .query({
                        __renderMode: FRAGMENT_RENDER_MODES.STREAM
                    })
                    .reply(200, {
                        main: 'Trendyol',
                    })
                    .get('/product/static/bundle.min.js')
                    .reply(200, productScript)
                    .get('/product/static/tracker.min.js')
                    .reply(200, trackerScript);


                const template = new Template(`
                    <template>
                        <html>
                            <head>
                            
                            </head>
                            <body>
                            <div>
                                <fragment from="Browsing" name="product"></fragment>
                            </div>
                            </body>
                        </html>
                    </template>
                `);

                template.getDependencies();

                template.fragments.product.update({
                    render: {
                        url: '/',
                        placeholder: false
                    },
                    dependencies: [],
                    assets: [
                        {
                            name: 'Product Bundle',
                            fileName: 'bundle.min.js',
                            injectType: RESOURCE_INJECT_TYPE.INLINE,
                            location: RESOURCE_LOCATION.HEAD
                        },
                        {
                            name: 'Tracking',
                            fileName: 'tracker.min.js',
                            injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
                            location: RESOURCE_LOCATION.HEAD
                        }
                    ],
                    testCookie: 'test',
                    version: '1.0.0'
                }, 'http://my-test-gateway-chunked.com');

                let err: boolean | null = null;
                let chunks: string[] = [];

                template.compile({}).then(handler => {
                    handler({}, createExpressMock({
                        write(str: string) {
                            chunks.push(str);
                        },
                        end(str: string) {
                            chunks.push(str);
                            try {
                                expect(chunks[0]).to.include(`<script puzzle-dependency="Tracking" src="http://my-test-gateway-chunked.com/product/static/tracker.min.js" type="text/javascript"/>`);
                                expect(chunks[0]).to.include(`<script puzzle-dependency="Product Bundle" type="text/javascript">${productScript}</script>`);
                            } catch (e) {
                                err = e;
                            }
                            done(err);
                        },
                        set(headerName: string, value: string) {

                        }
                    }));
                });
            });
        });
    });
});
