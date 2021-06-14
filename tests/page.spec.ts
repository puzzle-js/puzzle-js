import {Page} from "../src/page";
import {expect} from "chai";
import * as fs from "fs";
import * as path from "path";
import {GatewayStorefrontInstance} from "../src/gatewayStorefront";
import {createGateway} from "./mock/mock";
import {EVENTS} from "../src/enums";
import sinon from "sinon";

const sandbox = sinon.createSandbox();

describe('Page', () => {
  afterEach(() => {
    sandbox.verifyAndRestore();
  });

  it('should create new page instance', () => {
    const template = fs.readFileSync(path.join(__dirname, './templates/noFragments.html'), 'utf8');
    const newPage = new Page(template, {}, '');

    expect(newPage).to.be.instanceOf(Page);
  });

  it('should parse template with no fragments', () => {
    const template = fs.readFileSync(path.join(__dirname, './templates/noFragmentsWithClass.html'), 'utf8');
    const newPage = new Page(template, {}, '');

    expect(newPage).to.be.instanceOf(Page);
  });

  it('should parse template with fragments', () => {
    const template = fs.readFileSync(path.join(__dirname, './templates/fragmented1.html'), 'utf8');
    const newPage = new Page(template, {}, '');

    expect(newPage).to.be.instanceOf(Page);
  });

  it('should create gateway dependencies', () => {
    const template = fs.readFileSync(path.join(__dirname, './templates/fragmented1.html'), 'utf8');
    const newPage = new Page(template, {}, '');

    expect(newPage.gatewayDependencies).to.deep.include({
      fragments: {
        header: {
          gateway: 'Browsing',
          instance: {
            "_attributes": {
              "from": "Browsing",
              "name": "header",
            },
            name: 'header',
            clientAsync: false,
            clientAsyncForce: false,
            asyncDecentralized: false,
            primary: false,
            shouldWait: false,
            from: "Browsing",
            static: false
          }
        },
        content: {
          gateway: 'Browsing',
          instance: {
            "_attributes": {
              "from": "Browsing",
              "name": "content",
            },
            name: 'content',
            primary: false,
            clientAsync: false,
            clientAsyncForce: false,
            asyncDecentralized: false,
            shouldWait: false,
            from: "Browsing",
            static: false
          }
        },
        footer: {
          gateway: 'Browsing',
          instance: {
            "_attributes": {
              "from": "Browsing",
              "name": "footer",
            },
            name: 'footer',
            primary: false,
            clientAsync: false,
            clientAsyncForce: false,
            asyncDecentralized: false,
            shouldWait: false,
            from: "Browsing",
            static: false
          }
        }
      },
      gateways: {
        Browsing: {
          gateway: null,
          ready: false
        }
      }
    });
  });

  it('should track for gateways to get ready', done => {
    const commonGatewayStorefrontConfiguration = {
      name: 'Browsing',
      url: 'http://browsing-gw.com',
      config: {
        hash: '44',
        fragments: {
          header: {
            version: '1.0.0',
            render: {
              url: '/'
            },
            assets: [],
            dependencies: [],
            testCookie: 'test_1'
          }
        }
      }
    };
    createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
    const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);
    const template = fs.readFileSync(path.join(__dirname, './templates/fragmented2.html'), 'utf8');
    const newPage = new Page(template, {
      Browsing: gateway
    }, '');

    gateway.events.on(EVENTS.GATEWAY_READY, () => {
      expect(newPage.gatewayDependencies.gateways['Browsing'].ready).to.eq(true);
      done();
    });
  });

  it('should set page status to ready gateways are already ready', () => {
    const commonGatewayStorefrontConfiguration = {
      name: 'Browsing',
      url: 'http://browsing-gw.com',
      config: {
        hash: '44',
        fragments: {
          header: {
            version: '1.0.0',
            render: {
              url: '/'
            },
            assets: [],
            dependencies: [],
            testCookie: 'test_1'
          }
        }
      }
    };
    createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
    const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);

    const template = fs.readFileSync(path.join(__dirname, './templates/fragmented2.html'), 'utf8');
    gateway.config = {
      hash: '44',
      fragments: {
        header: {
          version: '1.0.0',
          render: {
            url: '/'
          },
          assets: [],
          dependencies: [],
          testCookie: 'test_1'
        }
      }
    };
    const newPage = new Page(template, {
      Browsing: gateway
    }, '');

    expect(newPage.gatewayDependencies.gateways.Browsing.ready).to.eq(true);
    expect(newPage.ready).to.eq(true);
  });

  it('should wait for all gateways to be ready to change status to ready', done => {
    const commonGatewayStorefrontConfiguration = {
      name: 'Browsing',
      url: 'http://browsing-gw.com',
      config: {
        hash: '44',
        fragments: {
          header: {
            version: '1.0.0',
            render: {
              url: '/'
            },
            assets: [],
            dependencies: [],
            testCookie: 'test_1'
          }
        }
      }
    };
    const commonGatewayStorefrontConfiguration2 = {
      name: 'Search',
      url: 'http://browsing-gw.com',
      config: {
        hash: '44',
        fragments: {
          search: {
            version: '1.0.0',
            render: {
              url: '/'
            },
            assets: [],
            dependencies: [],
            testCookie: 'test_1'
          }
        }
      }
    };
    createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
    createGateway(commonGatewayStorefrontConfiguration2.name, commonGatewayStorefrontConfiguration2.url, commonGatewayStorefrontConfiguration2.config, true);
    const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);
    const gateway2 = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration2);
    const template = fs.readFileSync(path.join(__dirname, './templates/fragmented3.html'), 'utf8');
    const newPage = new Page(template, {
      Browsing: gateway,
      Search: gateway2
    }, '');
    let i = 0;

    gateway.events.on(EVENTS.GATEWAY_READY, () => {
      expect(newPage.gatewayDependencies.gateways['Browsing'].ready).to.eq(true);
      i++;
      if (i === 2) {
        expect(newPage.ready).to.eq(true);
        done();
      }
    });

    gateway2.events.on(EVENTS.GATEWAY_READY, () => {
      expect(newPage.gatewayDependencies.gateways['Search'].ready).to.eq(true);
      i++;
      if (i === 2) {
        expect(newPage.ready).to.eq(true);
        done();
      }
    });
  });

  it('should update fragment information when gateways updated', done => {
    const commonGatewayStorefrontConfiguration = {
      name: 'Browsing',
      url: 'http://browsing-gw.com',
      config: {
        hash: '44',
        fragments: {
          header: {
            version: '1.0.0',
            render: {
              url: '/'
            },
            assets: [],
            dependencies: [],
            testCookie: 'test_1'
          }
        }
      }
    };
    createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
    const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);
    const template = fs.readFileSync(path.join(__dirname, './templates/fragmented2.html'), 'utf8');
    const newPage = new Page(template, {
      Browsing: gateway
    }, '');

    gateway.events.on(EVENTS.GATEWAY_READY, () => {
      expect(newPage.gatewayDependencies.gateways['Browsing'].ready).to.eq(true);

      if (gateway.config) {
        gateway.config.fragments.header.testCookie = 'zek';
        gateway.events.emit(EVENTS.GATEWAY_UPDATED, gateway);
      }
    });

    gateway.events.on(EVENTS.GATEWAY_UPDATED, () => {
      if (gateway.config) {
        expect(gateway.config.fragments.header.testCookie).to.eq('zek');
        if (newPage.gatewayDependencies.fragments.header.instance.config) {
          expect(newPage.gatewayDependencies.fragments.header.instance.config.testCookie).to.eq('zek');
          done();
        } else {
          done('config does not exists on istance');
        }
      } else {
        done('Gateway config is not defined');
      }
    });
  });

  it('should compile page without fragments cookies (default version)', done => {
    const commonGatewayStorefrontConfiguration = {
      name: 'Browsing',
      url: 'http://browsing-gw.com',
      config: {
        hash: '44',
        fragments: {
          header: {
            version: '1.0.0',
            render: {
              url: '/'
            },
            assets: [],
            dependencies: [],
            testCookie: 'test_1'
          }
        }
      }
    };
    createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
    const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);
    const template = fs.readFileSync(path.join(__dirname, './templates/fragmented2.html'), 'utf8');
    const newPage = new Page(template, {
      Browsing: gateway,
    }, 'page');

    gateway.events.on(EVENTS.GATEWAY_READY, async () => {
      await newPage.reCompile();
      expect(newPage.responseHandlers).to.haveOwnProperty('_header|1.0.0_content|0_footer|0_true');
      expect(newPage.responseHandlers).to.haveOwnProperty('_header|1.0.0_content|0_footer|0_false');
      done();
    });
  });

  it('should compile page without fragments cookies (version matcher)', done => {
    const commonGatewayStorefrontConfiguration = {
      name: 'Browsing',
      url: 'http://browsing-gw.com',
      config: {
        hash: '44',
        fragments: {
          header: {
            version: '1.0.0',
            versionMatcher: `cookies => '1.0.1'`,
            render: {
              url: '/'
            },
            assets: [],
            dependencies: [],
            testCookie: 'test_1'
          }
        }
      }
    };
    createGateway(commonGatewayStorefrontConfiguration.name, commonGatewayStorefrontConfiguration.url, commonGatewayStorefrontConfiguration.config, true);
    const gateway = new GatewayStorefrontInstance(commonGatewayStorefrontConfiguration);
    const template = fs.readFileSync(path.join(__dirname, './templates/fragmented2.html'), 'utf8');
    const newPage = new Page(template, {
      Browsing: gateway,
    }, 'page');

    gateway.events.on(EVENTS.GATEWAY_READY, async () => {
      await newPage.reCompile();
      expect(newPage.responseHandlers).to.haveOwnProperty('_header|1.0.0_content|0_footer|0_true');
      expect(newPage.responseHandlers).to.haveOwnProperty('_header|1.0.0_content|0_footer|0_false');
      done();
    });
  });

  it('should create new handler on new version', async () => {
    // Arrange
    const template = fs.readFileSync(path.join(__dirname, './templates/fragmented1.html'), 'utf8');
    const newPage = new Page(template, {}, '');
    const response = {};
    const request = {
      cookies: {},
      query: {}
    };
    const stub = sandbox.stub(newPage.template, 'compile').resolves(() => {
    });

    // Act
    await newPage.handle(request, response);

    // Assert
    expect(stub.calledWithExactly(request.cookies, false));
    expect(newPage.responseHandlers['_header|0_content|0_footer|0_true']).to.be.a('function');
  });

  it('should create new handler on new version while other wait for compile process', async () => {
    // Arrange
    const template = fs.readFileSync(path.join(__dirname, './templates/fragmented1.html'), 'utf8');
    const newPage = new Page(template, {}, '');
    const response = {};
    const request = {
      cookies: {},
      query: {}
    };
    const stub = sandbox.stub(newPage.template, 'compile').resolves(() => {
    });

    // Act
    await Promise.all([
      (async () => {
        await newPage.handle(request, response);
      })(),
      (async () => {
        await newPage.handle(request, response);
      })()
    ]);

    // Assert
    expect(stub.calledWithExactly(request.cookies, sinon.match.bool)).to.eq(true);
    expect(stub.calledOnce).to.eq(true);
    expect(newPage.responseHandlers['_header|0_content|0_footer|0_true']).to.be.a('function');
  });
});
