import http from "http";
import https from "https";
import {injectable} from "inversify";
import {CIRCUIT_ENABLED, KEEP_ALIVE_MSECS, PUZZLE_MAX_SOCKETS} from "./config";
import warden from "puzzle-warden";
import supra from "supra-http";

// warden.debug = true;

const AGENT_CONFIGURATION = {
  keepAlive: true,
  maxSockets: PUZZLE_MAX_SOCKETS,
  keepAliveMsecs: KEEP_ALIVE_MSECS
};

export const httpAgent = new http.Agent(AGENT_CONFIGURATION);
export const httpsAgent = new https.Agent(AGENT_CONFIGURATION);

@injectable()
export class HttpClient {
  get(requestUrl: string, fragmentName: string, options?: any): Promise<{ response: http.IncomingMessage, data: any }> {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        url: requestUrl,
        method: 'get',
        json: true,
        allowWarmUp: true,
        errorThresholdPercentage: 60,
        resetTimeout: 5000,
        enabled: CIRCUIT_ENABLED
      } as any;

      if (options) {
        requestOptions.headers = options.headers;
        requestOptions.httpTimeout = options.timeout;
      }


      if (warden.isRouteRegistered(fragmentName)) {
        warden.request(fragmentName, requestOptions, (err, response, data) => {
          if (!err && response && data) {
            resolve({
              response,
              data
            });
          } else {
            reject(err);
          }
        });
      } else {
        supra.request(fragmentName, requestOptions.url, requestOptions)
          .then(res => {
            resolve({
              response: res.response,
              data: res.json || res.body
            });
          })
          .catch(reject);
      }
    });
  }
}