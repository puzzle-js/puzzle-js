import {IPageLibAsset} from "./types";

export class AssetHelper {
  static loadJs(asset: IPageLibAsset): Promise<void> {
    return new Promise((resolve, reject) => {
      const scriptTag = document.createElement('script');
      scriptTag.type = 'text/javascript';
      scriptTag.attributes['puzzle-asset'] = asset.name;
      scriptTag.src = asset.link;
      scriptTag.onload = () => resolve();
      scriptTag.defer = asset.defer || false;
      window.document.body.appendChild(scriptTag);
    });
  }

  static loadCSS() {

  }
}
