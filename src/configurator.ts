import {sealed} from "./decorators";
import {struct} from "superstruct";
import {IGatewayBFFConfiguration, IStorefrontConfig} from "./types";
import {ERROR_CODES, PuzzleError} from "./errors";
import {HTTP_METHODS, INJECTABLE, RESOURCE_INJECT_TYPE} from "./enums";
import {RESOURCE_LOADING_TYPE, RESOURCE_TYPE} from "@puzzle-js/client-lib/dist/enums";

const httpsStructure = struct({
    allowHTTP1: struct.optional('boolean'),
    key: struct.optional(struct.union(['string', 'buffer'])),
    cert: struct.optional(struct.union(['string', 'buffer']))
});

const serverOptionsStructure = struct({
    port: struct.optional('number'),
    hostname: struct.optional('string'),
    http2: struct.optional('boolean'),
    https: struct.optional(httpsStructure)
});

const apiEndpointsStructure = struct({
    path: 'string',
    middlewares: struct.optional(['string']),
    method: struct.enum(Object.values(HTTP_METHODS)),
    controller: 'string',
    routeCache: 'number?',
    cacheControl: 'string?'
});

const customHeaderStructure = struct({
    key: 'string',
    value: struct.union(['string', 'number']),
    isEnv: 'boolean?'
});

const apiVersionStructure = struct({
    handler: 'string?',
    endpoints: [apiEndpointsStructure]
});

const apiStructure = struct({
    name: 'string',
    testCookie: 'string',
    liveVersion: 'string',
    versions: struct.dict(['string', apiVersionStructure])
});

const gatewayRenderStructure = struct({
    url: struct.union(['string', ['string']]),
    static: 'boolean?',
    selfReplace: 'boolean?',
    placeholder: 'boolean?',
    error: 'boolean?',
    timeout: 'number?',
    middlewares: struct.optional(['string']),
    routeCache: 'number?'
});

const gatewayFragmentAssetsStructure = struct({
    name: 'string',
    fileName: 'string',
    link: 'string?',
    loadMethod: struct.enum(Object.values(RESOURCE_LOADING_TYPE)),
    type: struct.enum(Object.values(RESOURCE_TYPE)),
    dependent: struct.optional(['string'])
});

const gatewayFragmentDependenctStructure = struct({
    name: 'string',
    type: struct.enum(Object.values(RESOURCE_TYPE)),
    link: 'string?',
    preview: 'string?',
    injectType: struct.optional(struct.enum(Object.values(RESOURCE_INJECT_TYPE)))
});

const gatewayFragmentVersionStructure = struct({
    assets: [gatewayFragmentAssetsStructure],
    dependencies: [gatewayFragmentDependenctStructure],
    handler: 'string?'
});


const gatewayFragmentStructure = struct({
    name: 'string',
    testCookie: 'string',
    prg: struct.optional('boolean'),
    render: gatewayRenderStructure,
    warden: struct.optional('object'),
    version: 'string',
    versionMatcher: 'string?',
    versions: struct.dict(['string', gatewayFragmentVersionStructure])
});

const gatewayStructure = struct({
    name: 'string',
    url: 'string',
    serverOptions: serverOptionsStructure,
    fragments: [gatewayFragmentStructure],
    api: [apiStructure],
    isMobile: 'boolean?',
    authToken: 'string?',
    fragmentsFolder: 'string',
    corsDomains: struct.optional(['string']),
    corsMaxAge: 'number?',
    customHeaders: struct.optional([customHeaderStructure])
});

const storefrontPageStructure = struct({
    page: 'string?',
    html: 'string',
    url: struct.union(['string', ['string']]),
    condition: 'function?'
});

const storefrontGatewaysStructure = struct({
    name: 'string',
    url: 'string',
    assetUrl: 'string?'
});

const storefrontDependencyStructure = struct({
    content: 'string?',
    link: 'string?'
});

