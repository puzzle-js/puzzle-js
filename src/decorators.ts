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
