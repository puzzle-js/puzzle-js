import {Module} from "../module";
import {Util} from "../util";
import {on} from "../decorators";
import {EVENT} from "../enums";


export class Storage extends Module {
    @on(EVENT.ON_PAGE_LOAD)
    static async end() {
        const applicationCacheStorageList = await Storage.printApplicationCacheInfo();

        Util.wrapGroup('PuzzleJs', 'Debug Mode - Storage', () => {
            if (window.caches) {
                Util.wrapGroup('PuzzleJs', 'Application Cache', () => {
                    Util.table(applicationCacheStorageList);
                });
            }
        });
    }

    static async printApplicationCacheInfo() {
        const cacheNames = await caches.keys();
        let storageList: { [key: string]: any } = {
            total: 0
        };

        const sizePromises = cacheNames.map(async cacheName => {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            let cacheSize = 0;

            await Promise.all(keys.map(async key => {
                const response = await cache.match(key);
                if (response) {
                    const blob = await response.blob();
                    storageList.total += blob.size;
                    cacheSize += blob.size;
                }
            }));

            storageList[cacheName] = `${cacheSize} bytes`;
        });

        await Promise.all(sizePromises);

        storageList.total = `${storageList.total} bytes`;
        return storageList;
    }
}