const storefrontStructure = struct({
    gateways: [storefrontGatewaysStructure],
    serverOptions: serverOptionsStructure,
    authToken: 'string?',
    satisfyUpdateCount: 'number?',
    pages: [storefrontPageStructure],
    pollInterval: 'number?',
    dependencies: [storefrontDependencyStructure],
    customHeaders: struct.optional([customHeaderStructure])
});

@sealed
export class Configurator {
    configuration: IGatewayBFFConfiguration | IStorefrontConfig;
    protected dependencies: { [name: string]: any } = {
        [INJECTABLE.CUSTOM]: {},
        [INJECTABLE.HANDLER]: {},
        [INJECTABLE.MIDDLEWARE]: {},
    };

    register(name: string, type: INJECTABLE, dependency: any): void {
        this.dependencies[type][name] = dependency;
    }

    get(name: string, type: INJECTABLE): any {
        return this.dependencies[type][name];
    }

    /**
     * Config json
     * @param {IStorefrontConfig | IGatewayBFFConfiguration} configuration
     */
    config(configuration: IStorefrontConfig | IGatewayBFFConfiguration) {
        this.validate(configuration);

        this.injectDependencies(configuration);

        this.configuration = Object.assign({}, configuration);
    }

    protected validate(configuration: IStorefrontConfig | IGatewayBFFConfiguration) {
        throw new PuzzleError(ERROR_CODES.CONFIGURATION_BASE_VALIDATION_ERROR);
    }

    protected injectDependencies(configuration: IStorefrontConfig | IGatewayBFFConfiguration) {
        throw new PuzzleError(ERROR_CODES.CONFIGURATION_BASE_VALIDATION_ERROR);
    }
}


@sealed
export class StorefrontConfigurator extends Configurator {
    configuration: IStorefrontConfig;

    protected validate(configuration: IStorefrontConfig) {
        storefrontStructure(configuration);
    }

    protected injectDependencies(configuration: IStorefrontConfig) {

    }
}


@sealed
export class GatewayConfigurator extends Configurator {
    configuration: IGatewayBFFConfiguration;

    protected validate(configuration: IGatewayBFFConfiguration) {
        gatewayStructure(configuration);
    }

    protected injectDependencies(configuration: IGatewayBFFConfiguration) {
        this.injectCustomDependencies(configuration);
        this.injectApiHandlers(configuration);
        this.prepareFragmentConfiguration(configuration);
    }

    private injectApiHandlers(configuration: IGatewayBFFConfiguration) {
        configuration.api.forEach(api => {
            (Object.values(api.versions) as any).forEach((version: any) => {
                if (version.handler) {
                    version.handler = this.dependencies[INJECTABLE.HANDLER][version.handler];
                }

                version.endpoints.forEach((endpoint: any) => {
                    endpoint.middlewares = (endpoint.middlewares as any || []).map((middleware: string) => this.dependencies[INJECTABLE.MIDDLEWARE][middleware]);
                });
            });
        });
    }

    private prepareFragmentConfiguration(configuration: IGatewayBFFConfiguration) {
        configuration.fragments.forEach(fragment => {
            (Object.values(fragment.versions) as any).forEach((version: any) => {
                if (version.handler) {
                    version.handler = this.dependencies[INJECTABLE.HANDLER][version.handler];
                }
            });

            fragment.render.middlewares = (fragment.render.middlewares as any || [])
                .map((middleware: string) => this.dependencies[INJECTABLE.MIDDLEWARE][middleware]);
        });
    }

    private injectCustomDependencies(configuration: { [key: string]: any }) {
        Object.keys(configuration).forEach((key) => {
            if (typeof configuration[key] !== 'object') {
                const targetDependency = this.get(configuration[key], INJECTABLE.CUSTOM);
                if (targetDependency) {
                    configuration[key] = targetDependency;
                }
            } else {
                this.injectCustomDependencies(configuration[key]);
            }
        });
    }
}
