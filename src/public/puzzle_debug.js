(function (scope) {
    const preOverload = console.info;
    console.info = function (b) {
        if (b.indexOf('will mount') > -1) return;
    }

    /*
      Util
     */
    function wrapGroup(name, description, cb, color = PuzzleAnalytics.LOG_COLORS.GREEN) {
        const logConfig = (name, color) => ['%c' + name, `background: ${color}; color: white; padding: 2px 0.5em; ` + `border-radius: 0.5em;`];
        console.groupCollapsed(...logConfig(name, color), description);
        cb();
        console.groupEnd()
    };


    function log(content, type = PuzzleAnalytics.LOG_TYPES.INFO, color = PuzzleAnalytics.LOG_COLORS.BLUE) {
        const logConfig = color => ['%cPuzzleJs', `background: ${color}; color: white; padding: 2px 0.5em; ` + `border-radius: 0.5em;`];
        console[type](...logConfig(color), content);
    };


    function table(content) {
        console.table(content);
    };


    /**
     * Puzzle Analytics
     * @constructor
     */
    function PuzzleAnalytics() {
        this.fragments = [];
        this.measuredTimes = {};
        this.connectionInformation = this.collectConnectionInformation();
        this.start();
    }

    PuzzleAnalytics.prototype.collectConnectionInformation = function () {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return {
            rtt: connection.rtt,
            effectiveType: connection.effectiveType,
            downlink: connection.downlink
        }
    }

    PuzzleAnalytics.prototype.start = function () {
        performance.mark(PuzzleAnalytics.TIME_LABELS.HTML_TRANSFER_STARTED);
        this.injectObserver();
    };

    PuzzleAnalytics.TIME_LABELS = Object.freeze({
        HTML_TRANSFER_STARTED: 'html-transfer-start',
        HTML_TRANSFER_ENDED: 'html-transfer-end',
        FRAGMENT_RENDER_START: 'fragment-render-started-',
        FRAGMENT_RENDER_END: 'fragment-render-ended-',
        FRAGMENT_MEASUREMENT: 'fragment-total-'
    });

    PuzzleAnalytics.OBSERVABLE_LABELS = {
        FIRST_CONTENTFUL_PAINT: 'first-contentful-paint',
        FIRST_PAINT: 'first-paint'
    }

    PuzzleAnalytics.LOG_COLORS = Object.freeze({
        GREY: `#7f8c8d`,
        GREEN: `#2ecc71`,
        YELLOW: `#f39c12`,
        RED: `#c0392b`,
        BLUE: `#3498db`
    });

    PuzzleAnalytics.LOG_TYPES = Object.freeze({
        INFO: `info`,
        ERROR: `error`,
        WARN: `warn`,
        LOG: `log`
    });

    PuzzleAnalytics.prototype.fragment = function (name) {
        const fragment = this.fragments.find(fragment => fragment.name === name);
        if (fragment) {
            performance.mark(`${PuzzleAnalytics.TIME_LABELS.FRAGMENT_RENDER_END}${name}`);
            performance.measure(`${PuzzleAnalytics.TIME_LABELS.FRAGMENT_MEASUREMENT}${name}`, `${PuzzleAnalytics.TIME_LABELS.FRAGMENT_RENDER_START}${name}`, `${PuzzleAnalytics.TIME_LABELS.FRAGMENT_RENDER_END}${name}`);
            fragment.loadTime = performance.getEntriesByName(`${PuzzleAnalytics.TIME_LABELS.FRAGMENT_MEASUREMENT}${name}`);
        } else {
            this.fragments.push({
                name
            });
            performance.mark(`${PuzzleAnalytics.TIME_LABELS.FRAGMENT_RENDER_START}${name}`);
        }
    };


    PuzzleAnalytics.prototype.end = function () {
        performance.mark(PuzzleAnalytics.HTML_TRANSFER_ENDED);

        wrapGroup('PuzzleJs', 'Debug Mode - Analytics', () => {
            table({
                'Round Trip Time': `${this.connectionInformation.rtt} ms`,
                'Connection Speed': `${this.connectionInformation.downlink} kbps`,
                'Connection Type': this.connectionInformation.effectiveType
            });

            log(`First Paint Started: ${this.measuredTimes[PuzzleAnalytics.OBSERVABLE_LABELS.FIRST_PAINT]}`);
            log(`First Meaningfull Paint: ${this.measuredTimes[PuzzleAnalytics.OBSERVABLE_LABELS.FIRST_CONTENTFUL_PAINT]}`);
        });
    };

    PuzzleAnalytics.prototype.injectObserver = function () {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                const metricName = entry.name;
                this.measuredTimes[metricName] = Math.round(entry.startTime + entry.duration);
            }
        });
        observer.observe({entryTypes: ['paint']});
    };

    function PuzzleUtil() {
    }


    function PuzzleInfo() {
        wrapGroup('PuzzleJs', 'Debug Mode - Package Info', () => {
            this.logo();
        });
    }

    PuzzleInfo.prototype.logo = function () {
        console.log('%c       ', 'font-size: 400px; background: url(https://camo.githubusercontent.com/77c4a5c7adc5f0d99a319130498e5a44a2c50e01/68747470733a2f2f696d6167652e6962622e636f2f6a4d32396f6e2f70757a7a6c656c6f676f2e706e67) no-repeat;');
    };

    function PuzzleJs() {
        this.analytics = new PuzzleAnalytics();
        this.info = new PuzzleInfo();
    }

    Object.defineProperty(scope, 'PuzzleJs', {
        value: new PuzzleJs(),
        writable: false,
        enumerable: false,
        configurable: false
    });
})(window);
