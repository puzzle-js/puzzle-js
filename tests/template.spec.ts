import {expect} from "chai";
import {Template} from "../src/template";
import {FragmentSentryConfig, FRAGMENT_RENDER_MODES, RESOURCE_INJECT_TYPE, RESOURCE_LOCATION} from "../src/enums";
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
          ready: false,
          fragments: {
            product: {
              gateway: 'Browsing',
              instance: {
                "_attributes": {
                  "from": "Browsing",
                  "name": "product",
                },
                clientAsync: false,
                clientAsyncForce: false,
                asyncDecentralized: false,
                criticalCss: false,
                onDemand: false,
                name: 'product',
                primary: false,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
            }
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

  it('should compile page with Intersection Observer options', async () => {
    const fragmentSentryConfig: Record<string, FragmentSentryConfig> = { product: FragmentSentryConfig.CLIENT_ASYNC };

    const intersectionObserverOptions: IntersectionObserverInit = {
      rootMargin: "500px",
    }
    const template = new Template('<template><div><fragment from="Browsing" name="product" client-async></fragment></div></template>', "product-detail-async", fragmentSentryConfig ,intersectionObserverOptions);
    const dependencyList = template.getDependencies();
    expect(dependencyList).to.deep.include({
      gateways: {
        Browsing: {
          gateway: null,
          ready: false,
          fragments: {
            product: {
              gateway: 'Browsing',
              instance: {
                "_attributes": {},
                clientAsync: true,
                clientAsyncForce: false,
                asyncDecentralized: false,
                criticalCss: false,
                onDemand: false,
                name: 'product',
                primary: false,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
            }
          }
        }
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
          ready: false,
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
                clientAsyncForce: false,
                asyncDecentralized: false,
                criticalCss: false,
                onDemand: false,
                name: 'product',
                primary: true,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
            }
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
          ready: false,
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
                clientAsyncForce: false,
                asyncDecentralized: false,
                criticalCss: false,
                onDemand: false,
                name: 'product',
                primary: false,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
            }
          }
        }
      }
    });
  });

  it('should parse fragment attribute enable-redirect', () => {
    const template = new Template('<template><div><fragment from="Browsing" name="product" enable-redirect></fragment></div></template>');
    const dependencyList = template.getDependencies();
    expect(dependencyList).to.deep.include({
      gateways: {
        Browsing: {
          gateway: null,
          ready: false,
          fragments: {
            product: {
              gateway: 'Browsing',
              instance: {
                "_attributes": {
                  "from": "Browsing",
                  "name": "product",
                  "enable-redirect": ""
                },
                clientAsync: false,
                clientAsyncForce: false,
                asyncDecentralized: false,
                criticalCss: false,
                onDemand: false,
                name: 'product',
                primary: false,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
            }
          }
        }
      }
    });
  });

  it('should parse fragment attribute clientAsyncForce', () => {
    const template = new Template('<template><div><fragment from="Browsing" name="product" client-async client-async-force></fragment></div></template>');
    const dependencyList = template.getDependencies();
    expect(dependencyList).to.deep.include({
      gateways: {
        Browsing: {
          gateway: null,
          ready: false,
          fragments: {
            product: {
              gateway: 'Browsing',
              instance: {
                "_attributes": {},
                clientAsync: true,
                clientAsyncForce: true,
                asyncDecentralized: false,
                criticalCss: false,
                onDemand: false,
                name: 'product',
                primary: false,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
            }
          }
        }
      }
    });
  });

  it('should parse fragment attribute on-demand', () => {
    const template = new Template('<template><div><fragment from="Browsing" name="product" client-async on-demand></fragment></div></template>');
    const dependencyList = template.getDependencies();
    expect(dependencyList).to.deep.include({
      gateways: {
        Browsing: {
          gateway: null,
          ready: false,
          fragments: {
            product: {
              gateway: 'Browsing',
              instance: {
                "_attributes": {},
                clientAsync: true,
                clientAsyncForce: false,
                criticalCss: false,
                onDemand: true,
                asyncDecentralized: false,
                name: 'product',
                primary: false,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
            }
          }
        }
      }
    });
  });

  it('should parse fragment attribute critical-css', () => {
    const template = new Template('<template><div><fragment from="Browsing" name="product" client-async critical-css></fragment></div></template>');
    const dependencyList = template.getDependencies();
    expect(dependencyList).to.deep.include({
      gateways: {
        Browsing: {
          gateway: null,
          ready: false,
          fragments: {
            product: {
              gateway: 'Browsing',
              instance: {
                "_attributes": {},
                clientAsync: true,
                clientAsyncForce: false,
                criticalCss: true,
                onDemand: false,
                asyncDecentralized: false,
                name: 'product',
                primary: false,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
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
          ready: false,
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
                clientAsyncForce: false,
                asyncDecentralized: false,
                criticalCss: false,
                onDemand: false,
                name: 'product',
                primary: true,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
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
          ready: false,
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
                clientAsyncForce: false,
                asyncDecentralized: false,
                criticalCss: false,
                onDemand: false,
                name: 'product',
                primary: false,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
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
          ready: false,
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
                clientAsyncForce: false,
                asyncDecentralized: false,
                criticalCss: false,
                onDemand: false,
                name: 'product',
                primary: false,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
            }
          }
        }
      }
    });
  });

  // it('should not close restricted empty tags', (done) => {
  //   const productScript = `console.log('Product Script')`;
  //
  //   const scope = nock('http://my-test-gateway-chunked.com', {
  //     reqheaders: {
  //       gateway: 'gateway'
  //     }
  //   })
  //     .get('/product/')
  //     .query({
  //       __renderMode: FRAGMENT_RENDER_MODES.STREAM
  //     })
  //     .reply(200, {
  //       main: '<div><span>Test</span><div></div></div>',
  //     });
  //
  //
  //   const template = new Template(`
  //                   <template>
  //                       <html>
  //                           <head>
  //
  //                           </head>
  //                           <body>
  //                             <div>
  //                                 <fragment from="Browsing" name="product"> </fragment>
  //                             </div>
  //                           </body>
  //                       </html>
  //                   </template>
  //               `);
  //
  //   template.getDependencies();
  //
  //   template.fragments.product.update({
  //     render: {
  //       url: '/',
  //       placeholder: false,
  //       static: true
  //     },
  //     dependencies: [],
  //     assets: [],
  //     testCookie: 'test',
  //     version: '1.0.0'
  //   }, 'http://my-test-gateway-chunked.com', 'gateway');
  //
  //   let err: boolean | null = null;
  //
  //   template.compile({}).then(handler => {
  //     handler({}, createExpressMock({
  //       end(str: string) {
  //         try {
  //           expect(str).to.include(`<body><div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="main"><div><span>Test</span><div></div></div></div>`);
  //         } catch (e) {
  //           err = e;
  //         }
  //         done(err);
  //       }
  //     }));
  //   });
  // });

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
          ready: false,
          fragments: {
            product: {
              gateway: 'Browsing',
              instance: {
                _attributes: {"from": "Browsing", "name": "product", "partial": "meta"},
                name: 'product',
                clientAsync: false,
                clientAsyncForce: false,
                asyncDecentralized: false,
                criticalCss: false,
                onDemand: false,
                primary: false,
                shouldWait: true,
                from: "Browsing",
                static: false
              }
            }
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

    template.fragments.find(f => f.name === "product")!.update({
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

    template.fragments.find(f => f.name === "product")!.update({
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

    template.fragments.find(f => f.name === "product")!.update({
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
          expect(str).to.include(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="main"><div>Static Fragment</div></div><div></div></div>`);
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
                        <fragment from="Browsing" name="product" if="${false}" chunked> </fragment>
                    </div>
                </template>
            `);

    template.getDependencies();

    template.fragments.find(f => f.name === "product")!.update({
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
          expect(str).to.eq(`<div>  </div>`);
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

    template.fragments.find(f => f.name === "product")!.update({
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
          expect(str).to.eq(`<div>  </div>`);
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

    template.fragments.find(f => f.name === "product")!.update({
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
          expect(str).to.eq(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="main"><script>console.log('Fragment Part does not exists')</script></div></div>`);
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

    template.fragments.find(f => f.name === "product")!.update({
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

        template.fragments.find(f => f.name === "product")!.update({
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

        template.fragments.find(f => f.name === "product")!.update({
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
                expect(str).to.include(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="gallery">List of great products</div></div>`);
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

        template.fragments.find(f => f.name === "product")!.update({
          render: {
            url: '/'
          },
          dependencies: [],
          assets: [],
          testCookie: 'test',
          version: '1.0.0'
        }, 'http://my-test-gateway.com', 'gateway');

        template.fragments.find(f => f.name === "product2")!.update({
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
                expect(str).to.include(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div id="product2" puzzle-fragment="product2" puzzle-gateway="Browsing">List of great products</div></div>`);
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

        template.fragments.find(f => f.name === "product")!.update({
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
                expect(str).to.eq(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div puzzle-fragment="product2" puzzle-gateway="Browsing"><script>console.log('Fragment Part does not exists')</script></div></div>`);
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

        template.fragments.find(f => f.name === "product")!.update({
          render: {
            url: '/'
          },
          dependencies: [],
          assets: [],
          testCookie: 'test',
          version: '1.0.0'
        }, 'http://my-test-gateway.com', 'gateway');

        template.fragments.find(f => f.name === "header")!.update({
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
                expect(str).to.eq(`<div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol</div></div><div><div id="header" puzzle-fragment="header" puzzle-gateway="Common">Header Content</div></div>`);
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
                                <fragment from="Browsing" name="product" chunked></fragment>
                            </div>
                            </body>
                        </html>
                    </template>
                `);

        template.getDependencies();

        template.fragments.find(f => f.name === "product")!.update({
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
                                <fragment from="Browsing" name="product" chunked></fragment>
                            </div>
                            </body>
                        </html>
                    </template>
                `);

        template.getDependencies();

        template.fragments.find(f => f.name === "product")!.update({
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

      it('should respond correctly with partial and main placeholders with client-async mode', done => {
        const placeholderContent = "{\"main\":\"<div>placeholder</div>\",\"partial-1\":\"<div>partial placeholder</div>\"}"
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
          .reply(200, placeholderContent);


        const template = new Template(`
                    <template>
                        <html>
                            <head>
                            
                            </head>
                            <body>
                            <div>
                                <fragment from="Browsing" name="product" client-async ></fragment>
                                <fragment from="Browsing" name="product" partial="partial-1" ></fragment>
                            </div>
                            </body>
                        </html>
                    </template>
                `);

        template.getDependencies();

        template.fragments.find(f => f.name === "product")!.update({
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
              expect(str).to.include(`<div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" puzzle-chunk="product_main" puzzle-placeholder="product_main_placeholder">${JSON.parse(placeholderContent)['main']}</div></div>`);
              expect(str).to.include(`<div id="product" puzzle-fragment="product" puzzle-gateway="Browsing" fragment-partial="partial-1"><div>${JSON.parse(placeholderContent)['partial-1']}</div></div>`);
            },
            end(str: string) {
              done();
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
                                <fragment from="Browsing" name="footer" chunked></fragment>
                            </body>
                        </html>
                    </template>
                `);

        template.getDependencies();

        template.fragments.find(f => f.name === "product")!.update({
          render: {
            url: '/',
          },
          dependencies: [],
          assets: [],
          testCookie: 'test',
          version: '1.0.0'
        }, 'http://my-test-gateway-chunked-2.com', 'gateway');

        template.fragments.find(f => f.name === "header")!.update({
          render: {
            url: '/',
          },
          dependencies: [],
          assets: [],
          testCookie: 'test',
          version: '1.0.0'
        }, 'http://my-test-gateway-chunked-2.com', 'gateway');

        template.fragments.find(f => f.name === "footer")!.update({
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
                expect(chunks[0]).to.include(`<meta product="bag"/> </head><body><div id="header" puzzle-fragment="header" puzzle-gateway="Browsing">Header Content</div><div><div id="product" puzzle-fragment="product" puzzle-gateway="Browsing">Trendyol Product Content</div></div><div id="footer" puzzle-fragment="footer" puzzle-gateway="Browsing" puzzle-chunk="footer_main"></div>`);
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
                                <fragment from="Browsing" name="product" partial="header" chunked></fragment>
                                <fragment from="Browsing" name="product" chunked></fragment>
                                <div>
                                    <fragment from="Browsing" name="product" partial="side" chunked></fragment>
                                </div>
                                <fragment from="Browsing" name="product" partial="footer" chunked></fragment>
                            </body>
                        </html>
                    </template>
                `);

        template.getDependencies();

        template.fragments.find(f => f.name === "product")!.update({
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

        template.fragments.find(f => f.name === 'product-not-exists')!.update({
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

      it('should return given status code', () => {
        let scope = nock('http://my-test-gateway-chunked.com', {
          reqheaders: {
            gateway: 'gateway'
          }
        })
          .get('/404')
          .query({
            __renderMode: FRAGMENT_RENDER_MODES.STREAM
          })
          .reply(200, {
            main: 'Trendyol',
          });

        const template = new Template(`
                    <template>
                        <html>
                            <head> </head>
                            <body> </body>
                        </html>
                    </template>
                `);

        template.pageClass.onRequest = (request) => {
          request.statusCode = 404;
        };

        template.compile({}).then(handler => {
          handler({}, createExpressMock({
            status(statusCode: number) {
              expect(statusCode).to.eq(404);
            }
          }));
        });
      });
    });
  });
});
