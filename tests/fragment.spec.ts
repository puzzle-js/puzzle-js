import { expect } from "chai";
import "../src/base";
import { FragmentBFF, FragmentStorefront } from "../src/fragment";
import { IExposeFragment } from "../src/types";
import nock from "nock";
import { FRAGMENT_RENDER_MODES, RESOURCE_INJECT_TYPE, RESOURCE_LOCATION } from "../src/enums";
import { RESOURCE_TYPE } from "@puzzle-js/client-lib/dist/enums";
import { AssetManager } from "../src/asset-manager";
import * as express from 'express';
import faker from "faker";

const { lorem: { word } } = faker;

describe('Fragment', () => {
    describe('BFF', () => {
        const commonFragmentBffConfiguration: any = {
            name: 'test',
            version: 'test',
            render: {
                url: "/"
            },
            versions: {
                "test": {
                    assets: [],
                    dependencies: [],
                    handler: {}
                }
            }
        };

        it('should create a new FragmentBFF', () => {
            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.versions.test.handler.content = () => {
            };
            const fragment = new FragmentBFF(fragmentConfig);
            expect(fragment).to.be.instanceOf(FragmentBFF);
        });

        it('should render fragment as json format', async () => {
            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.versions.test.handler.content = (data: any) => {
                return {
                    main: `${data} was here`
                };
            };
            fragmentConfig.versions.test.handler.data = () => {
                return { data: 'acg' };
            };
            const fragment = new FragmentBFF(fragmentConfig);
            const response = await fragment.render({} as express.Request, '1.0.0', {} as express.Response);
            expect(response).to.deep.eq({
                main: `acg was here`
            });
        });

        it('should render placeholder preview', async () => {
            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.versions.test.handler.placeholder = () => {
                return 'placeholder';
            };
            const fragment = new FragmentBFF(fragmentConfig);
            const response = await fragment.placeholder({});
            expect(response).to.eq('placeholder');
        });

        it('should render fragment with response locals', async () => {
            const localKey = word();
            const locals = {
                [localKey]: word()
            };

            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.versions.test.handler.content = (data: any) => {
                return {
                    main: `${data} was here`
                };
            };
            fragmentConfig.versions.test.handler.data = (req: any, res: any) => {
                return { data: res[localKey] };
            };
            const fragment = new FragmentBFF(fragmentConfig);
            const response = await fragment.render({} as express.Request, word(), { locals } as express.Response);
            expect(response).to.deep.eq({
                main: `${locals[localKey]} was here`
            });
        });

        it('should render fragment without response locals', async () => {
            const localKey = word();
            const dataKey = word();

            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.versions.test.handler.content = (data: any) => {
                return {
                    main: data
                };
            };
            fragmentConfig.versions.test.handler.data = (req: any, res: any) => {
                return { data: res[localKey] + dataKey };
            };
            const fragment = new FragmentBFF(fragmentConfig);
            const response = await fragment.render({} as express.Request, word(), {} as express.Response);
            expect(response).to.deep.eq({
                main: `undefined${dataKey}`
            });
        });

        it('should throw at render error when not static and no data', done => {
            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.versions.test.handler.content = (data: unknown) => `${data} was here`;
            const fragment = new FragmentBFF(fragmentConfig);
            fragment.render({} as express.Request, '1.0.0', {} as express.Response).then(data => done(data)).catch(e => {
                expect(e.message).to.include('Failed to find data handler');
                done();
            });
        });

        it('should render live version when failed to find target version', done => {
            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.versions.test.handler.content = (data: any) => ({
                main: `${data} was here`
            });
            fragmentConfig.versions.test.handler.data = () => {
                return { data: 'acg' };
            };
            const fragment = new FragmentBFF(fragmentConfig);
            fragment.render({} as express.Request, 'no_version', {} as express.Response).then(data => {
                expect(data.main).to.include('was here');
                done();
            });
        });

        it('should resolve module when handler is not provided', () => {
            const bff = {
                ...commonFragmentBffConfiguration,
                version: '1.0.0',
                versions: {
                    "1.0.0": {
                        assets: [],
                        dependencies: [],
                    }
                }
            };
            const fragmentConfig = JSON.parse(JSON.stringify(bff));
            expect(() => {
                const fragment = new FragmentBFF(fragmentConfig);
            }).to.throw();
        });


        it('should throw error when fails to find requested fragment placeholder', () => {
            const bff = {
                ...commonFragmentBffConfiguration,
                version: '1.0.0',
                versions: {
                    "2.0.0": {
                        assets: [],
                        dependencies: [],
                        handler: {}
                    }
                }
            };
            const fragmentConfig = JSON.parse(JSON.stringify(bff));
            expect(() => {
                const fragment = new FragmentBFF(fragmentConfig);
                const placeholder = fragment.placeholder({}, '123');
            }).to.throw('Failed to find fragment version. Fragment: test, Version: 123');
        });

        it('should throw error when fails to find requested fragment content', async () => {
            const bff = {
                ...commonFragmentBffConfiguration,
                version: '1.0.0',
                versions: {
                    "2.0.0": {
                        assets: [],
                        dependencies: [],
                        handler: {}
                    }
                }
            };
            const fragmentConfig = JSON.parse(JSON.stringify(bff));
            const fragment = new FragmentBFF(fragmentConfig);

            try {
                await fragment.render({} as express.Request, '123', {} as express.Response);
            } catch (err) {
                return;
            }
            throw new Error('Should have thrown an error');
        });
    });

    describe('Storefront', () => {
        const commonFragmentConfig: IExposeFragment = {
            version: '',
            testCookie: 'test',
            assets: [],
            dependencies: [],
            render: {
                url: '/',
                placeholder: true,
                error: true
            }
        };

        it('should create new storefront fragment instance', () => {
            const fragment = new FragmentStorefront('product', 'test');

            expect(fragment).to.be.instanceOf(FragmentStorefront);
        });

        it('should update fragment configuration', () => {
            const fragment = new FragmentStorefront('product', 'test');
            fragment.update(commonFragmentConfig, 'http://local.gatewaysimulator.com', '');

            expect(fragment.config).to.deep.eq(commonFragmentConfig);
        });

        it('should update fragment configuration with version Matcher', () => {
            const fragment = new FragmentStorefront('product', 'test');
            const fragmentConfiguration = {
                ...commonFragmentConfig,
                versionMatcher: `(cookies) => '1.2.3'`,
            };
            fragment.update(fragmentConfiguration, 'http://local.gatewaysimulator.com', '');

            expect(fragment.config).to.deep.eq(fragmentConfiguration);
            expect(fragment.detectVersion({})).to.eq('1.2.3');
        });

        it('should fetch placeholder', async () => {
            const placeholderContent = '<div>placeholder</div>';
            const scope = nock('http://local.gatewaysimulator.com')
                .get('/product/placeholder')
                .reply(200, placeholderContent);
            const fragment = new FragmentStorefront('product', 'test');
            fragment.update(commonFragmentConfig, 'http://local.gatewaysimulator.com', '');

            const placeholder = await fragment.getPlaceholder();
            expect(placeholder).to.eq(placeholderContent);
        });

        it('should return placeholders for main and partials', async () => {
            const placeholderContent = "{\"main\":\"<div>placeholder</div>\",\"partial-1\":\"<div>partial placeholder</div>\"}"
            const scope = nock('http://local.gatewaysimulator.com')
                .get('/product/placeholder')
                .reply(200, placeholderContent);
            const fragment = new FragmentStorefront('product', 'test');
            fragment.update(commonFragmentConfig, 'http://local.gatewaysimulator.com', '');

            const placeholder = await fragment.getPlaceholder();
            expect(placeholder["partial-1"]).to.eq(JSON.parse(placeholderContent)["partial-1"]);
            expect(placeholder["main"]).to.eq(JSON.parse(placeholderContent)["main"]);
        });

        it('should return empty placeholder on any exception', async () => {
            const fragment = new FragmentStorefront('product', 'test');
            fragment.update(commonFragmentConfig, 'http://local.gatewaysimulator.com', '');

            const placeholder = await fragment.getPlaceholder();
            expect(placeholder).to.eq('');
        });

        it('should return fragment content', async () => {
            const fragmentContent = {
                main: '<div>fragment</div>'
            };
            const scope = nock('http://local.gatewaysimulator.com')
                .get('/product/')
                .query({ __renderMode: FRAGMENT_RENDER_MODES.STREAM })
                .reply(200, fragmentContent);
            const fragment = new FragmentStorefront('product', 'test');
            fragment.update(commonFragmentConfig, 'http://local.gatewaysimulator.com', '');

            const content = await fragment.getContent();
            expect(content.html).to.deep.eq(fragmentContent);
        });

        it('should pass fragment attributes to gateway request', async () => {
            const fragmentContent = {
                main: '<div>fragment</div>'
            };
            const scope = nock('http://local.gatewaysimulator.com')
                .get('/product/')
                .query({ __renderMode: FRAGMENT_RENDER_MODES.STREAM, custom: 'Trendyol' })
                .reply(200, fragmentContent);
            const fragment = new FragmentStorefront('product', 'test');
            fragment.update(commonFragmentConfig, 'http://local.gatewaysimulator.com', '');


            const content = await fragment.getContent({ custom: 'Trendyol' });

            expect(content.html).to.deep.eq(fragmentContent);
        });

        it('should fetch the asset with the desired name', async () => {
            const productScript = `<script>console.log('Product Script')</script>`;

            AssetManager.init();

            const scope = nock('http://asset-serving-test.com')
                .log(console.log)
                .get('/product/static/bundle.min.js')
                .query({ __version: '1.0.0' })
                .reply(200, productScript);

            const fragment = new FragmentStorefront('product', 'test');

            const fragmentContent = {
                ...commonFragmentConfig
            };
            fragmentContent.assets = [
                {
                    fileName: 'bundle.min.js',
                    location: RESOURCE_LOCATION.HEAD,
                    name: 'product-bundle',
                    injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
                    type: RESOURCE_TYPE.JS
                } as any
            ];
            fragmentContent.version = '1.0.0';

            fragment.update(fragmentContent, 'http://asset-serving-test.com', '');

            const scriptContent = await fragment.getAsset('product-bundle', '1.0.0');

            expect(scriptContent).to.eq(productScript);
        });

        it('should log and return empty placeholder when no fragment config exists', (done) => {
            const fragment = new FragmentStorefront('product', 'test');

            fragment.getPlaceholder().then(placeholder => {
                try {
                    expect(placeholder).to.eq('');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('should log and return empty placeholder when no placeholder is not enabled', (done) => {
            const fragment = new FragmentStorefront('product', 'test');

            fragment.update({
                render: {
                    placeholder: false,
                    url: '/'
                },
                version: '1.0.0',
                testCookie: 'fragment',
                dependencies: [],
                assets: []
            }, '', '');

            fragment.getPlaceholder().then(placeholder => {
                try {
                    expect(placeholder).to.eq('');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('should use version matcher when not pre compiling', () => {
            const fragment = new FragmentStorefront('product', 'test');

            fragment.update({
                render: {
                    placeholder: false,
                    url: '/'
                },
                versionMatcher: `(cookies) => '1.2.3'`,
                version: '1.0.0',
                testCookie: 'fragment',
                dependencies: [],
                assets: []
            }, '', '');

            const version = fragment.detectVersion({});

            expect(version).to.eq('1.2.3');
        });

        it('should use default version matcher when pre compiling', () => {
            const fragment = new FragmentStorefront('product', 'test');

            fragment.update({
                render: {
                    placeholder: false,
                    url: '/'
                },
                versionMatcher: `(cookies) => '1.2.3'`,
                version: '1.0.0',
                testCookie: 'fragment',
                dependencies: [],
                assets: []
            }, '', '');

            const version = fragment.detectVersion({}, true);

            expect(version).to.eq('1.0.0');
        });

        it('should log and return empty content when no fragment config exists', (done) => {
            const fragment = new FragmentStorefront('product', 'test');

            fragment.getContent().then(content => {
                try {
                    expect(content).to.deep.eq({
                        status: 500,
                        html: {},
                        headers: {},
                        cookies: {},
                        model: {}
                    });
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('should return empty content when error accrued and error page does not exists', async () => {
            nock('http://local.gatewaysimulator.com')
                .get('/error-page-test/')
                .query({ __renderMode: FRAGMENT_RENDER_MODES.STREAM })
                .replyWithError({});

            nock('http://local.gatewaysimulator.com')
                .get('/error-page-test/error')
                .replyWithError({});

            const fragment = new FragmentStorefront('error-page-test', 'test');
            fragment.update(commonFragmentConfig, 'http://local.gatewaysimulator.com', '');
            const content = await fragment.getContent();
            expect(content.html).to.deep.eq({});
            expect(content.status).to.eq(500);
        });

        it('should return error page content when error accrued and error page exists', (done) => {
            const errorPageContent = '{ "main" : "<div>errorPageContent</div>" }';


            nock('http://local.gatewaysimulator.com')
                .get('/error-page-test/')
                .query({ __renderMode: FRAGMENT_RENDER_MODES.STREAM })
                .replyWithError({});

            nock('http://local.gatewaysimulator.com')
                .get('/error-page-test/error')
                .reply(200, errorPageContent);

            const fragment = new FragmentStorefront('error-page-test', 'test');
            fragment.update(commonFragmentConfig, 'http://local.gatewaysimulator.com', '');

            // getErrorPage is async in update we need async check
            setTimeout(async () => {
                const content = await fragment.getContent();
                expect(content.html).to.deep.eq(JSON.parse(errorPageContent));
                expect(content.status).to.eq(200);
                done();
            }, 100);

        });

        it('should fetch error page', async () => {
            const errorPageContent = '{ "main" : "<div>errorPageContent</div>" }';

            const fragment = new FragmentStorefront('error-page-test', 'test');
            fragment.update(commonFragmentConfig, 'http://local.gatewaysimulator.com', '');

            nock('http://local.gatewaysimulator.com')
                .get('/error-page-test/error')
                .reply(200, errorPageContent);

            const errorPage = await fragment.getErrorPage();
            expect(errorPage).to.deep.eq(JSON.parse(errorPageContent));
        });

        it('should fetch error page from cache', async () => {
            const errorPageContent1 = '{ "main" : "<div>errorPageContent1</div>" }';
            const errorPageContent2 = '{ "main" : "<div>errorPageContent2</div>" }';

            const fragment = new FragmentStorefront('error-page-test', 'test');
            fragment.update(commonFragmentConfig, 'http://local.gatewaysimulator.com', '');

            nock('http://local.gatewaysimulator.com')
                .get('/error-page-test/error')
                .reply(200, errorPageContent1);
            const errorPage1 = await fragment.getErrorPage();
            nock('http://local.gatewaysimulator.com')
                .get('/error-page-test/error')
                .reply(200, errorPageContent2);
            const errorPage2 = await fragment.getErrorPage();

            expect(errorPage1).to.deep.eq(JSON.parse(errorPageContent1));
            expect(errorPage2).to.deep.eq(JSON.parse(errorPageContent1));
        });

        it('should log and return null asset when no fragment config exists', (done) => {
            const fragment = new FragmentStorefront('product', 'test');

            fragment.getAsset('nope', '1.0.0').then(asset => {
                try {
                    expect(asset).to.eq(null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('should log and return null asset path when no fragment config exists', () => {
            const fragment = new FragmentStorefront('product', 'test');

            const assetPath = fragment.getAssetPath('nope');

            expect(assetPath).to.eq(null);
        });

        it('should log and return null asset path when requested asset not found', () => {
            const fragment = new FragmentStorefront('product', 'test');

            fragment.update({
                render: {
                    placeholder: false,
                    url: '/'
                },
                version: '1.0.0',
                testCookie: 'fragment',
                dependencies: [],
                assets: []
            }, '', '');


            const assetPath = fragment.getAssetPath('nope');

            expect(assetPath).to.eq(null);
        });

        it('should return asset path if public asset link provided', () => {
            const fragment = new FragmentStorefront('product', 'test');

            fragment.update({
                render: {
                    placeholder: false,
                    url: '/'
                },
                version: '1.0.0',
                testCookie: 'fragment',
                dependencies: [],
                assets: [
                    {
                        fileName: 'bundle.min.js',
                        location: RESOURCE_LOCATION.HEAD,
                        name: 'product-bundle',
                        injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
                        type: RESOURCE_TYPE.JS
                    } as any
                ]
            }, 'https://different.com/', 'gateway', 'https://differentLink.com/');


            const assetPath = fragment.getAssetPath('product-bundle');

            expect(assetPath).to.eq(`https://differentlink.com/product/static/bundle.min.js`);
        });

        it('should return asset path if public asset external link provided', () => {
            const fragment = new FragmentStorefront('product', 'test');

            fragment.update({
                render: {
                    placeholder: false,
                    url: '/'
                },
                version: '1.0.0',
                testCookie: 'fragment',
                dependencies: [],
                assets: [
                    {
                        fileName: 'bundle.min.js',
                        link: 'fullPath',
                        location: RESOURCE_LOCATION.HEAD,
                        name: 'product-bundle',
                        injectType: RESOURCE_INJECT_TYPE.EXTERNAL,
                        type: RESOURCE_TYPE.JS
                    } as any
                ]
            }, 'https://different.com/', 'https://differentLink.com/');


            const assetPath = fragment.getAssetPath('product-bundle');

            expect(assetPath).to.eq(`fullPath`);
        });

        it('should log and return null asset path when requested asset not found', (done) => {
            const fragment = new FragmentStorefront('product', 'test');

            fragment.update({
                render: {
                    placeholder: false,
                    url: '/'
                },
                version: '1.0.0',
                testCookie: 'fragment',
                dependencies: [],
                assets: [],
            }, '', '');


            fragment.getAsset('nope', '1.0.0').then(asset => {
                try {
                    expect(asset).to.eq(null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
});

