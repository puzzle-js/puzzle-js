import {RESOURCE_LOADING_TYPE} from "./enums";

import {PuzzleJs} from "./puzzle";

declare global {
  interface Window { PuzzleJs: PuzzleJs; }
}

export interface IPageLibAsset {
  name: string;
  loadMethod: RESOURCE_LOADING_TYPE
  fragment?: string;
  dependent?: string[];
}

export interface ICustomPageAsset {
  name: string;
  loadMethod: RESOURCE_LOADING_TYPE
  link: string;
  dependent?: string;
}

export interface IPageLibConfiguration {
  page: string;
  fragments: {
    name: string;
    chunked: boolean;
  };
  assets: IPageLibAsset[];
}
