import {IFileResourceAsset, IFileResourceStorefrontDependency} from "../types/resource";
import {RESOURCE_TYPE} from "./enums";

const singletonSymbol = Symbol();

class ResourceFactory {
    static singleton: boolean | ResourceFactory = false;
    private resources: { [name: string]: IFileResourceStorefrontDependency } = {};

    constructor(enforcer: Symbol) {
        if (enforcer !== singletonSymbol) throw new Error("Cannot construct singleton, use .singleton");
    }

    static get instance() : ResourceFactory {
        if (!this.singleton) {
            this.singleton = new ResourceFactory(singletonSymbol);
        }
        return this.singleton as ResourceFactory;
    }

    /**
     * Registers new dependency
     * @param {IFileResourceStorefrontDependency} dependency
     */
    registerDependencies(dependency: IFileResourceStorefrontDependency) {
        this.validateDependency(dependency);
        this.resources[dependency.name] = dependency;
    }

    /**
     * Returns dependency object
     * @param {string} dependencyName
     * @returns {IFileResourceStorefrontDependency | null}
     */
    get(dependencyName: string){
        return this.resources[dependencyName] || null;
    }

    /**
     * Returns dependency content
     * @param {string} dependencyName
     * @returns {string}
     */
    getDependencyContent(dependencyName: string) {
        if (this.resources[dependencyName]) {
            return this.wrapDependency(this.resources[dependencyName]);
        } else {
            //todo error handling
            return '';
        }
    }

    /**
     * Wraps dependency based on its configuration. JS, CSS and content, link.
     * @param {IFileResourceStorefrontDependency} dependency
     * @returns {string}
     */
    private wrapDependency(dependency: IFileResourceStorefrontDependency) {
        if (dependency.type === RESOURCE_TYPE.JS) {
            if (dependency.link){
                return `<script puzzle-dependency="${dependency.name}" src="${dependency.link}" type="text/javascript"></script>`;
            }else if (dependency.content){
                return `<script puzzle-dependency="${dependency.name}" type="text/javascript">${dependency.content}</script>`;
            }
        } else if (dependency.type === RESOURCE_TYPE.CSS) {
            if (dependency.link){
                return `<link puzzle-dependency="${dependency.name}" rel="stylesheet" href="${dependency.link}" />`;
            }else if (dependency.content){
                return `<style puzzle-dependency="${dependency.name}" type="text/css">${dependency.content}</style>`;
            }
        }
    }

    /**
     * Checks if dependency is valid for registration
     * @param {IFileResourceStorefrontDependency} dependency
     */
    private validateDependency(dependency: IFileResourceStorefrontDependency) {
        if(!dependency.content && !dependency.link){
            throw new Error('Content or link is required for dependency');
        }
    }
}

export default ResourceFactory;
