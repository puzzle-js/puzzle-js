export enum IResourceInjectType {
    INLINE,
    EXTERNAL
}

export enum IResourceLocation {
    HEAD,
    BODY_START,
    BODY_END,
    CONTENT_START,
    CONTENT_END
}

export interface IFileResource {
    injectType: IResourceInjectType;
    location: IResourceLocation;
}

export interface IFileResourceDependency extends IFileResource {
    name: string;
    link: string;
}

export interface IFileResourceAsset extends IFileResource {
    fileName: string;
}
