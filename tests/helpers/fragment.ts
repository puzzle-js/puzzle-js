import faker from "faker";
import {RESOURCE_LOADING_TYPE, RESOURCE_TYPE} from "@puzzle-js/client-lib/src/enums";

export default class FragmentHelper {

    static create() : any{
        const assetSize = faker.random.number({min : 1, max: 5});
        const dependenciesSize = faker.random.number({min : 1, max: 5});
        return {
            name: faker.lorem.word().split(' ')[0],
            shouldWait: faker.random.boolean(),
            testCookie: faker.random.word().split(' ')[0],
            config: {
                version: "1.0.0",
                assets: FragmentHelper.createAssets(assetSize),
                dependencies: FragmentHelper.createAssets(dependenciesSize),
                render: {
                    static: faker.random.boolean()
                },
                passiveVersions: {
                    "2.0.0": {
                        assets: FragmentHelper.createAssets(assetSize),
                        dependencies: FragmentHelper.createAssets(dependenciesSize),
                    },
                    "3.0.0": {
                        assets: FragmentHelper.createAssets(assetSize),
                        dependencies: FragmentHelper.createAssets(dependenciesSize),
                    }
                }
            },
            detectVersion: () => "1.0.0",
            getAsset: (arg) => arg
        };
    };

    private static createAssets(size): any {
        const assets = Array(size).fill(0).map( () => {
            return {
                name: faker.lorem.word().split(' ')[0],
                type: faker.random.arrayElement([RESOURCE_TYPE.JS, RESOURCE_TYPE.CSS]),
                link: faker.internet.url(),
                dependent: [],
                loadMethod: RESOURCE_LOADING_TYPE.ON_RENDER_START,
            }
        });
        const uniqueAssets: any = [];
        assets.forEach( (asset) => {
            if(!uniqueAssets.find( (u) => u.name === asset.name)){
                uniqueAssets.push(asset);
            }
        });
        return uniqueAssets;
    };

}

