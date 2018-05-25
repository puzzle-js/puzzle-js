import {performance} from 'perf_hooks';

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
            throw new Error("You can't call this method more than one once");
        }
    };

    return newDescriptor;
};

export const benchmark = (enabled: boolean) => {
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

            console.log(`           Benchmarking    :  ${this.constructor.name} - ${propertyKey}`);
            console.log('           RAM             : ', (m1.rss - m0.rss) / 1048576, 'mb');
            console.log('           HeapTotal       : ', (m1.heapTotal - m0.heapTotal) / 1048576, 'mb');
            console.log('           HeapUsed        : ', (m1.heapUsed - m0.heapUsed) / 1048576, 'mb');
            console.log('           CPU             : ', (diffCPU.user + diffCPU.system) / 1000000, 's');
            console.log('           Spend time      : ', (new_time - old_time), 'ms');

            return returnValue;
        };

        return newDescriptor;
    };
};
