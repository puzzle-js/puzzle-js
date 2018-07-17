import http from "http";
import https from "https";
import {injectable} from "inversify";
import request from "request";

export interface IRequestOptions {
  timeout: number;
  method: string;
}

const AGENT_CONFIGURATION = {
  keepAlive: true,
  maxSockets: Infinity,
};

@injectable()
export class HttpClient {
  private httpAgent: http.Agent;
  private httpsAgent: https.Agent;
  private httpClient: request.RequestAPI<request.Request, request.CoreOptions, request.RequiredUriUrl>;
  private httpsClient: request.RequestAPI<request.Request, request.CoreOptions, request.RequiredUriUrl>;

  constructor() {
    this.httpAgent = new http.Agent(AGENT_CONFIGURATION);
    this.httpsAgent = new https.Agent(AGENT_CONFIGURATION);
  }

  init(clientName: string, options?: request.CoreOptions) {
    this.httpClient = request.defaults({
      agent: this.httpAgent,
      encoding: 'utf8',
      ...options,
      headers: {
        'user-agent': clientName || 'PuzzleJs Http Client'
      },
    });

    this.httpsClient = request.defaults({
      agent: this.httpsAgent,
      encoding: 'utf8',
      ...options,
      headers: {
        'user-agent': clientName || 'PuzzleJs Https Client'
      },
    });
  }

  get(requestUrl: string, options?: request.CoreOptions): Promise<{ response: request.Response, data: any }> {
    if(!this.httpClient && !this.httpsClient) this.init('PuzzleJs Default Client');

    const client = requestUrl.startsWith('https') ? this.httpsClient : this.httpClient;

    return new Promise(function (resolve, reject) {
      client
        .get({
            url: requestUrl,
            ...options
          },
          (err, response, data) => {
            if (err) reject(err);

            resolve({
              response,
              data
            });
          });
    });
  }


  post(requestUrl: string, data?: object, options?: request.CoreOptions): Promise<{ response: request.Response, data: any }> {
    if(!this.httpClient && !this.httpsClient) this.init('PuzzleJs Default Client');

    const client = requestUrl.startsWith('https') ? this.httpsClient : this.httpClient;

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
