import nock from "nock";
import {IExposeConfig} from "../../src/types";

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


export const createExpressMock = (extendable?: { write?: Function, json?: Function, end?: Function, set?: Function, status?: Function, send?: Function }) => {
  const expressMock = {
      write: extendable && extendable.write || (() => ''),
      end: extendable && extendable.end || (() => ''),
      set: extendable && extendable.set || (() => ''),
      status: (statusCode: number) => {
        if (extendable && extendable.status) {
          extendable.status(statusCode);
        }
        return expressMock;
      },
      json: extendable && extendable.json || (() => ''),
    send: extendable
&&
  extendable.send ? extendable.send : (extendable && extendable.end ? extendable.end : (() => ''))
}
  ;

  return expressMock;
};
