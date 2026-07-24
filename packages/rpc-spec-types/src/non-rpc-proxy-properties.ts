const NODEJS_CUSTOM_INSPECT_SYMBOL = /* @__PURE__ */ Symbol.for('nodejs.util.inspect.custom');

const JAVASCRIPT_PROTOCOL_PROPERTY_NAMES = /* @__PURE__ */ new Set<string | symbol>(
    [
        'then',
        'toJSON',
        NODEJS_CUSTOM_INSPECT_SYMBOL,
        Symbol.asyncIterator,
        Symbol.iterator,
        Symbol.toPrimitive,
        Symbol.toStringTag,
        Symbol.asyncDispose,
        Symbol.dispose,
    ].filter((propertyName): propertyName is string | symbol => propertyName != null),
);

const OBJECT_PROTOTYPE_PROPERTY_NAMES = /* @__PURE__ */ new Set<string | symbol>([
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

/**
 * Gets the value of a property that must not be treated as an RPC method.
 *
 * @see https://github.com/anza-xyz/kit/issues/509
 * @internal
 */
export function getNonRpcPropertyValue(propertyName: string | symbol, receiver: unknown): unknown {
    if (JAVASCRIPT_PROTOCOL_PROPERTY_NAMES.has(propertyName)) {
        return undefined;
    }
    return Reflect.get(Object.prototype, propertyName, receiver);
}

/**
 * Returns whether a property name must not be treated as an RPC method.
 *
 * @see https://github.com/anza-xyz/kit/issues/509
 * @internal
 */
export function isNonRpcPropertyName(propertyName: string | symbol): boolean {
    return JAVASCRIPT_PROTOCOL_PROPERTY_NAMES.has(propertyName) || OBJECT_PROTOTYPE_PROPERTY_NAMES.has(propertyName);
}
