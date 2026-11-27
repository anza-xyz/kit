/**
 * Transforms a value into a JSON string, whilst rendering bigints as large unsafe integers.
 */
export function stringifyJsonWithBigInts(value: unknown, space?: number | string): string {
    return unwrapBigIntValueObject(
        JSON.stringify(value, 'toJSON' in BigInt.prototype ? wrapBigIntsBehindToJson : wrapBigInts, space),
    );
}

function wrapBigInts(_: string, v: unknown): unknown {
    return typeof v === 'bigint' ? wrapBigIntValueObject(v) : v;
}

function wrapBigIntsBehindToJson(this: object, key: string, v: unknown): unknown {
    // `this` is the holder. `JSON.stringify` has already passed `v` through `BigInt.prototype.toJSON`, so the
    // bigint is read from the holder, through its descriptor so that a getter does not run a second time.
    const holderValue: unknown = Object.getOwnPropertyDescriptor(this, key)?.value;
    return typeof holderValue === 'bigint' ? wrapBigIntValueObject(holderValue) : wrapBigInts(key, v);
}

type BigIntValueObject = {
    // `$` implies 'this is a value object'.
    // `n` implies 'interpret the value as a bigint'.
    $n: string;
};

function wrapBigIntValueObject(value: bigint): BigIntValueObject {
    return { $n: `${value}` };
}

function unwrapBigIntValueObject(value: string): string {
    return value.replace(/\{\s*"\$n"\s*:\s*"(-?\d+)"\s*\}/g, '$1');
}
