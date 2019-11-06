import warden from "puzzle-warden";
import * as request from "request";
import {container, TYPES} from "./base";
import {Logger} from "./logger";
import {CONTENT_ENCODING_TYPES} from "./enums";
import {decompress} from "iltorb";
const logger = container.get(TYPES.Logger) as Logger;
class AssetManager {
  static init() {
    warden.register('Assets', {
      identifier: '{url}{query.__version}',
      gzip: true,
      holder: true,
      timeout: 2000,
      cache: {
        duration: '10 days'
      },
      retry: {
        count: 5,
        delay: 100
      }
    });
  }
  static async getAsset(url: string, gateway?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      warden.request('Assets', {
        headers: gateway ? {
          gateway
        } : {},
        url,
        method: 'get'
      }, async (error, response, data) => {
        if (!error && data && response) {
          logger.info(`Asset received: ${url}`);
          resolve(data as string);
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
