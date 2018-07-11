import {EVENT} from "./enums";
import {PuzzleJs} from "./puzzle";

export const on = (event: EVENT) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    PuzzleJs.subscribe(event, descriptor.value.bind(target));

    return descriptor;
  };
};
