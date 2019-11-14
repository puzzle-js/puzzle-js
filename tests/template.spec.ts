import {expect} from "chai";
import {Template} from "../src/template";
import {FRAGMENT_RENDER_MODES, RESOURCE_INJECT_TYPE, RESOURCE_LOCATION} from "../src/enums";
import {createExpressMock} from "./mock/mock";
import {EVENT, RESOURCE_TYPE} from "@puzzle-js/client-lib/dist/enums";
import nock = require("nock");

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
            "_attributes": {
              "from": "Browsing",
              "name": "product",
            },
            clientAsync: false,
            asyncDecentralized: false,
            name: 'product',
            primary: false,
            shouldWait: false,
            from: "Browsing",
            static: false
          }
        }
      }
    });
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
      },
      send(str: string) {
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
            "_attributes": {
              "from": "Browsing",
              "name": "product",
              "primary": "",
            },
            clientAsync: false,
            asyncDecentralized: false,
            name: 'product',
            primary: true,
            shouldWait: true,
            from: "Browsing",
            static: false
          }
        }
      }
    });
  });

  it('should parse fragment attribute if', () => {
    const template = new Template('<template><div><fragment from="Browsing" name="product" if="${\'false\'}"></fragment></div></template>');

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
            "_attributes": {
              "from": "Browsing",
              "name": "product",
              "if": "${'false'}"
            },
            clientAsync: false,
            asyncDecentralized: false,
            name: 'product',
            primary: false,
            shouldWait: false,
            from: "Browsing",
            static: false
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
            "_attributes": {
              "from": "Browsing",
              "name": "product",
              "partial": "notification",
            },
            clientAsync: false,
            asyncDecentralized: false,
            name: 'product',
            primary: true,
            shouldWait: true,
            from: "Browsing",
            static: false
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
            "_attributes": {
              "from": "Browsing",
              "name": "product",
              "shouldwait": "",
            },
            clientAsync: false,
            asyncDecentralized: false,
            name: 'product',
            primary: false,
            shouldWait: true,
            from: "Browsing",
            static: false
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
            "_attributes": {
              "from": "Browsing",
              "name": "product",
              "partial": "a",
            },
            clientAsync: false,
            asyncDecentralized: false,
            name: 'product',
            primary: false,
            shouldWait: true,
            from: "Browsing",
            static: false
          }
        }
      }
    });
  });

  it('should not close restricted empty tags', (done) => {
    const productScript = `console.log('Product Script')`;

    const scope = nock('http://my-test-gateway-chunked.com', {
      reqheaders: {
        gateway: 'gateway'
      }
    })
      .get('/product/')
      .query({
        __renderMode: FRAGMENT_RENDER_MODES.STREAM
      })
      .reply(200, {
        main: '<div><span>Test</span><div></div></div>',
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
        placeholder: false,
        static: true
      },
      dependencies: [],
      assets: [],
      testCookie: 'test',
      version: '1.0.0'
    }, 'http://my-test-gateway-chunked.com', 'gateway');

    let err: boolean | null = null;

    template.compile({}).then(handler => {
      handler({}, createExpressMock({
        end(str: string) {
          try {
            expect(str).to.include(`<body><div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="main"><div><span>Test</span><div></div></div></div>`);
          } catch (e) {
            err = e;
          }
          done(err);
        }
      }));
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
            _attributes: {"from": "Browsing", "name": "product", "partial": "meta"},
            name: 'product',
            clientAsync: false,
            asyncDecentralized: false,
            primary: false,
            shouldWait: true,
            from: "Browsing",
            static: false
          }
        }
      }
    });
  });

  it('should parse static config fragments and inject them into first flush', (done) => {
    let scope = nock('http://my-test-gateway-static.com', {
      reqheaders: {
        gateway: 'gateway'
      }
    })
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
    }, 'http://my-test-gateway-static.com', 'gateway');

    template.compile({}).then(handler => {
      handler({}, createExpressMock({
        write(str: string) {
          expect(str).to.eq(null);
        },
        end(str: string) {
          expect(str).to.include(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="main"><div>Static Fragment</div>`);
          done();
        },
        status: () => ''
      }));
    });
  });

  it('should parse static config fragments and inject them into first flush with assets', (done) => {
    let scope = nock('http://my-test-gateway-static.com', {
      reqheaders: {
        gateway: 'gateway'
      }
    })
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
      assets: [
        {
          injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
          fileName: 'test.bundle.js',
          name: 'bundle',
          type: RESOURCE_TYPE.JS,
          location: RESOURCE_LOCATION.BODY_END
        }
      ] as any,
      testCookie: 'test',
      version: '1.0.0'
    }, 'http://my-test-gateway-static.com', 'gateway');

    template.compile({}).then(handler => {
      handler({}, createExpressMock({
        write(str: string) {
          expect(str).to.eq(null);
        },
        end(str: string) {
          expect(str).to.include(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="main"><div>Static Fragment</div>`);
          done();
        },
        status: () => ''
      }));
    });
  });

  it('should not close div tags automatically', (done) => {
    let scope = nock('http://my-test-gateway-static.com', {
      reqheaders: {
        gateway: 'gateway'
      }
    })
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
                        <div></div>
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
    }, 'http://my-test-gateway-static.com', 'gateway');

    template.compile({}).then(handler => {
      handler({}, createExpressMock({
        write(str: string) {
          expect(str).to.eq(null);
        },
        end(str: string) {
          expect(str).to.include(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="main"><div>Static Fragment</div></div><script>PuzzleJs.emit('1','product');</script><div></div></div>`);
          done();
        },
        status: () => ''
      }));
    });
  });

  it('should parse if config fragments and do not inject them', (done) => {
    let scope = nock('http://my-test-gateway-static-3.com', {
      reqheaders: {
        gateway: 'gateway'
      }
    })
      .get('/product/')
      .query({
        __renderMode: FRAGMENT_RENDER_MODES.STREAM
      })
      .reply(200, {
        main: '<div>Conditional Fragment</div>',
      });


    const template = new Template(`
                <template>
                    <div>
                        <fragment from="Browsing" name="product" if="${false}"> </fragment>
                    </div>
                </template>
            `);

    template.getDependencies();

    template.fragments.product.update({
      render: {
        url: '/'
      },
      dependencies: [],
      assets: [
        {
          injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
          fileName: 'test.bundle.js',
          name: 'bundle',
          type: RESOURCE_TYPE.JS,
          location: RESOURCE_LOCATION.BODY_END
        }
      ] as any,
      testCookie: 'test',
      version: '1.0.0'
    }, 'http://my-test-gateway-static-3.com', 'gateway');

    template.compile({}).then(handler => {
      handler({}, createExpressMock({
        write(str: string) {
          expect(str).to.eq(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main"></div></div>`);
        },
        end(str: string) {
          expect(str).to.eq(`<script>PuzzleJs.emit('0');</script></body></html>`);
          done();
        },
        status: () => ''
      }));
    });
  });

  it('should parse if config fragments with shouldWait and do not inject them', (done) => {
    let scope = nock('http://my-test-gateway-static-3.com', {
      reqheaders: {
        gateway: 'gateway'
      }
    })
      .get('/product/')
      .query({
        __renderMode: FRAGMENT_RENDER_MODES.STREAM
      })
      .reply(200, {
        main: '<div>Conditional Fragment</div>',
      });


    const template = new Template(`
                <template>
                    <div>
                        <fragment from="Browsing" name="product" shouldWait if="${false}"> </fragment>
                    </div>
                </template>
            `);

    template.getDependencies();

    template.fragments.product.update({
      render: {
        url: '/'
      },
      dependencies: [],
      assets: [
        {
          injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
          fileName: 'test.bundle.js',
          name: 'bundle',
          type: RESOURCE_TYPE.JS,
          location: RESOURCE_LOCATION.BODY_END
        }
      ] as any,
      testCookie: 'test',
      version: '1.0.0'
    }, 'http://my-test-gateway-static-3.com', 'gateway');

    template.compile({}).then(handler => {
      handler({}, createExpressMock({
        write(str: string) {
          expect(str).to.eq(null);
        },
        end(str: string) {
          expect(str).to.eq(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing"></div><script>PuzzleJs.emit('1','product');</script></div>`);
          done();
        },
        status: () => ''
      }));
    });
  });

  it('should render content not found static fragment that doesnt exists', (done) => {
    let scope = nock('http://my-test-gateway-static-2.com', {
      reqheaders: {
        gateway: 'gateway'
      }
    })
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
    }, 'http://my-test-gateway-static-2.com', 'gateway');

    template.compile({}).then(handler => {
      handler({}, createExpressMock({
        write(str: string) {
          expect(str).to.eq(null);
        },
        end(str: string) {
          expect(str).to.eq(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="main"><script>console.log('Fragment Part does not exists')</script></div><script>PuzzleJs.emit('1','product');</script></div>`);
          done();
        },
        status: () => ''
      }));
    });
  });

  it('should render content in debug mode with debug script', (done) => {
    let scope = nock('http://my-test-gateway-static-2.com', {
      reqheaders: {
        gateway: 'gateway'
      }
    })
      .get('/product/')
      .query({
        __renderMode: FRAGMENT_RENDER_MODES.STREAM
      })
      .reply(200, {
        nope: '<div>Nope Fragment</div>',
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
        static: true
      },
      dependencies: [],
      assets: [],
      testCookie: 'test',
      version: '1.0.0'
    }, 'http://my-test-gateway-static-2.com', 'gateway');

    template.compile({}, true).then(handler => {
      handler({}, createExpressMock({
        write(str: string) {
          expect(str).to.eq(null);
        },
        end(str: string) {
          expect(str).to.include('Puzzle');
          done();
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
        let scope = nock('http://my-test-gateway.com', {
          reqheaders: {
            gateway: 'gateway'
          }
        })
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
        }, 'http://my-test-gateway.com', 'gateway');


        template.compile({}).then(handler => {
          handler({}, createExpressMock({
            write(str: string) {

            },
            end(str: string) {
              try {
                expect(str).to.include(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div>`);
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
        let scope = nock('http://my-test-gateway.com', {
          reqheaders: {
            gateway: 'gateway'
          }
        })
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
        }, 'http://my-test-gateway.com', 'gateway');


        template.compile({}).then(handler => {
          handler({}, createExpressMock({
            write(str: string) {

            },
            end(str: string) {
              try {
                expect(str).to.include(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div><script>PuzzleJs.emit('1','product');</script></div><div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="gallery">List of great products</div><script>PuzzleJs.emit('1','product');</script></div>`);
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
        let scope = nock('http://my-test-gateway.com', {
          reqheaders: {
            gateway: 'gateway'
          }
        })
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
        }, 'http://my-test-gateway.com', 'gateway');

        template.fragments.product2.update({
          render: {
            url: '/'
          },
          dependencies: [],
          assets: [],
          testCookie: 'test',
          version: '1.0.0'
        }, 'http://my-test-gateway.com', 'gateway');


        template.compile({}).then(handler => {
          handler({}, createExpressMock({
            write(str: string) {

            },
            end(str: string) {
              try {
                expect(str).to.include(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div><script>PuzzleJs.emit('1','product');</script></div><div><div id="product2" puzzle-fragment="product2" puzzle-gateway="Browsing">List of great products</div><script>PuzzleJs.emit('1','product2');</script></div>`);
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
        let scope = nock('http://my-test-gateway.com', {
          reqheaders: {
            gateway: 'gateway'
          }
        })
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
        }, 'http://my-test-gateway.com', 'gateway');


        template.compile({}).then(handler => {
          handler({}, createExpressMock({
            write(str: string) {

            },
            end(str: string) {
              try {
                expect(str).to.eq(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div><script>PuzzleJs.emit('1','product');</script></div><div><div puzzle-fragment="product2" puzzle-gateway="Browsing"><script>console.log('Fragment Part does not exists')</script></div></div>`);
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
        let scope = nock('http://my-test-gateway.com', {
          reqheaders: {
            gateway: 'gateway'
          }
        })
          .get('/product/')
          .query({
            __renderMode: FRAGMENT_RENDER_MODES.STREAM
          })
          .reply(200, {
            main: 'Trendyol',
          });

        let scope2 = nock('http://my-test-gateway2.com', {
          reqheaders: {
            gateway: 'gateway2'
          }
        })
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
        }, 'http://my-test-gateway.com', 'gateway');

        template.fragments.header.update({
          render: {
            url: '/'
          },
          dependencies: [],
          assets: [],
          testCookie: 'test',
          version: '1.0.0'
        }, 'http://my-test-gateway2.com', 'gateway2');


        template.compile({}).then(handler => {
          handler({}, createExpressMock({
            write(str: string) {

            },
            end(str: string) {
              try {
                expect(str).to.eq(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div><script>PuzzleJs.emit('1','product');</script></div><div><div id="header" puzzle-fragment="header" puzzle-gateway="Common">Header Content</div><script>PuzzleJs.emit('1','header');</script></div>`);
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
        let scope = nock('http://my-test-gateway-chunked.com', {
          reqheaders: {
            gateway: 'gateway'
          }
        })
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
        }, 'http://my-test-gateway-chunked.com', 'gateway');

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
                expect(chunks[0]).to.include(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main"></div></div>`);
                expect(chunks[1]).to.include(`<div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_main">Trendyol</div><script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','product','[puzzle-chunk="product_main"]','[puzzle-chunk-key="product_main"]');</script>`);
                expect(chunks[2]).to.include(`</body></html>`);
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
        let scope = nock('http://my-test-gateway-chunked.com', {
          reqheaders: {
            gateway: 'gateway'
          }
        })
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
        }, 'http://my-test-gateway-chunked.com', 'gateway');

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
                expect(chunks[0]).to.include(`<div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main" puzzle-placeholder="product_main_placeholder">placeholder</div></div>`);
                expect(chunks[1]).to.eq(`<div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_main">Trendyol</div><script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','product','[puzzle-chunk="product_main"]','[puzzle-chunk-key="product_main"]');</script>`);
                expect(chunks[2]).to.include(`</body></html>`);
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
        let scope = nock('http://my-test-gateway-chunked-2.com', {
          reqheaders: {
            gateway: 'gateway'
          }
        }).log(console.log)
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
        }, 'http://my-test-gateway-chunked-2.com', 'gateway');

        template.fragments.header.update({
          render: {
            url: '/',
          },
          dependencies: [],
          assets: [],
          testCookie: 'test',
          version: '1.0.0'
        }, 'http://my-test-gateway-chunked-2.com', 'gateway');

        template.fragments.footer.update({
          render: {
            url: '/',
          },
          dependencies: [],
          assets: [],
          testCookie: 'test',
          version: '1.0.0'
        }, 'http://my-test-gateway-chunked-2.com', 'gateway');

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
                expect(chunks[0]).to.include(`<meta product="bag"/> </head><body><div id="header" puzzle-fragment="header" puzzle-gateway="Browsing">Header Content</div><script>PuzzleJs.emit('1','header');</script><div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol Product Content</div><script>PuzzleJs.emit('1','product');</script></div><div id="footer" puzzle-fragment="footer" puzzle-gateway="Browsing" puzzle-chunk="footer_main"></div>`);
                expect(chunks[1]).to.eq(`<div style="display: none;" puzzle-fragment="footer" puzzle-chunk-key="footer_main">Footer Content</div><script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','footer','[puzzle-chunk="footer_main"]','[puzzle-chunk-key="footer_main"]');</script>`);
                expect(chunks[2]).to.include(`</body></html>`);
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
        let scope = nock('http://my-test-gateway-chunked-3.com', {
          reqheaders: {
            gateway: 'gateway'
          }
        })
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
        }, 'http://my-test-gateway-chunked-3.com', 'gateway');


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
                expect(chunks[0]).to.include(`</head><body><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="header" puzzle-chunk="product_header"></div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main" puzzle-placeholder="product_main_placeholder">product content placeholder</div><div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="side" puzzle-chunk="product_side"></div></div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="footer" puzzle-chunk="product_footer"></div>`);
                expect(chunks[1]).to.eq(`<div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_header">Header Content</div><script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','product','[puzzle-chunk="product_header"]','[puzzle-chunk-key="product_header"]');</script><div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_main">Trendyol Product Content</div><script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','product','[puzzle-chunk="product_main"]','[puzzle-chunk-key="product_main"]');</script><div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_side">Side Content</div><script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','product','[puzzle-chunk="product_side"]','[puzzle-chunk-key="product_side"]');</script><div style="display: none;" puzzle-fragment="product" puzzle-chunk-key="product_footer">Footer Content</div><script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','product','[puzzle-chunk="product_footer"]','[puzzle-chunk-key="product_footer"]');</script>`);
                expect(str).to.eq(`<script>PuzzleJs.emit('${EVENT.ON_PAGE_LOAD}');</script></body></html>`);
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
        let scope = nock('http://my-test-gateway-chunked.com', {
          reqheaders: {
            gateway: 'gateway'
          }
        })
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
        }, 'http://my-test-gateway-chunked.com', 'gateway');

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
                expect(str).to.include(`<div id="product-not-exists" puzzle-fragment="product-not-exists" puzzle-gateway="Browsing">Trendyol</div>`);
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
  });
});
