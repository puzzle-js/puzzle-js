import {IFileResource, IFileResourceStorefrontDependency} from "../types/resource";
import {RESOURCE_TYPE} from "./enums";

const singletonSymbol = Symbol();

class ResourceFactory {
    static singleton: Boolean | ResourceFactory = false;
    private resources: { [name: string]: IFileResourceStorefrontDependency } = {};

    constructor(enforcer: Symbol) {
        if (enforcer != singletonSymbol) throw "Cannot construct singleton, use .singleton";
    }

    static get instance() {
        if (!this.singleton) {
            this.singleton = new ResourceFactory(singletonSymbol);
        }
        return this.singleton;
    }

    public registerDependencies(dependency: IFileResourceStorefrontDependency) {
        this.resources[dependency.name] = dependency;
    }

    public getDependencyContent(dependencyName: string) {
        if (this.resources[dependencyName]) {
            return this.wrapDependency(this.resources[dependencyName]);
        } else {
            return
        }
    }

    private wrapDependency(dependency: IFileResourceStorefrontDependency) {
        if (dependency.type === RESOURCE_TYPE.JS) {

        } else if (dependency.type === RESOURCE_TYPE.CSS) {

        }
    }
}

export default ResourceFactory;
