import {container} from "./base";

export const sealed = (constructor: Function) => {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
};

export const conditionalInject =  (injectable: symbol) => {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log(arguments);
    };
};
