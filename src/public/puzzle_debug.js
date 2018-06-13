(function (scope) {
  const PACKAGE_VERSION = '';
  const DEPENDENCIES = {};

  const preOverload = console.info;
  console.info = function () {
    if (arguments[0].indexOf('will mount') > -1) return;
    preOverload(...arguments);
  };

  /*
    Util
   */

  const LOG_COLORS = Object.freeze({
    GREY: `#7f8c8d`,
    GREEN: `#2ecc71`,
    YELLOW: `#f39c12`,
    RED: `#c0392b`,
    BLUE: `#3498db`
  });

  const LOG_TYPES = Object.freeze({
    INFO: `info`,
    ERROR: `error`,
    WARN: `warn`,
    LOG: `log`
  });

  function wrapGroup(name, description, cb, color = LOG_COLORS.GREEN) {
    const logConfig = (name, color) => ['%c' + name, `background: ${color}; color: white; padding: 2px 0.5em; ` + `border-radius: 0.5em;`];
    console.groupCollapsed(...logConfig(name, color), description);
    cb();
    console.groupEnd()
  }

  function log(content, type = LOG_TYPES.INFO, color = LOG_COLORS.BLUE) {
    const logConfig = color => ['%cPuzzleJs', `background: ${color}; color: white; padding: 2px 0.5em; ` + `border-radius: 0.5em;`];
    console[type](...logConfig(color), content);
  }

  function table(content) {
    console.table(content);
  }

  /**
   * Puzzle Analytics Module
   * @constructor
   */
  function PuzzleAnalytics() {
    this.fragments = [];
    this.measuredTimes = {};
    this.connectionInformation = this.collectConnectionInformation();
    this.observingComplete = false;
    this.parseComplete = false;
    this.logDone = false;

    this.start();
  }

  PuzzleAnalytics.prototype.collectConnectionInformation = function () {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) log('Connection api is not supported', LOG_TYPES.WARN, LOG_COLORS.RED);
    return {
      rtt: connection ? connection.rtt : '',
      effectiveType: connection ? connection.effectiveType : '',
      downlink: connection ? connection.downlink : ''
    };
  };

  PuzzleAnalytics.prototype.start = function () {
    performance.mark(PuzzleAnalytics.TIME_LABELS.HTML_TRANSFER_STARTED);
    this.injectObserver();
  };

  PuzzleAnalytics.TIME_LABELS = Object.freeze({
    HTML_TRANSFER_STARTED: 'html-transfer-start',
    HTML_TRANSFER_ENDED: 'html-transfer-end',
    FRAGMENT_RENDER_START: 'fragment-render-started-',
    FRAGMENT_RENDER_END: 'fragment-render-ended-',
    FRAGMENT_MEASUREMENT: 'fragment-total-',
    FRAGMENT_MEASUREMENT_RESPONSE_START_TIME: 'fragment-response-start-'
  });

  PuzzleAnalytics.OBSERVABLE_LABELS = {
    FIRST_CONTENTFUL_PAINT: 'first-contentful-paint',
    FIRST_PAINT: 'first-paint'
  };

  PuzzleAnalytics.prototype.fragment = function (name) {
    const fragment = this.fragments.find(fragment => fragment.name === name);
    if (fragment) {
      performance.mark(`${PuzzleAnalytics.TIME_LABELS.FRAGMENT_RENDER_END}${name}`);
      performance.measure(`${PuzzleAnalytics.TIME_LABELS.FRAGMENT_MEASUREMENT}${name}`, `${PuzzleAnalytics.TIME_LABELS.FRAGMENT_RENDER_START}${name}`, `${PuzzleAnalytics.TIME_LABELS.FRAGMENT_RENDER_END}${name}`);
      performance.measure(`${PuzzleAnalytics.TIME_LABELS.FRAGMENT_MEASUREMENT_RESPONSE_START_TIME}${name}`, PuzzleAnalytics.TIME_LABELS.HTML_TRANSFER_STARTED, `${PuzzleAnalytics.TIME_LABELS.FRAGMENT_RENDER_START}${name}`);
      fragment.loadTime = performance.getEntriesByName(`${PuzzleAnalytics.TIME_LABELS.FRAGMENT_MEASUREMENT}${name}`);
      fragment.responseTime = performance.getEntriesByName(`${PuzzleAnalytics.TIME_LABELS.FRAGMENT_MEASUREMENT_RESPONSE_START_TIME}${name}`);
    } else {
      this.fragments.push({
        name
      });
      performance.mark(`${PuzzleAnalytics.TIME_LABELS.FRAGMENT_RENDER_START}${name}`);
    }
  };

  PuzzleAnalytics.prototype.end = function () {
    this.parseComplete = true;
    performance.mark(PuzzleAnalytics.HTML_TRANSFER_ENDED);

    if (this.observingComplete && this.parseComplete && !this.logDone) {
      this.logAnalytics();
    }
  };

  PuzzleAnalytics.prototype.logAnalytics = function () {
    wrapGroup('PuzzleJs', 'Debug Mode - Analytics', () => {
      table({
        'Round Trip Time': `${this.connectionInformation.rtt} ms`,
        'Connection Speed': `${this.connectionInformation.downlink} kbps`,
        'Connection Type': this.connectionInformation.effectiveType
      });

      log(`First Paint Started: ${this.measuredTimes[PuzzleAnalytics.OBSERVABLE_LABELS.FIRST_PAINT]}`);
      log(`First Meaningfull Paint: ${this.measuredTimes[PuzzleAnalytics.OBSERVABLE_LABELS.FIRST_CONTENTFUL_PAINT]}`);

      const fragmentsTableData = this.fragments.reduce((fragmentMap, fragment) => {
        fragmentMap[fragment.name] = {
          'Parsing Started': ~~fragment.loadTime[0].startTime,
          'Parse Duration': ~~fragment.loadTime[0].duration,
          'Response Time': ~~fragment.responseTime[0].startTime
        };
        return fragmentMap;
      }, {});
      table(fragmentsTableData);
    });
  };

  PuzzleAnalytics.prototype.injectObserver = function () {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.measuredTimes[entry.name] = Math.round(entry.startTime + entry.duration);
      }
      this.observingComplete = true;
      if (this.observingComplete && this.parseComplete && !this.logDone) {
        this.logAnalytics();
      }
    });
    observer.observe({entryTypes: ['paint']});
  };

  function PuzzleUtil() {
  }

  /**
   * Puzzle Info Module
   * @constructor
   */
  function PuzzleInfo() {
    wrapGroup('PuzzleJs', 'Debug Mode - Package Info', () => {
      this.logo();
      log(`PuzzleJs: ${PACKAGE_VERSION}`);
      table(DEPENDENCIES);
    });
  }

  PuzzleInfo.prototype.logo = function () {
    console.log('%c       ', 'font-size: 400px; background: url(https://camo.githubusercontent.com/77c4a5c7adc5f0d99a319130498e5a44a2c50e01/68747470733a2f2f696d6167652e6962622e636f2f6a4d32396f6e2f70757a7a6c656c6f676f2e706e67) no-repeat;');
  };

  function PuzzleVariables() {
    this.variables = {};
  }

  PuzzleVariables.prototype.add = function (fragmentName, varName) {
    if (!this.variables[fragmentName]) {
      this.variables[fragmentName] = {}
    }
    this.variables[fragmentName][varName] = window[varName];
  }

  PuzzleVariables.prototype.end = function () {
    wrapGroup('PuzzleJs', 'Debug Mode - Variables', () => {
      Object.keys(this.variables).forEach(fragmentName => {
        wrapGroup('PuzzleJs', fragmentName, () => {
          Object.keys(this.variables[fragmentName]).forEach(configKey => {
            wrapGroup('PuzzleJs', configKey, () => {
              log(this.variables[fragmentName][configKey]);
            }, LOG_COLORS.YELLOW);
          });
        }, LOG_COLORS.BLUE);
      });
    });
  }

  function PuzzleFragments() {
  }

  PuzzleFragments.prototype.set = function (fragmentsObject) {
    wrapGroup('PuzzleJs', 'Debug Mode - Fragments', () => {
      Object.keys(fragmentsObject).forEach(fragmentName => {
        wrapGroup('PuzzleJs', fragmentName, () => {
          log(fragmentsObject[fragmentName]);
        }, LOG_COLORS.BLUE);
      });
    });
  };

  function PuzzleJs() {
    this.analytics = new PuzzleAnalytics();
    this.info = new PuzzleInfo();
    this.fragments = new PuzzleFragments();
    this.variables = new PuzzleVariables();
  }


  Object.defineProperty(scope, 'PuzzleJs', {
    value: new PuzzleJs(),
    writable: false,
    enumerable: false,
    configurable: false
  });
})(window);
