import {injectable} from "inversify";

const winston = require('winston');
const WinstonGraylog2 = require('winston-graylog2');
const logLevels = winston.config.npm.levels;

/**
 * Creates winston transports
 * @returns {Array}
 */
const createTransports = () => {
    const transports: any[] = [];
    if (process.env.ENABLE_CONSOLE_ERROR === "true") {
        transports.push(new winston.transports.Console({
            level: process.env.logLevel || 'warn',
            handleExceptions: false,
            json: false,
            colorize: false
        }));
    }

    if (process.env.GRAYLOG_HOST && process.env.GRAYLOG_PORT && process.env.GRAYLOG_HOSTNAME && process.env.GRAYLOG_FACILITY) {
        transports.push(new WinstonGraylog2({
            name: 'Graylog',
            level: process.env.logLevel || 'warn',
            silent: false,
            handleExceptions: false,
            graylog: {
                servers: [{host: process.env.GRAYLOG_HOST, port: +process.env.GRAYLOG_PORT}],
                hostname: process.env.GRAYLOG_HOSTNAME,
                facility: process.env.GRAYLOG_FACILITY,
                bufferSize: 1400,
            },
            staticMeta: {}
        }));
    }
    return transports;
};
Object.defineProperty(Error.prototype, 'toJSON', {
    value(this: { [name: string]: string }) {
        const alt: any = {};
        const propNames = Object.getOwnPropertyNames(this);
        for (let i = 0, len = propNames.length; i < len; i++) {
            const key = propNames[i];
            alt[key] = this[key];
        }
        return alt;
    },
    configurable: true,
    writable: true
});
/**
 * Create global logger
 */
const _logger = winston.createLogger({
    transports: createTransports()
});
export const logger: any = {};
Object.keys(logLevels).forEach(level => {
    logger[level] = function (message: string, meta?: object) {
        _logger[level](
            {
                message,
                meta
            }
        );
    };
});
/**
 * Register to error events
 */
if (process.env.NODE_ENV === 'production') {
    process
        .on('unhandledRejection', (reason, p) => {
            logger.error('UN_HANDLED_REJECTION', reason, p);
        })
        .on('uncaughtException', err => {
            logger.error('UN_CAUGHT_EXCEPTION', err);
        });
}

@injectable()
export class Logger {
    logger: any;

    [name: string]: (...args: any[]) => void;


    constructor() {
        this.logger = logger;
        Object.keys(logLevels).forEach(level => {
            this[level] = logger[level];
        });
    }

    write(message: string) {
        let level = 'info';
        if (message.match(/RES: [4]/)) {
            level = 'warn';
        } else if (message.match(/RES: [5]/)) {
            level = 'error';
        }

        logger[level](message);
    }
}
