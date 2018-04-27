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

    registerDependencies(dependency: IFileResourceStorefrontDependency) {
        this.validateDependency(dependency);
        this.resources[dependency.name] = dependency;
    }

    get(dependencyName: string){
        return this.resources[dependencyName] || null;
    }

    getDependencyContent(dependencyName: string) {
        if (this.resources[dependencyName]) {
            return this.wrapDependency(this.resources[dependencyName]);
        } else {
            //todo error handling
            return '';
        }
    }

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

    private validateDependency(dependency: IFileResourceStorefrontDependency) {
        if(!dependency.content && !dependency.link){
            throw new Error('Content or link is required for dependency');
        }
    }
}

export default ResourceFactory;
