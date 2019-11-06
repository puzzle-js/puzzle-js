import http from "http";
import https from "https";
import {injectable} from "inversify";
import request, {CoreOptions} from "request";
import {DEFAULT_CONTENT_TIMEOUT, KEEP_ALIVE_MSECS, PUZZLE_MAX_SOCKETS} from "./config";
import warden from "puzzle-warden";
import supra from "supra-http";

// warden.debug = true;

export interface IRequestOptions {
  timeout: number;
  method: string;
}

const AGENT_CONFIGURATION = {
  keepAlive: true,
  maxSockets: PUZZLE_MAX_SOCKETS,
  keepAliveMsecs: KEEP_ALIVE_MSECS
};

export const httpAgent = new http.Agent(AGENT_CONFIGURATION);
export const httpsAgent = new https.Agent(AGENT_CONFIGURATION);

@injectable()
export class HttpClient {
  private httpAgent: http.Agent;
  private httpsAgent: https.Agent;
  private static httpClient: request.RequestAPI<request.Request, request.CoreOptions, request.RequiredUriUrl>;
  private static httpsClient: request.RequestAPI<request.Request, request.CoreOptions, request.RequiredUriUrl>;
  private defaultOptions: CoreOptions;

  constructor() {
    this.httpAgent = httpAgent;
    this.httpsAgent = httpsAgent;
  }


  init(clientName: string, options?: request.CoreOptions) {
    this.defaultOptions = {
      encoding: 'utf8',
      gzip: true,
      ...options,
      headers: {
        'user-agent': clientName || 'PuzzleJs Http Client'
      },
    };

    HttpClient.httpClient = request.defaults({
      ...this.defaultOptions,
      timeout: DEFAULT_CONTENT_TIMEOUT,
      agent: httpAgent
    });
    HttpClient.httpsClient = request.defaults({
      ...this.defaultOptions,
      timeout: DEFAULT_CONTENT_TIMEOUT,
      agent: httpsAgent
    });
  }

  get(requestUrl: string, fragmentName: string, options?: request.CoreOptions): Promise<{ response: http.IncomingMessage, data: any }> {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        url: requestUrl,
        method: 'get',
        json: true,
        allowWarmUp: true,
        errorThresholdPercentage: 60,
        resetTimeout: 5000,
        enabled: true
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


  post(requestUrl: string, fragmentName: string, data?: object, options?: request.CoreOptions): Promise<{ response: request.Response, data: any }> {
    if (!HttpClient.httpClient && !HttpClient.httpsClient) this.init('PuzzleJs Default Client');

    const client = requestUrl.startsWith('https') ? HttpClient.httpsClient : HttpClient.httpClient;

    return new Promise(function (resolve, reject) {
      client
        .post({
          url: requestUrl,
          json: data,
          ...options
        }, (err, response, data) => {
          if (err) reject(err);

          resolve({
            response,
            data
          });
        });
    });
  }
}
