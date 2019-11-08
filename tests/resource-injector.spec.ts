import faker from "faker";
import cheerio from "cheerio"; // can mock it
import sinon from "sinon";
import ResourceInjector from "../src/resource-injector";
import {EVENT, RESOURCE_LOADING_TYPE, RESOURCE_TYPE} from "@puzzle-js/client-lib/dist/enums";
import FragmentHelper from "./helpers/fragment";
import CleanCSS from "clean-css";
import ResourceFactory from "../src/resourceFactory";

const sandbox = sinon.createSandbox();


// TODO: We need to create more general tests about dependencies, this is not enough
describe('Resource Injector', () => {

    afterEach( () => {
        sandbox.verifyAndRestore();
    });

    it("should inject assets using default version", () => {

        // arrange
        const fragments = {
            "f1": FragmentHelper.create(),
            "f2": FragmentHelper.create()
        };
        const fragmentList = Object.keys(fragments).map( (fKey) => fragments[fKey] );
        let assets: any = [];
        fragmentList.forEach((fragment) => { assets = assets.concat(fragment.config.assets)});


        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, "", {});
        resourceInjector.injectAssets(dom as any);

        assets = assets.filter((asset) => asset.type === RESOURCE_TYPE.JS);

        // assert
        expect(dom("body").children().length).toBe(assets.length);
        assets.forEach( (asset) => {
            const script = dom("body").children(`script[puzzle-dependency=${asset.name}]`);
            if(script.length <= 1) {
                expect(script.attr().src).toBe(asset.link);
            }
        });

    });

    it("should inject assets using passive version", () => {

        // arrange
        const fragments = {
            "f1": FragmentHelper.create(),
            "f2": FragmentHelper.create()
        };
        const f1Version = faker.random.arrayElement(["2.0.0", "3.0.0"]);
        const f2Version = faker.random.arrayElement(["2.0.0", "3.0.0"]);
        sandbox.stub(fragments.f1, "detectVersion").callsFake(() => f1Version);
        sandbox.stub(fragments.f2, "detectVersion").callsFake(() => f2Version);

        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, "", {});
        resourceInjector.injectAssets(dom as any);

        const assets1 = fragments.f1.config.passiveVersions[f1Version].assets.filter((asset) => asset.type === RESOURCE_TYPE.JS);
        const assets2 = fragments.f2.config.passiveVersions[f2Version].assets.filter((asset) => asset.type === RESOURCE_TYPE.JS);

        // assert
        expect(dom("body").children().length).toBe(assets1.length + assets2.length);
        assets1.concat(assets2).forEach( (asset) => {
            const script = dom("body").children(`script[puzzle-dependency=${asset.name}]`);
            if(script.length <= 1) {
                expect(script.attr().src).toBe(asset.link);
            }
        });

    });

    it("should not inject assets if load method is not ON_RENDER_START", () => {

        // arrange
        const fragments = {
            "f1": FragmentHelper.create(),
            "f2": FragmentHelper.create()
        };
        const fragmentList = Object.keys(fragments).map( (fKey) => fragments[fKey] );
        let assets: any = [];
        fragmentList.forEach((fragment) => { assets = assets.concat(fragment.config.assets)});
        assets.forEach((asset)=> { asset.loadMethod = 1; });

        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, "", {});
        resourceInjector.injectAssets(dom as any);

        // assert
        expect(dom("body").children().length).toBe(0);

    });

    it("should inject library config", () => {

        // arrange
        const fragments = {
            "f1":  FragmentHelper.create(),
            "f2":  FragmentHelper.create()
        };
        const fragmentList = Object.keys(fragments).map( (fKey) => fragments[fKey] );
        let assets: any = [];
        fragmentList.forEach((fragment) => { assets = assets.concat(fragment.config.assets.map(asset => ({
            ...asset,
            fragment: fragment.name
        })))});
        const pageName = faker.random.word();
        const expectedConfig = {
            page: pageName,
            fragments: fragmentList.map((fragment) => ({ "name": fragment.name, "chunked": (fragment.config ? (fragment.shouldWait || (fragment.config.render.static || false)) : false) })),
            assets: assets.filter((asset) => asset.type === RESOURCE_TYPE.JS),
            dependencies: []
        };
        expectedConfig.assets.forEach((asset) => { asset.preLoaded = false });

        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, pageName, {});
        resourceInjector.injectLibraryConfig(dom as any);

        // assert
        const libConfigStr = dom("head").children("script[puzzle-dependency=puzzle-lib-config]").contents().first().text();
        const libConfig = JSON.parse(libConfigStr.split(`PuzzleJs.emit('${EVENT.ON_RENDER_START}');PuzzleJs.emit('${EVENT.ON_CONFIG}','`)[1].split("');")[0]);
        expect(libConfig).toEqual(expectedConfig);

    });

    it("should inject style sheets using default version", async (done) => {

        // arrange
        const fragments = {
            "f1": FragmentHelper.create(),
            "f2": FragmentHelper.create()
        };

        sandbox.stub(fragments.f1, "getAsset").callsFake((arg) => arg + "-CSS-");
        sandbox.stub(fragments.f2, "getAsset").callsFake((arg) => arg + "-CSS-");
        sandbox.stub(ResourceFactory.instance, "getRawContent").callsFake( (arg): any => arg + "-CSS-");
        sandbox.stub(CleanCSS.prototype, "minify").callsFake( (arg): any => ({ styles: arg }));

        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, "", {});
        await resourceInjector.injectStyleSheets(dom as any, false);

        const c1 = fragments.f1.config;
        const c2 = fragments.f2.config;

        const assets = c1.assets.concat(c2.assets).filter((asset) => asset.type === RESOURCE_TYPE.CSS);
        const deps = c1.dependencies.concat(c2.dependencies).filter((dep) => dep.type === RESOURCE_TYPE.CSS);

        let expectedDependencyList = assets.concat(deps).map( (res) => res.name);
        expectedDependencyList = expectedDependencyList.filter((v,i) => expectedDependencyList.indexOf(v) === i); // remove dublications
        const expectedCssContent = expectedDependencyList.concat([""]); // for last -CSS-
        
        // assert
        const result = dom("head").children("style[puzzle-dependency=dynamic-css]");
        expect(result.attr()["dependency-list"].split(",").sort()).toEqual(expectedDependencyList.sort());
        expect(result.contents().first().text().split("-CSS-").sort()).toEqual(expectedCssContent.sort());
        done();

    });

    it("should inject style sheets using passive version", async (done) => {

        // arrange
        const fragments = {
            "f1": FragmentHelper.create(),
            "f2": FragmentHelper.create()
        };

        const f1Version = faker.random.arrayElement(["2.0.0", "3.0.0"]);
        const f2Version = faker.random.arrayElement(["2.0.0", "3.0.0"]);
        sandbox.stub(fragments.f1, "detectVersion").callsFake(() => f1Version);
        sandbox.stub(fragments.f2, "detectVersion").callsFake( () => f2Version);
        sandbox.stub(fragments.f1, "getAsset").callsFake((arg) => arg + "-CSS-");
        sandbox.stub(fragments.f2, "getAsset").callsFake((arg) => arg + "-CSS-");
        sandbox.stub(ResourceFactory.instance, "getRawContent").callsFake( (arg): any => arg + "-CSS-");
        sandbox.stub(CleanCSS.prototype, "minify").callsFake( (arg): any => ({ styles: arg }));

        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, "", {});
        await resourceInjector.injectStyleSheets(dom as any, false);

        const c1 = fragments.f1.config.passiveVersions[f1Version];
        const c2 = fragments.f2.config.passiveVersions[f2Version];

        const assets = c1.assets.concat(c2.assets).filter((asset) => asset.type === RESOURCE_TYPE.CSS);
        const deps = c1.dependencies.concat(c2.dependencies).filter((dep) => dep.type === RESOURCE_TYPE.CSS);

        const expectedDependencyList = assets.concat(deps).map( (res) => res.name);
        const expectedCssContent = expectedDependencyList.concat([""]); // for last -CSS-

        // assert
        const result = dom("head").children("style[puzzle-dependency=dynamic-css]");
        expect(result.attr()["dependency-list"].split(",").sort()).toEqual(expectedDependencyList.sort());
        expect(result.contents().first().text().split("-CSS-").sort()).toEqual(expectedCssContent.sort());
        done();

    });

    it("should inject error message if asset invalid", () => {

        // arrange
        const fragments = {
            "f1": FragmentHelper.create()
        };
        const assetName = faker.lorem.word();
        fragments.f1.config.assets = [ {
            name: assetName,
            type: RESOURCE_TYPE.JS,
            loadMethod: RESOURCE_LOADING_TYPE.ON_RENDER_START
        }];

        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, "", {});
        resourceInjector.injectAssets(dom as any);

        // assert
        const errorComment = dom("body").contents();
        expect(errorComment["0"]["data"]).toBe(` Failed to inject asset: ${assetName} `);

    });

    it("should inject dependency script", () => {

        // arrange
        const fragments = {
            "f1": FragmentHelper.create()
        };
        const depName = faker.lorem.word();
        const dep = fragments.f1.config.dependencies[0];
        fragments.f1.config.assets[0].dependent = [depName];
        dep.name = depName;
        dep.type = RESOURCE_TYPE.JS;
        sandbox.stub(ResourceFactory.instance, "get").callsFake( (): any => dep);

        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, "", {});
        resourceInjector.injectAssets(dom as any);

        // assert
        const depScript = dom("body").children(`script[puzzle-dependency=${depName}]`);
        expect(depScript.attr().src).toBe(dep.link);

    });

    it("should not inject asset at page render start if load method does not exists", () => {

        // arrange
        const fragments = {
            "f1": FragmentHelper.create()
        };
        delete fragments.f1.config.assets[0].loadMethod;
        fragments.f1.config.assets[0].type = RESOURCE_TYPE.JS;
        let assets: any = fragments.f1.config.assets;

        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, "", {});
        resourceInjector.injectAssets(dom as any);
        assets = assets.filter((asset) => asset.type === RESOURCE_TYPE.JS);

        // assert
        const script = dom("body").children(`script[puzzle-dependency=${fragments.f1.config.assets[0].name}]`);
        expect(dom("body").children().length).toBe(assets.length - 1);
        expect(script.attr()).toBe(undefined);

    });

});
