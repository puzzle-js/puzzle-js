import faker from "faker";
import cheerio from "cheerio"; // can mock it
import sinon from "sinon";
import ResourceInjector from "../src/resource-injector";
import {EVENT, RESOURCE_TYPE} from "../src/lib/enums";
import FragmentHelper from "./helpers/fragment";

describe('Resource Injector', () => {

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
        const f1StubDetectVersion = sinon.stub(fragments.f1, "detectVersion");
        const f2StubDetectVersion = sinon.stub(fragments.f2, "detectVersion");
        f1StubDetectVersion.withArgs({}).returns(f1Version);
        f2StubDetectVersion.withArgs({}).returns(f2Version);
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
        fragmentList.forEach((fragment) => { assets = assets.concat(fragment.config.assets)});
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
        const libConfigStr = dom("head").children("script[puzzle-dependency=puzzle-lib]").contents().first().text();
        const libConfig = JSON.parse(libConfigStr.split(`{puzzleLibContent}PuzzleJs.emit('${EVENT.ON_RENDER_START}');PuzzleJs.emit('${EVENT.ON_CONFIG}','`)[1].split("');")[0]);
        expect(libConfig).toEqual(expectedConfig);
    });

    /*
    it("should inject style sheets using default version", async (done) => {
        // arrange
        const fragments = {
            "f1": FragmentHelper.create(),
            "f2": FragmentHelper.create()
        };
        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, "", {});
        await resourceInjector.injectStyleSheets(dom as any, false);

        const assets1 = fragments.f1.config.assets.filter((asset) => asset.type === RESOURCE_TYPE.CSS);
        const assets2 = fragments.f2.config.assets.filter((asset) => asset.type === RESOURCE_TYPE.CSS);

        // assert
        const result = dom("head").children("style[puzzle-dependency=dynamic-css");
        done();
    });

    /*
    it("should inject style sheets using test cookie version", () => {
        // arrange
        const fragments = {
            "f1": createFragment(),
            "f2": createFragment()
        };
        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, "", {});
        resourceInjector.injectAssets(dom as any);

        const c1 = fragments.f1.config;
        const c2 = fragments.f2.config;

        // assert
        expect(dom("body").children().length).toBe(c1.assets.length + c2.assets.length);
        c1.assets.concat(c2.assets).forEach( (asset) => {
            const script = dom("body").children(`script[puzzle-dependency=${asset.name}]`);
            expect(script.attr().src).toBe(asset.link);
        });
    });
    */

    /*
    it("should inject style sheets using passive version", () => {
        // arrange
        const fragments = {
            "f1": createFragment(),
            "f2": createFragment()
        };
        // act
        const dom = cheerio.load("<html><head></head><body></body></html>");
        const resourceInjector = new ResourceInjector(fragments, "", {});
        resourceInjector.injectAssets(dom as any);

        const c1 = fragments.f1.config;
        const c2 = fragments.f2.config;

        // assert
        expect(dom("body").children().length).toBe(c1.assets.length + c2.assets.length);
        c1.assets.concat(c2.assets).forEach( (asset) => {
            const script = dom("body").children(`script[puzzle-dependency=${asset.name}]`);
            expect(script.attr().src).toBe(asset.link);
        });
    });
    */
});
