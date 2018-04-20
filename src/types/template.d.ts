import {REPLACE_ITEM_TYPE} from "../lib/enums";

export interface IReplaceItem {
    key: string;
    type: REPLACE_ITEM_TYPE;
    partial: string;
}
