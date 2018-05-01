import {RESOURCE_LOCATION, RESOURCE_TYPE} from "../lib/enums";
import {RESOURCE_INJECT_TYPE} from "../lib/enums";

export interface IFileResource {
    name: string;
}

export interface IFileResourceDependency extends IFileResource {
    link?: string;
    preview?: string;
}

export interface IFileResourceAsset extends IFileResource {
    injectType: RESOURCE_INJECT_TYPE;
    fileName: string;
    location: RESOURCE_LOCATION;
}

export interface IFileResourceStorefrontDependency {
    name: string;
    type: RESOURCE_TYPE;
    content?: string;
    link?: string;
}
