import {RESOURCE_LOCATION} from "../lib/enums";
import {RESOURCE_INJECT_TYPE} from "../lib/enums";

export interface IFileResource {
    injectType: RESOURCE_INJECT_TYPE;
    location: RESOURCE_LOCATION;
}

export interface IFileResourceDependency extends IFileResource {
    name: string;
    link: string;
}

export interface IFileResourceAsset extends IFileResource {
    fileName: string;
}