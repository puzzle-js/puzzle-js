import "mocha";
import {expect} from "chai";
import nock from "nock";
import ResourceFactory from "../src/resourceFactory";
import {RESOURCE_INJECT_TYPE, RESOURCE_TYPE} from "../src/enums";
import request from "supertest";

export default () => {
    describe('Resource Factory', () => {
        beforeEach(() => {
            ResourceFactory.instance['resources'] = {};
        });

        it('should create a new resource factory instance', () => {
            expect(ResourceFactory.instance).to.be.instanceOf(ResourceFactory);
        });

        it('should return same instance', () => {
            const rFac = ResourceFactory.instance as any;
            rFac.test = true;

            expect(ResourceFactory.instance).to.haveOwnProperty('test');
        });

        it('should throw error when registering new dependency, content or link required', () => {
            const test = () => {
                ResourceFactory.instance.registerDependencies({
                    type: RESOURCE_TYPE.JS,
                    name: 'ty-library',
                });
            };
            expect(test).to.throw();
        });

        it('should register new dependency', () => {
            const dependency = {
                type: RESOURCE_TYPE.JS,
                name: 'ty-library',
                link: 'http://ty-gateway.com/assets/lib.min.js'
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(ResourceFactory.instance.get('ty-library')).to.deep.eq(dependency);
        });

        it('should wrap dependency and give contents for injecting html - JS', async () => {
            const dependency = {
                type: RESOURCE_TYPE.JS,
                name: 'ty-library',
                link: 'http://ty-gateway.com/assets/lib.min.js'
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty-library')).to.eq(`<script puzzle-dependency="ty-library" src="http://ty-gateway.com/assets/lib.min.js" type="text/javascript"> </script>`);
        });

        it('should wrap dependency when content provided - JS', async () => {
            const dependency = {
                type: RESOURCE_TYPE.JS,
                name: 'ty-library2',
                content: `console.log('Trendyol');`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty-library2')).to.eq(`<script puzzle-dependency="${dependency.name}" type="text/javascript">${dependency.content}</script>`);
        });

        it('should wrap dependency when content provided - CSS', async () => {
            const dependency = {
                type: RESOURCE_TYPE.CSS,
                name: 'ty-library3',
                content: `.item{color:red;}`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty-library3')).to.eq(`<style puzzle-dependency="${dependency.name}" type="text/css">${dependency.content}</style>`);
        });

        it('should wrap dependency when link provided - CSS', async () => {
            const dependency = {
                type: RESOURCE_TYPE.CSS,
                name: 'ty-library4',
                link: `http://ty-gateway.com/assets/lib.min.css`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty-library4')).to.eq(`<link puzzle-dependency="${dependency.name}" rel="stylesheet" href="${dependency.link}" />`);
        });

        it('should return html comments for dependencies that doesnt exists', async () => {
            expect(await ResourceFactory.instance.getDependencyContent('ty-library')).to.eq(`<!-- Puzzle dependency: ty-library not found -->`);
        });

        it('should overload inject type if provided. JS, INLINE, CONTENT', async () => {
            const dependency = {
                type: RESOURCE_TYPE.JS,
                name: 'ty',
                content: `console.log('working')`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty', RESOURCE_INJECT_TYPE.INLINE)).to.eq(`<script puzzle-dependency="${dependency.name}" type="text/javascript">${dependency.content}</script>`);
        });

        it('should overload inject type if provided. JS, INLINE, LINK', async () => {
            const dependency = {
                type: RESOURCE_TYPE.JS,
                name: 'ty',
                link: `http://cdn.com/ty.js`
            };

            const scope = nock('http://cdn.com')
                .log(console.log)
                .get("/ty.js")
                .reply(200, 'working');

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty', RESOURCE_INJECT_TYPE.INLINE)).to.eq(`<script puzzle-dependency="${dependency.name}" type="text/javascript">working</script>`);
        });

        it('should overload inject type if provided. CSS, INLINE, CONTENT', async () => {
            const dependency = {
                type: RESOURCE_TYPE.CSS,
                name: 'ty',
                content: `working`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty', RESOURCE_INJECT_TYPE.INLINE)).to.eq(`<style puzzle-dependency="${dependency.name}" type="text/css">${dependency.content}</style>`);
        });

        it('should overload inject type if provided. CSS, INLINE, LINK', async () => {
            const dependency = {
                type: RESOURCE_TYPE.CSS,
                name: 'ty',
                link: `http://cdn.com/ty.css`
            };

            const scope = nock('http://cdn.com')
                .log(console.log)
                .get("/ty.css")
                .reply(200, 'working');

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty', RESOURCE_INJECT_TYPE.INLINE)).to.eq(`<style puzzle-dependency="${dependency.name}" type="text/css">working</style>`);
        });


        it('should overload inject type if provided. JS, EXTERNAL, link', async () => {
            const dependency = {
                type: RESOURCE_TYPE.JS,
                name: 'ty',
                link: `ty.js`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty', RESOURCE_INJECT_TYPE.EXTERNAL)).to.eq(`<script puzzle-dependency="${dependency.name}" src="${dependency.link}" type="text/javascript"> </script>`);

        });

        it('should overload inject type if provided. JS, EXTERNAL, CONTENT', async () => {
            const dependency = {
                type: RESOURCE_TYPE.JS,
                name: 'ty',
                content: `working`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty', RESOURCE_INJECT_TYPE.EXTERNAL)).to.eq(`<script puzzle-dependency="${dependency.name}" src="/static/${dependency.name}.min.js" type="text/javascript"> </script>`);
        });

        it('should overload inject type if provided. CSS, EXTERNAL, link', async () => {
            const dependency = {
                type: RESOURCE_TYPE.CSS,
                name: 'ty',
                link: `ty.js`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty', RESOURCE_INJECT_TYPE.EXTERNAL)).to.eq(`<link puzzle-dependency="${dependency.name}" rel="stylesheet" href="${dependency.link}" />`);

        });

        it('should overload inject type if provided. CSS, EXTERNAL, CONTENT', async () => {
            const dependency = {
                type: RESOURCE_TYPE.CSS,
                name: 'ty',
                content: `working`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(await ResourceFactory.instance.getDependencyContent('ty', RESOURCE_INJECT_TYPE.EXTERNAL)).to.eq(`<link puzzle-dependency="${dependency.name}" rel="stylesheet" href="/static/${dependency.name}.min.css" />`);
        });

        it('should return html comment when no link or content provided', async () => {
            ResourceFactory.instance['resources']['ty'] = {
                type: RESOURCE_TYPE.CSS,
                name: 'ty',
            };

            expect(await ResourceFactory.instance.getDependencyContent('ty')).to.eq(`<!-- Puzzle dependency: ty failed to inject because there is no content or link property -->`);
        });
    });
}
