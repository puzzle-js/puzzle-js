import nodeFetch from "node-fetch";
import {EVENTS, HTTP_METHODS, RESOURCE_INJECT_TYPE, RESOURCE_TYPE} from "./enums";
import {pubsub} from "./util";
import {IFileResourceStorefrontDependency} from "./types";

const singletonSymbol = Symbol();

export default class ResourceFactory {
    static singleton: boolean | ResourceFactory = false;
    private resources: { [name: string]: IFileResourceStorefrontDependency } = {};

    constructor(enforcer: Symbol) {
        if (enforcer !== singletonSymbol) throw new Error("Cannot construct singleton, use .singleton");
    }

    static get instance(): ResourceFactory {
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
    get(dependencyName: string) {
        return this.resources[dependencyName] || null;
    }

    /**
     * Returns dependency content
     * @param {string} dependencyName
     * @returns {string}
     */
    async getDependencyContent(dependencyName: string, injectType?: RESOURCE_INJECT_TYPE | undefined): Promise<string> {
        const dependency = this.resources[dependencyName];
        if (!dependency) {
            return `<!-- Puzzle dependency: ${dependencyName} not found -->`;
        }
        if (injectType === RESOURCE_INJECT_TYPE.INLINE) {
            if (dependency.type === RESOURCE_TYPE.JS) {
                if (dependency.content) {
                    return `<script puzzle-dependency="${dependency.name}" type="text/javascript">${dependency.content}</script>`;
                } else if (dependency.link) {
                    const req = await nodeFetch(dependency.link),
                        content = await req.text();
                    return `<script puzzle-dependency="${dependency.name}" type="text/javascript">${content}</script>`;
                }
            } else if (dependency.type === RESOURCE_TYPE.CSS) {
                if (dependency.content) {
                    return `<style puzzle-dependency="${dependency.name}" type="text/css">${dependency.content}</style>`;
                } else if (dependency.link) {
                    const req = await nodeFetch(dependency.link),
                        content = await req.text();
                    return `<style puzzle-dependency="${dependency.name}" type="text/css">${content}</style>`;
                }
            }
        } else if (injectType === RESOURCE_INJECT_TYPE.EXTERNAL) {
            if (dependency.type === RESOURCE_TYPE.JS) {
                if (dependency.link) {
                    return `<script puzzle-dependency="${dependency.name}" src="${dependency.link}" type="text/javascript"> </script>`;
                } else if (dependency.content) {
                    const url = `/static/${dependency.name}.min.js`;
                    pubsub.emit(EVENTS.ADD_ROUTE, {
                        path: url,
                        method: HTTP_METHODS.GET,
                        handler(req: any, res: any) {
                            res.set('content-type', 'text/javascript');
                            res.send(dependency.content);
                        }
                    });
                    return `<script puzzle-dependency="${dependency.name}" src="${url}" type="text/javascript"> </script>`;
                }
            } else if (dependency.type === RESOURCE_TYPE.CSS) {
                if (dependency.link) {
                    return `<link puzzle-dependency="${dependency.name}" rel="stylesheet" href="${dependency.link}" />`;
                } else if (dependency.content) {
                    const url = `/static/${dependency.name}.min.css`;
                    pubsub.emit(EVENTS.ADD_ROUTE, {
                        path: url,
                        method: HTTP_METHODS.GET,
                        handler(req: any, res: any) {
                            res.set('content-type', 'text/css');
                            res.send(dependency.content);
                        }
                    });
                    return `<link puzzle-dependency="${dependency.name}" rel="stylesheet" href="${url}" />`;
                }
            }
        } else {
            if (dependency.type === RESOURCE_TYPE.JS) {
                if (dependency.link) {
                    return `<script puzzle-dependency="${dependency.name}" src="${dependency.link}" type="text/javascript"> </script>`;
                } else if (dependency.content) {
                    return `<script puzzle-dependency="${dependency.name}" type="text/javascript">${dependency.content}</script>`;
                }
            } else if (dependency.type === RESOURCE_TYPE.CSS) {
                if (dependency.link) {
                    return `<link puzzle-dependency="${dependency.name}" rel="stylesheet" href="${dependency.link}" />`;
                } else if (dependency.content) {
                    return `<style puzzle-dependency="${dependency.name}" type="text/css">${dependency.content}</style>`;
                }
            }
        }

        return `<!-- Puzzle dependency: ${dependencyName} failed to inject because there is no content or link property -->`;
    }


    /**
     * Checks if dependency is valid for registration
     * @param {IFileResourceStorefrontDependency} dependency
     */
    private validateDependency(dependency: IFileResourceStorefrontDependency) {
        if (!dependency.content && !dependency.link) {
            throw new Error('Content or link is required for dependency');
        }
    }
}
