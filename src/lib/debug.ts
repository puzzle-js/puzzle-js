import {PuzzleJs} from "./puzzle";
import {Core} from "./core";
import {Info} from "./modules/info";
import {Variables} from "./modules/variables";
import {Fragments} from "./modules/fragments";
import {Analytics} from "./modules/analytics";

(function () {
  const MODULES = {
    Core,
    Info,
    Variables,
    Fragments,
    Analytics
  };

  PuzzleJs.inject(MODULES);
  window.PuzzleJs = PuzzleJs;
})();





/**

 async function getCacheStoragesAssetTotalSize() {
  // Note: opaque (i.e. cross-domain, without CORS) responses in the cache will return a size of 0.
  const cacheNames = await caches.keys();

  let total = 0;

  const sizePromises = cacheNames.map(async cacheName => {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    let cacheSize = 0;

    await Promise.all(keys.map(async key => {
      const response = await cache.match(key);
      const blob = await response.blob();
      total += blob.size;
      cacheSize += blob.size;
    }));

    console.log(`Cache ${cacheName}: ${cacheSize} bytes`);
  });

  await Promise.all(sizePromises);

  return `Total Cache Storage: ${total} bytes`;
}


**/
