import {EventEmitter} from "events";

export const wait = (seconds: number) => {
    return new Promise(resolve =>
        setTimeout(() => resolve(), seconds)
    );
};


export const pubsub = new EventEmitter();
