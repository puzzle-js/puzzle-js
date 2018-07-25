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
  ON_PAGE_LOAD,
  ON_FRAGMENT_RENDERED,
  ON_CONFIG,
  ON_DEBUG_CONFIG,
  ON_VARIABLES,
  ON_RENDER_START
}

export enum TIME_LABELS {
  HTML_TRANSFER_STARTED = 'html-transfer-start',
  HTML_TRANSFER_ENDED = 'html-transfer-end',
  FRAGMENT_RENDER_START = 'fragment-render-started-',
  FRAGMENT_RENDER_END = 'fragment-render-ended-',
  FRAGMENT_MEASUREMENT = 'fragment-total-',
  FRAGMENT_MEASUREMENT_RESPONSE_START_TIME = 'fragment-response-start-'
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
  ON_PAGE_RENDER

  /**
   * @description Starts loading resource after all assets are loaded and injected. Great for marketing scripts and 3rd party tracking tools
   */
  //ON_ALL_ASSETS_LOADED
}

export enum RESOURCE_TYPE {
  CSS,
  JS
}
