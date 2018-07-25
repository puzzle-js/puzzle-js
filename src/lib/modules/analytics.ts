import {Module} from "../module";
import {Util} from "../util";
import {EVENT, TIME_LABELS} from "../enums";
import {on} from "../decorators";
import {IPageFragmentConfig, IPageLibConfiguration} from "../types";


export class Analytics extends Module {
  static get fragments(): IPageFragmentConfig[] {
    return this._fragments;
  }

  static set fragments(value: IPageFragmentConfig[]) {
    this._fragments = value;
  }

  private static _fragments: IPageFragmentConfig[] = [];
  private static connectionInformation: any = null;

  @on(EVENT.ON_CONFIG)
  static start(config: string) {
    Analytics.connectionInformation = Analytics.collectConnectionInformation();
    performance.mark(`${TIME_LABELS.HTML_TRANSFER_STARTED}`);
    Analytics.fragments = Analytics.fragments.concat((JSON.parse(config) as IPageLibConfiguration).fragments);
  }

  @on(EVENT.ON_PAGE_LOAD)
  static end() {
    Util.wrapGroup('PuzzleJs', 'Debug Mode - Analytics', () => {
      Util.table({
        'Round Trip Time': `${this.connectionInformation.rtt} ms`,
        'Connection Speed': `${this.connectionInformation.downlink} kbps`,
        'Connection Type': this.connectionInformation.effectiveType
      });

      const fragmentsTableData = Analytics.fragments.reduce((fragmentMap, fragment) => {
        fragmentMap[fragment.name] = {
          'Parsing Started': `${~~(fragment as any).loadTime[0].startTime} ms`,
          'Parse Duration': `${~~(fragment as any).loadTime[0].duration} ms`,
        };
        return fragmentMap;
      }, {});
      Util.table(fragmentsTableData);

      if (window.performance && performance.getEntriesByType) {
        const performance = window.performance;
        const performanceEntries = performance.getEntriesByType('paint');
        performanceEntries.forEach((performanceEntry, i, entries) => {
          Util.log("The time to " + performanceEntry.name + " was " + performanceEntry.startTime + " milliseconds.");
        });
      }
    });
  }

  @on(EVENT.ON_FRAGMENT_RENDERED)
  static fragment(name) {
    const fragment = Analytics.fragments.find(fragment => fragment.name === name);
    performance.mark(`${TIME_LABELS.FRAGMENT_RENDER_END}${name}`);
    performance.measure(`${TIME_LABELS.FRAGMENT_MEASUREMENT}${name}`, `${TIME_LABELS.HTML_TRANSFER_STARTED}`, `${TIME_LABELS.FRAGMENT_RENDER_END}${name}`);
    (fragment as any).loadTime = performance.getEntriesByName(`${TIME_LABELS.FRAGMENT_MEASUREMENT}${name}`);
  }

  private static collectConnectionInformation() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    //if (!connection) log('Connection api is not supported', LOG_TYPES.WARN, LOG_COLORS.RED);
    return {
      rtt: connection ? connection.rtt : '',
      effectiveType: connection ? connection.effectiveType : '',
      downlink: connection ? connection.downlink : ''
    };
  }
}
