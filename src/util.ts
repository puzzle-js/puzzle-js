import {EventEmitter} from "events";

export const wait = (seconds: number) => {
    return new Promise(resolve =>
        setTimeout(() => resolve(), seconds)
    );
};

export const isDebug = () => {
    return process.env.NODE_ENV === 'debug';
};


export const pubsub = new EventEmitter();
