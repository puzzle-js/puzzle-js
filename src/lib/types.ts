import {RESOURCE_LOADING_TYPE, RESOURCE_TYPE} from "./enums";

import {PuzzleJs} from "./puzzle";

declare global {
  interface Window {
    PuzzleJs: PuzzleJs;
    PerformanceObserver?: any;
  }
}

export interface IPageLibAsset {
  name: string;
  loadMethod: RESOURCE_LOADING_TYPE;
  fragment?: string;
  dependent?: string[];
  type: RESOURCE_TYPE;
  link: string;
  preLoaded: boolean;
  defer?: boolean;
}

export interface ICustomPageAsset {
  name: string;
  loadMethod: RESOURCE_LOADING_TYPE;
  link: string;
  dependent?: string;
}

export interface IPageFragmentConfig {
  name: string;
  chunked: boolean;
}

export interface IPageLibDependency {
  name: string;
  link: string;
  type: RESOURCE_TYPE;
  preLoaded: boolean;
}

export interface IPageLibConfiguration {
  page: string;
  fragments: IPageFragmentConfig[];
  assets: IPageLibAsset[];
  dependencies: IPageLibDependency[];
}

export interface IEventListener {
  [event: string]: Function[];
}
