export enum LOG_COLORS {
  GREY = '#7f8c8d',
  GREEN = '#2ecc71',
  YELLOW = '#f39c12',
  RED = '#c0392b',
  BLUE = '#3498db',
}

export enum LOG_TYPES {
  INFO = 'info',
  ERROR = 'error',
  WARN = 'warn',
  LOG = 'log'
}

export enum EVENT {
  ON_PAGE_LOAD = 'pageLoaded',
  ON_FRAGMENT_RENDERED = 'fragmentRendered',
  ON_CONFIG = 'config',
  ON_DEBUG_CONFIG = 'debugConfig',
  ON_VARIABLES = 'variables'
}


export enum RESOURCE_LOADING_TYPE {
  /**
   * @description Loads resource in head. Visible in page source. Great for small dependencies.
   */
  ON_RENDER_START,

  /**
   * @description Starts loading resource after fragment rendered. Not visible in page source. It is useful for fragments that should run immediately
   */
  ON_FRAGMENT_RENDER,

  /**
   * @description Starts loading resource after all page fragments are visible. Great for performance
   */
  ON_PAGE_RENDER,

  /**
   * @description Starts loading resource after all assets are loaded and injected. Great for marketing scripts and 3rd party tracking tools
   */
  ON_ALL_ASSETS_LOADED
}
