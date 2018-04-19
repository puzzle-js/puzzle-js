import nock from "nock";
import {IExposeConfig} from "../../src/types/gateway";

export const createGateway = (gatewayName: string, gatewayUrl: string, config: IExposeConfig, persist = false) => {
    let scope = nock(gatewayUrl);

    if (persist) {
        scope = scope.persist();
    }

    scope = scope
        .get('/')
        .reply(200, config);

    return scope;
};
