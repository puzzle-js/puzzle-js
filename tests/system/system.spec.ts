import {expect} from "chai";
import {Storefront} from "../../src/storefront";
import request from "supertest";
import {GatewayBFF} from "../../src/gatewayBFF";
import path from "path";
import {GatewayConfigurator} from "../../src/configurator";
import {INJECTABLE, TRANSFER_PROTOCOLS} from "../../src/enums";
import {TLS_CERT, TLS_KEY, TLS_PASS} from "../core.settings";
import {EVENT} from "@puzzle-js/client-lib/dist/enums";

describe('System Tests', () => {
  const closeInstance = (instance, done) => {
    if (instance.gateways) {
      Object.values(instance.gateways).forEach((instance: any) => instance.stopUpdating());
    }
    instance.server.close(done);
  };

  it('should render single fragment',(done) => {
    const gatewayConfigurator = new GatewayConfigurator();
    gatewayConfigurator.register('handler', INJECTABLE.HANDLER, {
      data() {
        return {
          data: {}
        };
      },
      placeholder() {

      },
      content() {
        return {
          main: 'Fragment Content'
        };
      }
    });
    gatewayConfigurator.config({
      serverOptions: {
        port: 4451
      },
      name: 'Browsing',
      url: 'http://localhost:4451/',
      fragments: [
        {
          name: 'example',
          render: {
            url: '/'
          },
          version: '1.0.0',
          testCookie: 'example',
          versions: {
            '1.0.0': {
              assets: [],
              dependencies: [],
              handler: 'handler'
            }
          }
        }
      ],
      api: [],
      isMobile: true,
      fragmentsFolder: path.join(__dirname, "./fragments")
    } as any);
    const gatewayInstance = new GatewayBFF(gatewayConfigurator);

    const storefrontInstance = new Storefront({
      pages: [
        {
          url: '/',
          html: '<template><html><head></head><body><fragment from="Browsing" name="example"></fragment></body></html></template>'
        }
      ],
      serverOptions: {
        port: 4450
      },
      gateways: [{
        name: 'Browsing',
        url: 'http://localhost:4451/'
      }],
      dependencies: [],
    } as any);

    gatewayInstance.init(() => {
      console.log('Gateway is working');
    });

    storefrontInstance.init(() => {
      console.log('Storefront is working');

      request(storefrontInstance.server.handler.getApp())
        .get('/healthcheck')
        .expect(200)
        .end(err => {

          request(storefrontInstance.server.handler.getApp())
            .get('/')
            .expect(200)
            .end((err, res) => {
              closeInstance(storefrontInstance, done);
              closeInstance(gatewayInstance, done);
              expect(res.text).to.include(`<body><div id="example" puzzle-fragment="example" puzzle-gateway="Browsing" puzzle-chunk="example_main"></div>`);
              expect(res.text).to.include(`<div style="display: none;" puzzle-fragment="example" puzzle-chunk-key="example_main">Fragment Content</div><script>PuzzleJs.emit('${EVENT.ON_FRAGMENT_RENDERED}','example','[puzzle-chunk="example_main"]','[puzzle-chunk-key="example_main"]');</script>`);
            });
        });
    });
  });

  it('should render single static fragment', (done) => {
    const gatewayConfigurator = new GatewayConfigurator();
    gatewayConfigurator.register('handler', INJECTABLE.HANDLER, {
      data() {
        return {
          data: {}
        };
      },
      placeholder() {

      },
      content() {
        return {
          main: 'Fragment Content'
        };
      }
    });
    gatewayConfigurator.config({
      serverOptions: {
        port: 4451
      },
      name: 'Browsing',
      url: 'http://localhost:4451/',
      fragments: [
        {
          name: 'example',
          render: {
            url: '/',
            static: true
          },
          version: '1.0.0',
          testCookie: 'example',
          versions: {
            '1.0.0': {
              assets: [],
              dependencies: [],
              handler: 'handler'
            }
          }
        }
      ],
      api: [],
      isMobile: true,
      fragmentsFolder: path.join(__dirname, "./fragments")
    } as any);
    const gatewayInstance = new GatewayBFF(gatewayConfigurator);

    const storefrontInstance = new Storefront({
      pages: [
        {
          url: '/',
          html: '<template><html><head></head><body><fragment from="Browsing" name="example"></fragment></body></html></template>'
        }
      ],
      serverOptions: {
        port: 4450
      },
      gateways: [{
        name: 'Browsing',
        url: 'http://localhost:4451/'
      }],
      dependencies: [],
    } as any);

    gatewayInstance.init(() => {
      console.log('Gateway is working');
    });

    storefrontInstance.init(() => {
      console.log('Storefront is working');

      request(storefrontInstance.server.handler.getApp())
        .get('/healthcheck')
        .expect(200)
        .end(err => {

          request(storefrontInstance.server.handler.getApp())
            .get('/')
            .expect(200)
            .end((err, res) => {
              closeInstance(storefrontInstance, done);
              closeInstance(gatewayInstance, done);
              expect(res.text).to.include(`<body><div id="example" puzzle-fragment="example" puzzle-gateway="Browsing" fragment-partial="main">Fragment Content</div>`);
            });
        });
    });
  });

  it('should render single static fragment using HTTPS', (done) => {
    const gatewayConfigurator = new GatewayConfigurator();
    gatewayConfigurator.register('handler', INJECTABLE.HANDLER, {
      data() {
        return {
          data: {}
        };
      },
      placeholder() {

      },
      content() {
        return {
          main: 'Fragment Content'
        };
      }
    });
    gatewayConfigurator.config({
      serverOptions: {
        port: 4451,
        https: {
          key: TLS_KEY,
          cert: TLS_CERT
        }
      },
      name: 'Browsing',
      url: 'https://localhost:4451/',
      fragments: [
        {
          name: 'example',
          render: {
            url: '/',
            static: true
          },
          version: '1.0.0',
          testCookie: 'example',
          versions: {
            '1.0.0': {
              assets: [],
              dependencies: [],
              handler: 'handler'
            }
          }
        }
      ],
      api: [],
      isMobile: true,
      fragmentsFolder: path.join(__dirname, "./fragments")
    } as any);
    const gatewayInstance = new GatewayBFF(gatewayConfigurator);

    const storefrontInstance = new Storefront({
      pages: [
        {
          url: '/',
          html: '<template><html><head></head><body><fragment from="Browsing" name="example"></fragment></body></html></template>'
        }
      ],
      serverOptions: {
        port: 4450,
        https: {
          key: TLS_KEY,
          cert: TLS_CERT
        }
      },
      gateways: [{
        name: 'Browsing',
        url: 'https://localhost:4451/'
      }],
      dependencies: []
    } as any);

    gatewayInstance.init(() => {
      console.log('Gateway is working');
    });

    storefrontInstance.init(() => {
      console.log('Storefront is working');

      request(storefrontInstance.server.handler.getApp())
        .get('/healthcheck')
        .expect(200)
        .end(err => {

          request(storefrontInstance.server.handler.getApp())
            .get('/')
            .expect(200)
            .end((err, res) => {
              closeInstance(storefrontInstance, done);
              closeInstance(gatewayInstance, done);
              expect(res.text).to.include(`<div id="example" puzzle-fragment="example" puzzle-gateway="Browsing" fragment-partial="main">Fragment Content</div>`);
            });
        });
    });
  });

  it('should render single fragment with header', (done) => {
    const gatewayConfigurator = new GatewayConfigurator();
    const customCookieExpiredDate = new Date(Date.now() + 1000 * 60 * 60 * 4);

    gatewayConfigurator.register('handler', INJECTABLE.HANDLER, {
      data() {
        return {
          data: {},
          $headers: {
            custom: 'custom value'
          },
          $cookies: {
            customCookie1: {
              value: 'customValue1',
              options: {
                expires: customCookieExpiredDate
              }
            },
            customCookie2: {
              value: 'customValue2'
            }
          }
        };
      },
      placeholder() {

      },
      content() {
        return {
          main: 'Fragment Content'
        };
      }
    });
    gatewayConfigurator.config({
      serverOptions: {
        port: 4453
      },
      name: 'Browsing',
      url: 'http://localhost:4453/',
      fragments: [
        {
          name: 'example',
          render: {
            url: '/'
          },
          version: '1.0.0',
          testCookie: 'example',
          versions: {
            '1.0.0': {
              assets: [],
              dependencies: [],
              handler: 'handler'
            }
          }
        }
      ],
      api: [],
      isMobile: true,
      fragmentsFolder: path.join(__dirname, "./fragments")
    } as any);
    const gatewayInstance = new GatewayBFF(gatewayConfigurator);

    const storefrontInstance = new Storefront({
      pages: [
        {
          url: '/',
          html: '<template><html><head></head><body><fragment from="Browsing" name="example" primary></fragment></body></html></template>'
        }
      ],
      serverOptions: {
        port: 4454
      },
      gateways: [{
        name: 'Browsing',
        url: 'http://localhost:4453/'
      }],
      dependencies: [],
    } as any);

    gatewayInstance.init(() => {
      console.log('Gateway is working');
    });

    storefrontInstance.init(() => {
      console.log('Storefront is working');

      request(storefrontInstance.server.handler.getApp())
        .get('/healthcheck')
        .expect(200)
        .end(err => {

          request(storefrontInstance.server.handler.getApp())
            .get('/')
            .expect(200)
            .end((err, res) => {
              closeInstance(storefrontInstance, done);
              closeInstance(gatewayInstance, done);
              expect(res.header['custom']).to.eq('custom value');
              expect(res.header['set-cookie'][0]).to.eq(`customCookie1=customValue1; Path=/; Expires=${customCookieExpiredDate.toUTCString()}`);
              expect(res.header['set-cookie'][1]).to.eq(`customCookie2=customValue2; Path=/`);
              expect(res.text).to.include(`<body><div id="example" puzzle-fragment="example" puzzle-gateway="Browsing">Fragment Content</div>`);
            });
        });
    });
  });

  /** todo add model test
   * @deprecated
   it('should render single fragment with model', function (done) {
    const gatewayConfigurator = new GatewayConfigurator();
    const customModel = faker.helpers.createTransaction();
    const gatewayRender = faker.random.words();
    gatewayConfigurator.register('handler', INJECTABLE.HANDLER, {
      data() {
        return {
          data: {},
          $model: {
            transaction: customModel
          }
        };
      },
      placeholder() {
        return '';
      },
      content() {
        return {
          main: gatewayRender
        };
      }
    });
    gatewayConfigurator.config({
      port: 4451,
      name: 'Browsing',
      url: 'http://localhost:4451/',
      fragments: [
        {
          name: 'example',
          render: {
            url: '/'
          },
          version: '1.0.0',
          testCookie: 'example',
          versions: {
            '1.0.0': {
              assets: [],
              dependencies: [],
              handler: 'handler'
            }
          }
        }
      ],
      api: [],
      isMobile: true,
      fragmentsFolder: path.join(__dirname, "./fragments")
    } as any);
    const gatewayInstance = new GatewayBFF(gatewayConfigurator);

    const storefrontInstance = new Storefront({
      pages: [
        {
          url: '/',
          html: '<template><html><head></head><body><fragment from="Browsing" name="example" primary></fragment></body></html></template>'
        }
      ],
      port: 4450,
      gateways: [{
        name: 'Browsing',
        url: 'http://localhost:4451/'
      }],
      dependencies: [],
    } as any);

    gatewayInstance.init(() => {
      console.log('Gateway is working');
    });

    storefrontInstance.init(() => {
      console.log('Storefront is working');

      request(storefrontInstance.server.app)
        .get('/healthcheck')
        .expect(200)
        .end(err => {

          request(storefrontInstance.server.app)
            .get('/')
            .expect(200)
            .end((err, res) => {
              closeInstance(storefrontInstance);
              closeInstance(gatewayInstance);
              expect(res.text).to.include(`<script>window['transaction']=window['transaction']||${JSON.stringify(customModel)};</script><div id="example" puzzle-fragment="example" puzzle-gateway="Browsing">${gatewayRender}</div></body></html>`);
              done(err);
            });
        });
    });
  });


   it('should render multiple fragments with model', function (done) {
    const gatewayConfigurator = new GatewayConfigurator();
    const customModel = faker.helpers.createTransaction();
    const customModel2 = faker.helpers.createTransaction();
    const gatewayRender = faker.random.words();
    gatewayConfigurator.register('handler', INJECTABLE.HANDLER, {
      data() {
        return {
          data: {},
          $model: {
            transaction: customModel
          }
        };
      },
      placeholder() {
        return '';
      },
      content() {
        return {
          main: gatewayRender
        };
      }
    });
    gatewayConfigurator.register('handler2', INJECTABLE.HANDLER, {
      data() {
        return {
          data: {},
          $model: {
            transaction2: customModel2
          }
        };
      },
      placeholder() {
        return '';
      },
      content() {
        return {
          main: gatewayRender
        };
      }
    });
    gatewayConfigurator.config({
      port: 4451,
      name: 'Browsing',
      url: 'http://localhost:4451/',
      fragments: [
        {
          name: 'example',
          render: {
            url: '/'
          },
          version: '1.0.0',
          testCookie: 'example',
          versions: {
            '1.0.0': {
              assets: [],
              dependencies: [],
              handler: 'handler'
            }
          }
        },
        {
          name: 'example2',
          render: {
            url: '/'
          },
          version: '1.0.0',
          testCookie: 'example',
          versions: {
            '1.0.0': {
              assets: [],
              dependencies: [],
              handler: 'handler2'
            }
          }
        }
      ],
      api: [],
      isMobile: true,
      fragmentsFolder: path.join(__dirname, "./fragments")
    } as any);
    const gatewayInstance = new GatewayBFF(gatewayConfigurator);

    const storefrontInstance = new Storefront({
      pages: [
        {
          url: '/',
          html: '<template><html><head></head><body><fragment from="Browsing" name="example"></fragment><div><fragment from="Browsing" name="example2"></fragment></div></body></html></template>'
        }
      ],
      port: 4450,
      gateways: [{
        name: 'Browsing',
        url: 'http://localhost:4451/'
      }],
      dependencies: [],
    } as any);

    gatewayInstance.init(() => {
      console.log('Gateway is working');
    });

    storefrontInstance.init(() => {
      console.log('Storefront is working');

      request(storefrontInstance.server.app)
        .get('/healthcheck')
        .expect(200)
        .end(err => {

          request(storefrontInstance.server.app)
            .get('/')
            .expect(200)
            .end((err, res) => {
              closeInstance(storefrontInstance);
              closeInstance(gatewayInstance);
              expect(res.text).to.include(`<script>window['transaction']=window['transaction']||${JSON.stringify(customModel)};</script><div style="display: none;" puzzle-fragment="example"`);
              expect(res.text).to.include(`<script>window['transaction2']=window['transaction2']||${JSON.stringify(customModel2)};</script><div style="display: none;" puzzle-fragment="example2"`);
              done(err);
            });
        });
    });
  });**/

  it('should render single fragment with header without data',  (done) => {
    const gatewayConfigurator = new GatewayConfigurator();
    gatewayConfigurator.register('handler', INJECTABLE.HANDLER, {
      data() {
        return {
          $headers: {
            location: 'https://www.trendyol.com'
          },
          $status: 301
        };
      },
      placeholder() {

      },
      content() {
        return {
          main: 'Fragment Content'
        };
      }
    });
    gatewayConfigurator.config({
      serverOptions: {
        port: 4455
      },
      name: 'Browsing',
      url: 'http://localhost:4455/',
      fragments: [
        {
          name: 'example',
          render: {
            url: '/'
          },
          version: '1.0.0',
          testCookie: 'example',
          versions: {
            '1.0.0': {
              assets: [],
              dependencies: [],
              handler: 'handler'
            }
          }
        }
      ],
      api: [],
      isMobile: true,
      fragmentsFolder: path.join(__dirname, "./fragments")
    } as any);
    const gatewayInstance = new GatewayBFF(gatewayConfigurator);

    const storefrontInstance = new Storefront({
      pages: [
        {
          url: '/',
          html: '<template><html><head></head><body><fragment from="Browsing" name="example" primary></fragment></body></html></template>'
        }
      ],
      serverOptions: {
        port: 4457
      },
      gateways: [{
        name: 'Browsing',
        url: 'http://localhost:4455/'
      }],
      dependencies: [],
    } as any);

    gatewayInstance.init(() => {
      console.log('Gateway is working');
    });

    storefrontInstance.init(() => {
      console.log('Storefront is working');

      request(storefrontInstance.server.handler.getApp())
        .get('/healthcheck')
        .expect(200)
        .end(err => {

          request(storefrontInstance.server.handler.getApp())
            .get('/')
            .redirects(0)
            .expect(301)
            .end((err, res) => {
              closeInstance(storefrontInstance, done);
              closeInstance(gatewayInstance, done);
              expect(res.header['location']).to.eq('https://www.trendyol.com');
            });
        });
    });
  });
});
