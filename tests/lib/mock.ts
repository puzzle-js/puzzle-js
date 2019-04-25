import {IPageLibConfiguration} from "../../src/lib/types";

export const createPageLibConfiguration = (providedConfiguration?: object) => {
  return {
    assets: [],
    fragments: [{
      name: "test-fragment",
      chunked: false
    }],
    page: 'test-page',
    ...providedConfiguration
  } as unknown as IPageLibConfiguration
};
