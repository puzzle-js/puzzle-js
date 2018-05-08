import "mocha";
import {expect} from "chai";
import ResourceFactory from "../src/lib/resourceFactory";
import {RESOURCE_TYPE} from "../src/lib/enums";

export default () => {
    describe('Resource Factory', () => {
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

        it('should wrap dependency and give contents for injecting html - JS', () => {
            expect(ResourceFactory.instance.getDependencyContent('ty-library')).to.eq(`<script puzzle-dependency="ty-library" src="http://ty-gateway.com/assets/lib.min.js" type="text/javascript"></script>`);
        });

        it('should wrap dependency when content provided - JS', () => {
            const dependency = {
                type: RESOURCE_TYPE.JS,
                name: 'ty-library2',
                content: `console.log('Trendyol');`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(ResourceFactory.instance.getDependencyContent('ty-library2')).to.eq(`<script puzzle-dependency="${dependency.name}" type="text/javascript">${dependency.content}</script>`);
        });

        it('should wrap dependency when content provided - CSS', () => {
            const dependency = {
                type: RESOURCE_TYPE.CSS,
                name: 'ty-library3',
                content: `.item{color:red;}`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(ResourceFactory.instance.getDependencyContent('ty-library3')).to.eq(`<style puzzle-dependency="${dependency.name}" type="text/css">${dependency.content}</style>`);
        });

        it('should wrap dependency when link provided - CSS', () => {
            const dependency = {
                type: RESOURCE_TYPE.CSS,
                name: 'ty-library4',
                link: `http://ty-gateway.com/assets/lib.min.css`
            };

            ResourceFactory.instance.registerDependencies(dependency);

            expect(ResourceFactory.instance.getDependencyContent('ty-library4')).to.eq(`<link puzzle-dependency="${dependency.name}" rel="stylesheet" href="${dependency.link}" />`);
        });

        it('should use html comments for resource that doesnt exist', () => {

        });
    });
}
