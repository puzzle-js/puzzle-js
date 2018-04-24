import {REPLACE_ITEM_TYPE} from "../lib/enums";
import {FragmentStorefront} from "../lib/fragment";

export interface IReplaceItem {
    key: string;
    type: REPLACE_ITEM_TYPE;
    partial: string;
}

export interface IReplaceSet {
    fragment: FragmentStorefront,
    replaceItems: IReplaceItem[],
    fragmentAttributes: { [name: string]: string }
}

