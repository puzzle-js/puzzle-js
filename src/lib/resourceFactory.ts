import {IFileResourceStorefrontDependency} from "../types/resource";
import {RESOURCE_TYPE} from "./enums";

const singletonSymbol = Symbol();

class ResourceFactory {
    static singleton: boolean | ResourceFactory = false;
    private resources: { [name: string]: IFileResourceStorefrontDependency } = {};

    constructor(enforcer: Symbol) {
        if (enforcer !== singletonSymbol) throw new Error("Cannot construct singleton, use .singleton");
    }

    static get instance() {
        if (!this.singleton) {
            this.singleton = new ResourceFactory(singletonSymbol);
        }
        return this.singleton;
    }

    registerDependencies(dependency: IFileResourceStorefrontDependency) {
        this.resources[dependency.name] = dependency;
    }

    getDependencyContent(dependencyName: string) {
        if (this.resources[dependencyName]) {
            return this.wrapDependency(this.resources[dependencyName]);
        } else {
            return;
        }
    }

    private wrapDependency(dependency: IFileResourceStorefrontDependency) {
        if (dependency.type === RESOURCE_TYPE.JS) {

        } else if (dependency.type === RESOURCE_TYPE.CSS) {

        }
    }
}

export default ResourceFactory;
