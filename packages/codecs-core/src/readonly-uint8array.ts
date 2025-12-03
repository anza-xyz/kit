/**
 * A read-only variant of `Uint8Array`.
 *
 * This type prevents modifications to the array by omitting mutable methods such as `copyWithin`,
 * `fill`, `reverse`, `set`, and `sort`, while still allowing indexed access to elements.
 *
 * @example
 * ```ts
 * const bytes: ReadonlyUint8Array = new Uint8Array([1, 2, 3]);
 * console.log(bytes[0]); // 1
 * bytes[0] = 42; // Type error: Cannot assign to '0' because it is a read-only property.
 * ```
 */
export interface ReadonlyUint8Array extends Omit<Uint8Array, TypedArrayMutableProperties> {
    readonly [n: number]: number;
}

type TypedArrayMutableProperties = 'copyWithin' | 'fill' | 'reverse' | 'set' | 'sort';
