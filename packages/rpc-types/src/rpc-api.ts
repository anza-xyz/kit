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
 * Pairs with {@link splitSolanaRpcResponse} for runtime detection.
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
 * Decomposes a notification that may or may not be wrapped in a {@link SolanaRpcResponse}
 * envelope into its `value` and `slot` halves. Runtime-detects the envelope shape via duck-type
 * (`'context' in x && 'value' in x`); raw notifications without the envelope pass through with
 * `slot: undefined`.
 *
 * Accepts `T | undefined` so callers can pipe straight from `store.getUnifiedState().data`
 * without an external null-check.
 *
 * @typeParam T - The raw notification shape.
 * @param notification - The value to decompose, or `undefined` while the store hasn't yet
 *   produced one.
 * @return `{ value, slot }` where `value` is the unwrapped inner value (or the original
 *   notification when it doesn't match the envelope shape) and `slot` is lifted from
 *   `context.slot` (or `undefined` for raw notifications).
 *
 * @example
 * ```ts
 * splitSolanaRpcResponse({ context: { slot: 99n }, value: { lamports: 5n } });
 * // → { value: { lamports: 5n }, slot: 99n }
 *
 * splitSolanaRpcResponse({ slot: 10n, parent: 9n, root: 8n });
 * // → { value: { slot: 10n, parent: 9n, root: 8n }, slot: undefined }
 *
 * splitSolanaRpcResponse(undefined);
 * // → { value: undefined, slot: undefined }
 * ```
 */
export function splitSolanaRpcResponse<T>(notification: SolanaRpcResponse<T>): { slot: Slot; value: T };
export function splitSolanaRpcResponse<T>(notification: T extends SolanaRpcResponse<unknown> ? never : T): {
    slot: undefined;
    value: T;
};
// Generic case: a `T` that may be an envelope, a raw notification, a union of the two, or
// `T | undefined` (e.g. piped straight from `store.getUnifiedState().data`).
export function splitSolanaRpcResponse<T>(notification: T): {
    slot: Slot | undefined;
    value: UnwrapRpcResponse<T>;
};
export function splitSolanaRpcResponse<T>(notification: T | undefined): {
    slot: Slot | undefined;
    value: UnwrapRpcResponse<T> | undefined;
} {
    if (
        notification != null &&
        typeof notification === 'object' &&
        'context' in notification &&
        'value' in notification
    ) {
        const envelope = notification as SolanaRpcResponse<unknown>;
        return { slot: envelope.context.slot, value: envelope.value as UnwrapRpcResponse<T> };
    }
    return { slot: undefined, value: notification as UnwrapRpcResponse<T> | undefined };
}
