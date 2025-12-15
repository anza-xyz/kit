/**
 * A read-only variant of `Uint8Array`.
 *
 * This type prevents modifications to the array by omitting mutable methods such as `copyWithin`,
 * `fill`, `reverse`, `set`, and `sort`, while still allowing indexed access to elements.
 *
 * It also overrides the `subarray` method to return a `ReadonlyUint8Array` instead of a
 * `Uint8Array`, prevents modification from functions taking a callback, and removes the
 * `setFrom<Format>` methods that were recently added to `Uint8Array`.
 *
 * @example
 * ```ts
 * const bytes: ReadonlyUint8Array = new Uint8Array([1, 2, 3]);
 * console.log(bytes[0]); // 1
 * bytes[0] = 42; // Type error: Cannot assign to '0' because it is a read-only property.
 * ```
 */
//  eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ReadonlyUint8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends ReadonlyUint8ArrayBase<ReadonlyUint8Array<TArrayBuffer>, TArrayBuffer> {}

declare const roBrand: unique symbol;
interface Marker<TArrayBuffer extends ArrayBufferLike>
    extends Uint8Array<TArrayBuffer> {
  [roBrand]: true;
}

type ReplaceMarker<T, Self, TArrayBuffer extends ArrayBufferLike> =
  T extends Marker<TArrayBuffer>
  ? Self
  : T extends ArrayBuffer | IteratorObject<unknown> | Uint8Array
  ? T
  : T extends (...args: infer A) => infer R
  ? (...args: ReplaceMarker<A, Self, TArrayBuffer>) => ReplaceMarker<R, Self, TArrayBuffer>
  : T extends readonly unknown[]
  ? { readonly [K in keyof T]: ReplaceMarker<T[K], Self, TArrayBuffer> }
  : T extends object
  ? { [K in keyof T]: ReplaceMarker<T[K], Self, TArrayBuffer> }
  : T;

type TypedArrayMutableProperties = "copyWithin" | "fill" | "reverse" | "set" | "sort";
type Uint8ArrayMutableProperties = "setFromBase64" | "setFromHex";
type Uint8ArrayOmittedProperties =
  TypedArrayMutableProperties | Uint8ArrayMutableProperties | typeof roBrand | "subarray";

type ReadonlyUint8ArrayBase<Self, TArrayBuffer extends ArrayBufferLike> =
  ReplaceMarker<Omit<Marker<TArrayBuffer>, Uint8ArrayOmittedProperties>, Self, TArrayBuffer> & {
    readonly [n: number]: number;
    subarray(...params: Parameters<Uint8Array["subarray"]>): Self;
  };
