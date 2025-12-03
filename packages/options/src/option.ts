/**
 * An implementation of the Rust `Option<T>` type in JavaScript.
 *
 * In Rust, optional values are represented using `Option<T>`, which can be either:
 * - `Some(T)`, indicating a present value.
 * - `None`, indicating the absence of a value.
 *
 * In JavaScript, this is typically represented as `T | null`. However, this approach fails with nested options.
 * For example, `Option<Option<T>>` in Rust would translate to `T | null | null` in JavaScript, which is equivalent to `T | null`.
 * This means there is no way to differentiate between `Some(None)` and `None`, making nested options impossible.
 *
 * This `Option` type helps solve this by mirroring Rust’s `Option<T>` type.
 *
 * ```ts
 * type Option<T> = Some<T> | None;
 * type Some<T> = { __option: 'Some'; value: T };
 * type None = { __option: 'None' };
 * ```
 *
 * @typeParam T - The type of the contained value.
 *
 * @example
 * Here's how you can create `Option` values.
 *
 * To improve developer experience, helper functions are available.
 * TypeScript can infer the type of `T` or it can be explicitly provided.
 *
 * ```ts
 * // Create an option with a value.
 * some('Hello World');
 * some<number | string>(123);
 *
 * // Create an empty option.
 * none();
 * none<number | string>();
 * ```
 *
 * @see {@link Some}
 * @see {@link None}
 * @see {@link some}
 * @see {@link none}
 */
export type Option<T> = None | Some<T>;

/**
 * A flexible type that allows working with {@link Option} values or nullable values.
 *
 * It defines a looser type that can be used when encoding {@link Option | Options}.
 * This allows us to pass `null` or the nested value directly whilst still
 * supporting the Option type for use-cases that need more type safety.
 *
 * @typeParam T - The type of the contained value.
 *
 * @example
 * Accepting both `Option<T>` and `T | null` as input.
 * ```ts
 * function double(value: OptionOrNullable<number>) {
 *   const option = isOption(value) ? value : wrapNullable(value);
 *   return isSome(option) ? option.value * 2 : 'No value';
 * }
 *
 * double(42);       // 84
 * double(some(21)); // 42
 * double(none());   // "No value"
 * double(null);     // "No value"
 * ```
 *
 * @see {@link Option}
 * @see {@link isOption}
 * @see {@link wrapNullable}
 */
export type OptionOrNullable<T> = Option<T> | T | null;

/**
 * Represents an {@link Option} that contains a value.
 *
 * This type mirrors Rust’s `Some(T)`, indicating that a value is present.
 *
 * For more details, see {@link Option}.
 *
 * @typeParam T - The type of the contained value.
 *
 * @example
 * Creating a `Some` value.
 * ```ts
 * const value = some(42);
 * isSome(value); // true
 * isNone(value); // false
 * ```
 *
 * @see {@link Option}
 * @see {@link some}
 * @see {@link isSome}
 */
export type Some<T> = Readonly<{ __option: 'Some'; value: T }>;

/**
 * Represents an {@link Option} that contains no value.
 *
 * This type mirrors Rust’s `None`, indicating the absence of a value.
 *
 * For more details, see {@link Option}.
 *
 * @example
 * Creating a `None` value.
 * ```ts
 * const empty = none();
 * isNone(empty); // true
 * isSome(empty); // false
 * ```
 *
 * @see {@link Option}
 * @see {@link none}
 * @see {@link isNone}
 */
export type None = Readonly<{ __option: 'None' }>;

/**
 * Creates a new {@link Option} that contains a value.
 *
 * This function explicitly wraps a value in an {@link Option} type.
 *
 * @typeParam T - The type of the contained value.
 *
 * @param value - The value to wrap in an {@link Option}.
 * @returns An {@link Option} containing the provided value.
 *
 * @example
 * Wrapping a value in an `Option`.
 * ```ts
 * const option = some('Hello');
 * option.value;     // "Hello"
 * isOption(option); // true
 * isSome(option);   // true
 * isNone(option);   // false
 * ```
 *
 * @see {@link Option}
 * @see {@link Some}
 */
export const some = <T>(value: T): Option<T> => ({ __option: 'Some', value });

/**
 * Creates a new {@link Option} that contains no value.
 *
 * This function explicitly represents an absent value.
 *
 * @typeParam T - The type of the expected absent value.
 *
 * @returns An {@link Option} containing no value.
 *
 * @example
 * Creating an empty `Option`.
 * ```ts
 * const empty = none<number>();
 * isOption(empty); // true
 * isSome(empty);   // false
 * isNone(empty);   // true
 * ```
 *
 * @see {@link Option}
 * @see {@link None}
 */
export const none = <T>(): Option<T> => ({ __option: 'None' });

/**
 * Checks whether the given value is an {@link Option}.
 *
 * This function determines whether an input follows the `Option<T>` structure.
 *
 * @typeParam T - The type of the contained value.
 *
 * @param input - The value to check.
 * @returns `true` if the value is an {@link Option}, `false` otherwise.
 *
 * @example
 * Checking for `Option` values.
 * ```ts
 * isOption(some(42));        // true
 * isOption(none());          // true
 * isOption(42);              // false
 * isOption(null);            // false
 * isOption("anything else"); // false
 * ```
 *
 * @see {@link Option}
 */
export const isOption = <T = unknown>(input: unknown): input is Option<T> =>
    !!(
        input &&
        typeof input === 'object' &&
        '__option' in input &&
        ((input.__option === 'Some' && 'value' in input) || input.__option === 'None')
    );

/**
 * Checks whether the given {@link Option} contains a value.
 *
 * This function acts as a type guard, ensuring the value is a {@link Some}.
 *
 * @typeParam T - The type of the contained value.
 *
 * @param option - The {@link Option} to check.
 * @returns `true` if the option is a {@link Some}, `false` otherwise.
 *
 * @example
 * Checking for `Some` values.
 * ```ts
 * isSome(some(42)); // true
 * isSome(none());   // false
 * ```
 *
 * @see {@link Option}
 * @see {@link Some}
 */
export const isSome = <T>(option: Option<T>): option is Some<T> => option.__option === 'Some';

/**
 * Checks whether the given {@link Option} contains no value.
 *
 * This function acts as a type guard, ensuring the value is a {@link None}.
 *
 * @typeParam T - The type of the expected value.
 *
 * @param option - The {@link Option} to check.
 * @returns `true` if the option is a {@link None}, `false` otherwise.
 *
 * @example
 * Checking for `None` values.
 * ```ts
 * isNone(some(42)); // false
 * isNone(none());   // true
 * ```
 *
 * @see {@link Option}
 * @see {@link None}
 */
export const isNone = <T>(option: Option<T>): option is None => option.__option === 'None';
