import {REPLACE_ITEM_TYPE, RESOURCE_INJECT_TYPE, RESOURCE_LOCATION} from "../lib/enums";
import {FragmentStorefront} from "../lib/fragment";

export interface IReplaceItem {
    key: string;
    type: REPLACE_ITEM_TYPE;
    partial: string;
}

export interface IReplaceSet {
    fragment: FragmentStorefront;
    replaceItems: IReplaceItem[];
    fragmentAttributes: { [name: string]: string };
}

export interface IReplaceAssetSet {
    link: string | undefined | null;
    content: string | undefined | null;
    name: string;
    location: RESOURCE_LOCATION,
    injectType: RESOURCE_INJECT_TYPE
}

export interface IReplaceAsset {
    fragment: FragmentStorefront,
    replaceItems:  IReplaceAssetSet[]
}
