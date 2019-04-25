import {IPageLibAsset} from "./types";

export class AssetHelper {
  static loadJs(asset: IPageLibAsset): Promise<any> | null {
    let loader: Promise<any> | null = null;
    const scriptTag = document.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.attributes['puzzle-asset'] = asset.name;
    scriptTag.src = asset.link;
    scriptTag.defer = asset.defer || false;

    if (!asset.defer) {
      loader = new Promise((resolve, reject) => {
        scriptTag.onload = () => {
          resolve();
        };
      });
    }

    window.document.body.appendChild(scriptTag);

    return loader;
  }

  static loadJsSeries(scripts: IPageLibAsset[]) {
    for (let i = 0, p: any = Promise.resolve(); i < scripts.length; i++) {
      p = p.then(_ => new Promise(resolve => {
          const assetLoading = AssetHelper.loadJs(scripts[i]);
          if (!assetLoading) {
            resolve();
          } else {
            assetLoading.then(() => {
              resolve();
            });
          }
        }
      ));
    }
  }

  static loadCSS() {

  }
}
