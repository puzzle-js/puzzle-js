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

const LIB_DIR = path.dirname(require.resolve('@puzzle-js/client-lib'));

export const LIB_CONTENT_DEBUG = process.env.JEST_WORKER_ID ? 'puzzleLibDebugScript' : fs.readFileSync(path.join(LIB_DIR,'./public/puzzle_debug.min.js'), 'utf8').toString();
export const LIB_CONTENT = process.env.JEST_WORKER_ID ? 'puzzleLibScript': fs.readFileSync(path.join(LIB_DIR,'./public/puzzle.min.js'), 'utf8').toString();


export const pubsub = new EventEmitter();
