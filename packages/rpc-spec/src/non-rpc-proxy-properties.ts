const NODEJS_CUSTOM_INSPECT_SYMBOL = Symbol.for('nodejs.util.inspect.custom');

const JAVASCRIPT_PROTOCOL_PROPERTY_NAMES = new Set<PropertyKey>([
    'then',
    'toJSON',
    NODEJS_CUSTOM_INSPECT_SYMBOL,
    Symbol.asyncIterator,
    Symbol.iterator,
    Symbol.toPrimitive,
    Symbol.toStringTag,
]);

const OBJECT_PROTOTYPE_PROPERTY_NAMES = new Set<PropertyKey>([
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__',
    '__proto__',
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'valueOf',
]);

export function getNonRpcPropertyValue(propertyName: string | symbol, receiver: unknown): unknown {
    if (JAVASCRIPT_PROTOCOL_PROPERTY_NAMES.has(propertyName)) {
        return undefined;
    }
    return Reflect.get(Object.prototype, propertyName, receiver);
}

export function isNonRpcPropertyName(propertyName: string | symbol): boolean {
    return JAVASCRIPT_PROTOCOL_PROPERTY_NAMES.has(propertyName) || OBJECT_PROTOTYPE_PROPERTY_NAMES.has(propertyName);
}
