import { isOption, isSome, None, Some } from './option';

/**
 * Defines types that should not be recursively unwrapped.
 *
 * These types are preserved as-is when using {@link unwrapOptionRecursively}.
 *
 * @see {@link unwrapOptionRecursively}
 */
type UnUnwrappables =
    | Date
    | Int8Array
    | Int16Array
    | Int32Array
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | bigint
    | boolean
    | number
    | string
    | symbol
    | null
    | undefined;

/**
 * A type that recursively unwraps nested {@link Option} types.
 *
 * This type resolves all nested {@link Option} values, ensuring
 * that deeply wrapped values are properly extracted.
 *
 * - If `T` is an {@link Option}, it resolves to the contained value.
 * - If `T` is a known primitive or immutable type, it remains unchanged.
 * - If `T` is an object or array, it recursively unwraps any options found.
 *
 * The fallback type `U` (default: `null`) is used in place of `None` values.
 *
 * @typeParam T - The type to be unwrapped.
 * @typeParam U - The fallback type for `None` values (defaults to `null`).
 *
 * @example
 * Resolving nested `Option` types.
 * ```ts
 * UnwrappedOption<Some<Some<string>>>; // string
 * UnwrappedOption<None>;               // null
 * ```
 *
 * @example
 * Resolving options inside objects and arrays.
 * ```ts
 * UnwrappedOption<{ a: Some<number>; b: None }>; // { a: number; b: null }
 * UnwrappedOption<[Some<number>, None]>;         // [number, null]
 * ```
 *
 * @see {@link unwrapOptionRecursively}
 */
export type UnwrappedOption<T, U = null> =
    T extends Some<infer TValue>
        ? UnwrappedOption<TValue, U>
        : T extends None
          ? U
          : T extends UnUnwrappables
            ? T
            : T extends object
              ? { [key in keyof T]: UnwrappedOption<T[key], U> }
              : T extends Array<infer TItem>
                ? Array<UnwrappedOption<TItem, U>>
                : T;

/**
 * Recursively unwraps all nested {@link Option} types within a value.
 *
 * This function traverses a given value and removes all instances
 * of {@link Option}, replacing them with their contained values.
 *
 * - If an {@link Option} is encountered, its value is extracted.
 * - If an array or object is encountered, its elements are traversed recursively.
 * - If `None` is encountered, it is replaced with the fallback value (default: `null`).
 *
 * @typeParam T - The type of the input value.
 * @typeParam U - The fallback type for `None` values (defaults to `null`).
 *
 * @param input - The value to unwrap.
 * @param fallback - A function that provides a fallback value for `None` options.
 * @returns The recursively unwrapped value.
 *
 * @example
 * Recursively unwrapping nested options.
 * ```ts
 * unwrapOptionRecursively(some(some('Hello World'))); // "Hello World"
 * unwrapOptionRecursively(some(none<string>()));      // null
 * ```
 *
 * @example
 * Recursively unwrapping options inside objects and arrays.
 * ```ts
 * unwrapOptionRecursively({
 *   a: 'hello',
 *   b: none(),
 *   c: [{ c1: some(42) }, { c2: none() }],
 * });
 * // { a: "hello", b: null, c: [{ c1: 42 }, { c2: null }] }
 * ```
 *
 * @example
 * Using a fallback value for `None` options.
 * ```ts
 * unwrapOptionRecursively(
 *   {
 *     a: 'hello',
 *     b: none(),
 *     c: [{ c1: some(42) }, { c2: none() }],
 *   },
 *   () => 'Default',
 * );
 * // { a: "hello", b: "Default", c: [{ c1: 42 }, { c2: "Default" }] }
 * ```
 *
 * @remarks
 * This function does not mutate objects or arrays.
 *
 * @see {@link Option}
 * @see {@link UnwrappedOption}
 */
export function unwrapOptionRecursively<T>(input: T): UnwrappedOption<T>;
export function unwrapOptionRecursively<T, U>(input: T, fallback: () => U): UnwrappedOption<T, U>;
export function unwrapOptionRecursively<T, U = null>(input: T, fallback?: () => U): UnwrappedOption<T, U> {
    // Types to bypass.
    if (!input || ArrayBuffer.isView(input)) {
        return input as UnwrappedOption<T, U>;
    }

    const next = <X>(x: X) =>
        (fallback ? unwrapOptionRecursively(x, fallback) : unwrapOptionRecursively(x)) as UnwrappedOption<X, U>;

    // Handle Option.
    if (isOption(input)) {
        if (isSome(input)) return next(input.value) as UnwrappedOption<T, U>;
        return (fallback ? fallback() : null) as UnwrappedOption<T, U>;
    }

    // Walk.
    if (Array.isArray(input)) {
        return input.map(next) as UnwrappedOption<T, U>;
    }
    if (typeof input === 'object') {
        return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, next(v)])) as UnwrappedOption<T, U>;
    }
    return input as UnwrappedOption<T, U>;
}
