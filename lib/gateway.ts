import md5 from "md5";
import {EventEmitter} from "events";
import {IFragmentBFF, IFragmentBFFRender} from "./fragment";
import {IFileResourceAsset, IFileResourceDependency} from "./resource";
import {IExposeConfig} from "../dist/lib/gateway";

export interface IGatewayConfiguration {
    name: string;
    url: string;
}

export interface IGatewayBFFConfiguration extends IGatewayConfiguration {
    fragments: Array<IFragmentBFF>;
    api: Array<any>;
    port: number;
    isMobile?: boolean;
}

export class Gateway {
    public name: string;
    public url: string;

    constructor(gatewayConfig: IGatewayConfiguration) {
        this.name = gatewayConfig.name;
        this.url = gatewayConfig.url;
    }
}


export class GatewayStorefrontInstance extends Gateway {
    private eventBus: EventEmitter;

    constructor(gatewayConfig: IGatewayConfiguration, eventBus: EventEmitter) {
        super(gatewayConfig);

        this.eventBus = eventBus;
    }
}

export interface IExposeConfig {
    hash: string;
    fragments: IExposeFragment
}

export interface IExposeFragment {
    [name: string]: {
        version: string;
        render: IFragmentBFFRender;
        assets: Array<IFileResourceAsset>;
        dependencies: Array<IFileResourceDependency>;
    }
}

export class GatewayBFF extends Gateway {
    private config: IGatewayBFFConfiguration;
    public exposedConfig: IExposeConfig;

    constructor(gatewayConfig: IGatewayBFFConfiguration) {
        super(gatewayConfig);
        this.config = gatewayConfig;
        this.exposedConfig = {
            fragments: this.config.fragments.reduce((fragmentList: IExposeFragment, fragment) => {
                fragmentList[fragment.name] = {
                    version: fragment.version,
                    render: fragment.render,
                    assets: fragment.versions[fragment.version].assets,
                    dependencies: fragment.versions[fragment.version].dependencies,
                };

                return fragmentList;
            }, {}),
            hash: '',
        };
        this.exposedConfig.hash = md5(JSON.stringify(this.exposedConfig));
    }

    public renderFragment(fragmentName: string, version?: string) {
        const fragment = this.config.fragments
            .find(fragment => fragment.name == fragmentName && (version ? typeof fragment.versions[version] != 'undefined' : true));

        if(fragment){
            console.log(fragment.versions[version || fragment.version].handler);
            return fragment.versions[version || fragment.version].handler.content();
        }
    }
}
