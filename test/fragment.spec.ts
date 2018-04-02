import "mocha";
import {expect} from "chai";
import {FragmentBFF, IFragmentBFF} from "../lib/fragment";
describe('Fragment', () => {
    describe('BFF',() => {
        const commonFragmentBffConfiguration: any = {
            name:'test',
            version: 'test',
            render: {
                url: "/"
            },
            versions: {
                "test": {
                    assets: [],
                    dependencies: [],
                    handler: {

                    }
                }
            }
        };

        it('should create a new FragmentBFF', function () {
            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.versions.test.handler.content = () => {};
            const fragment = new FragmentBFF(fragmentConfig);
            expect(fragment).to.be.instanceOf(FragmentBFF);
        });

        it('should render fragment', async function () {
            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.versions.test.handler.content = (req: any, data: any) => `${data} was here`;
            fragmentConfig.versions.test.handler.data = () => 'acg';
            const fragment = new FragmentBFF(fragmentConfig);
            expect(await fragment.render({})).to.eq('acg was here');
        });

        it('should throw at render error when not static and no data', function (done) {
            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.versions.test.handler.content = (req: any, data: any) => `${data} was here`;
            const fragment = new FragmentBFF(fragmentConfig);
            fragment.render({}).then(data => done(data)).catch(e => {
                expect(e.message).to.include('Failed to find data handler');
                done();
            });
        });

        it('should render fragment which is static without calling data', function (done) {
            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.render.static = true;
            fragmentConfig.versions.test.handler.content = (req: any, data: any) => `${data} was here`;
            fragmentConfig.versions.test.handler.data = (req: any) => {
                throw new Error("It shouldn't call data for static fragments");
            };
            const fragment = new FragmentBFF(fragmentConfig);
            fragment.render({}).then(data => done()).catch(done);
        });

        it('should throw at render when failing to find version', function (done) {
            const fragmentConfig = JSON.parse(JSON.stringify(commonFragmentBffConfiguration));
            fragmentConfig.versions.test.handler.content = (req: any, data: any) => `${data} was here`;
            fragmentConfig.versions.test.handler.data = () => 'acg';
            const fragment = new FragmentBFF(fragmentConfig);
            fragment.render({},'no_version').then(data => done(data)).catch(e => {
                expect(e.message).to.include('Failed to find fragment version');
                done();
            });
        });
    });

    describe('Storefront',() => {

    });
});