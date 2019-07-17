import {performance} from 'perf_hooks';
import {ERROR_CODES, PuzzleError} from "./errors";



export const sealed = (constructor: Function) => {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
};

export const callableOnce = (target: any, name: string, descriptor: PropertyDescriptor) => {
    const newDescriptor = Object.assign({}, descriptor);

    newDescriptor.value = function (this: any) {
        if (!this[`___callableOnce__${name}___`]) {
            descriptor.value.apply(this, arguments);
            this[`___callableOnce__${name}___`] = true;
        } else {
            throw new PuzzleError(ERROR_CODES.CALLABLE_ONCE_CALLED_MORE_THAN_ONE_TIME, target.constructor.name, name);
        }
    };

    return newDescriptor;
};

export const benchmark = (enabled: boolean, logger: (input: any) => void) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (!enabled) return descriptor;

        console.log(`Attaching benchmark to ${propertyKey}`);
        const newDescriptor = Object.assign({}, descriptor);
        newDescriptor.value = function (this: any) {
            const old_time = performance.now();
            const m0 = process.memoryUsage();
            const c0 = process.cpuUsage();

            const returnValue = descriptor.value.apply(this, arguments);

            const new_time = performance.now();
            const m1 = process.memoryUsage();
            const diffCPU = process.cpuUsage(c0);

            logger({
                benchmarking: `${this.constructor.name} - ${propertyKey}`,
                ram: `${(m1.rss - m0.rss) / 1048576} mb`,
                heapTotal: `${(m1.heapTotal - m0.heapTotal) / 1048576} mb`,
                heapUsed: `${(m1.heapUsed - m0.heapUsed) / 1048576} mb`,
                cpu: `${(diffCPU.user + diffCPU.system) / 1000000} s`,
                spendTime: `${(new_time - old_time)} ms`
            });

            return returnValue;
        };

        return newDescriptor;
    };
};

