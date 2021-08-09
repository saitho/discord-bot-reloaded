const SubMethods = Symbol('SubMethods'); // just to be sure there won't be collisions

export function description(description: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        target[SubMethods] = target[SubMethods] || new Map();
        const obj = target[SubMethods].get(propertyKey) ?? {};
        obj.description = description;
        target[SubMethods].set(propertyKey, obj);
    };
}

export function command(name: string, description: string) {
    return function (constructor: Function) {
        const subMethods = constructor.prototype[SubMethods];
        constructor.prototype.commandName = name;
        constructor.prototype.commandDescription = description;
        constructor.prototype.subCommands = [];
        for (const subMethod of subMethods) {
            constructor.prototype.subCommands.push(subMethod[1]);
        }
    }
}

export function name(name: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        target[SubMethods] = target[SubMethods] || new Map();
        const obj = target[SubMethods].get(propertyKey) ?? {};
        obj.name = name;
        obj.funcName = descriptor.value.name
        target[SubMethods].set(propertyKey, obj);
    };
}

export function group(group: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        target[SubMethods] = target[SubMethods] || new Map();
        const obj = target[SubMethods].get(propertyKey) ?? {};
        obj.group = group;
        target[SubMethods].set(propertyKey, obj);
    };
}

export function option(name: string, description: string, type: number, required = false, choices = []) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        target[SubMethods] = target[SubMethods] || new Map();
        const obj = target[SubMethods].get(propertyKey) ?? {};
        obj.options = obj.options ?? [];
        obj.options.push({
            name,
            group,
            description,
            type,
            required,
            choices
        });
        target[SubMethods].set(propertyKey, obj);
    };
}
