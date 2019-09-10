import {EventEmitter} from "events";
import fs from "fs";
import path from "path";

export const wait = (seconds: number) => {
    return new Promise(resolve =>
        setTimeout(() => resolve(), seconds)
    );
};

export const isDebug = () => {
    return process.env.NODE_ENV === 'debug';
};

export const LIB_CONTENT_DEBUG = process.env.JEST_WORKER_ID ? 'puzzleLibDebugScript' : fs.readFileSync(path.join(__dirname,'../node_modules/@puzzle-js/client-lib/public/puzzle_debug.min.js'), 'utf8').toString();
export const LIB_CONTENT = process.env.JEST_WORKER_ID ? 'puzzleLibScript': fs.readFileSync(path.join(__dirname,'../node_modules/@puzzle-js/client-lib/public/puzzle.min.js'), 'utf8').toString();


export const pubsub = new EventEmitter();
