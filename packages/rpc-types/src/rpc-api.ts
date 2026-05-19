import type { Slot } from './typed-numbers';

export type SolanaRpcResponse<TValue> = Readonly<{
    context: Readonly<{ slot: Slot }>;
    value: TValue;
}>;

/**
 * Unwraps `SolanaRpcResponse<U>` → `U` at the type level so callers can surface
 * the inner value without losing static type information. Values that are not
 * wrapped in a `SolanaRpcResponse` envelope pass through unchanged.
 *
 * Pairs with {@link isSolanaRpcResponse} for runtime detection.
 *
 * @typeParam T - The raw notification shape.
 *
 * @example
 * ```ts
 * type AccountValue = UnwrapRpcResponse<SolanaRpcResponse<{ lamports: bigint }>>;
 * //   ^? { lamports: bigint }
 *
 * type AccountValue = UnwrapRpcResponse<{ lamports: bigint }>;
 * //   ^? { lamports: bigint }
 * ```
 */
export type UnwrapRpcResponse<T> = T extends SolanaRpcResponse<infer U> ? U : T;

/**
 * Type-guards a notification as a {@link SolanaRpcResponse} envelope. Validates the shape by
 * duck-typing for `context.slot: bigint` and the presence of `value`.
 *
 * The narrowed type is `SolanaRpcResponse<UnwrapRpcResponse<T>>`. In the false branch,
 * `notification` retains its original type.
 *
 * @typeParam T - The notification shape, which may be a raw value, an envelope, or a union of the two.
 * @param notification - The value to test.
 * @return `true` when `notification` is a `SolanaRpcResponse` envelope, narrowing accordingly.
 *
 * @example
 * ```ts
 * if (isSolanaRpcResponse(notification)) {
 *     return { slot: notification.context.slot, value: notification.value };
 * }
 * ```
 */
export function isSolanaRpcResponse<T>(
    notification: SolanaRpcResponse<UnwrapRpcResponse<T>> | T,
): notification is SolanaRpcResponse<UnwrapRpcResponse<T>> {
    return (
        notification != null &&
        typeof notification === 'object' &&
        'context' in notification &&
        notification.context != null &&
        typeof notification.context === 'object' &&
        'slot' in notification.context &&
        typeof notification.context.slot === 'bigint' &&
        'value' in notification
    );
}
