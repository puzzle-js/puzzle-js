import warden from "puzzle-warden";
import * as request from "request";
import {container, TYPES} from "./base";
import {Logger} from "./logger";

const logger = container.get(TYPES.Logger) as Logger;


class AssetManager {
  static init() {
    warden.register('Assets', {
      identifier: '{url}{query.__version}',
      gzip: true,
      holder:true,
      timeout: 2000,
      cache: {
        duration: '30 days'
      },
      retry: {
        count: 5,
        delay: 100
      }
    });
  }

  static async getAsset(url: string, gateway: string): Promise<{ error: any, response: request.Response | undefined, data: any }> {
    return new Promise((resolve, reject) => {
      warden.request('Assets', {
        headers: {
          gateway
        },
        url,
        method: 'get'
      }, (error, response, data) => {
        if (!error && data) {
          resolve({error, response, data});
        } else {
          logger.error(new Error(`Failed to fetch asset from gateway: ${url}`));
          reject({error, response});
        }
      });
    });

  }
}

export {
  AssetManager
};
