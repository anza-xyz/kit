import { isSolanaRpcResponse, type SolanaRpcResponse, type UnwrapRpcResponse } from '../rpc-api';
import type { Slot } from '../typed-numbers';

// [DESCRIBE] UnwrapRpcResponse
{
    // Unwraps `SolanaRpcResponse<U>` to `U`
    null as unknown as UnwrapRpcResponse<SolanaRpcResponse<{ lamports: bigint }>> satisfies { lamports: bigint };

    // Non-envelope types pass through unchanged
    null as unknown as UnwrapRpcResponse<{ lamports: bigint }> satisfies { lamports: bigint };
    null as unknown as UnwrapRpcResponse<number> satisfies number;
    null as unknown as UnwrapRpcResponse<string> satisfies string;
}

// [DESCRIBE] isSolanaRpcResponse
{
    // Narrows an envelope-typed value to the same envelope shape.
    const envelope = null as unknown as SolanaRpcResponse<{ lamports: bigint }>;
    if (isSolanaRpcResponse(envelope)) {
        envelope.context.slot satisfies Slot;
        envelope.value satisfies { lamports: bigint };
    }

    // For a raw notification, the true-branch narrows to `SolanaRpcResponse<RawValue>`.
    // (Reaching the true branch on a raw value is impossible at runtime — the guard
    // validates the envelope shape — so the imprecision is benign.)
    const raw = null as unknown as { parent: bigint; slot: bigint };
    if (isSolanaRpcResponse(raw)) {
        raw.context.slot satisfies Slot;
        raw.value satisfies { parent: bigint; slot: bigint };
    }

    // For a union of envelope and raw, the true branch narrows to an envelope wrapping
    // either inner type.
    const mixed = null as unknown as SolanaRpcResponse<{ lamports: bigint }> | { lamports: bigint };
    if (isSolanaRpcResponse(mixed)) {
        mixed.context.slot satisfies Slot;
        mixed.value satisfies { lamports: bigint };
    } else {
        mixed satisfies { lamports: bigint };
    }

    // `unknown` input narrows to `SolanaRpcResponse<unknown>` in the true branch.
    const u = null as unknown;
    if (isSolanaRpcResponse(u)) {
        u.context.slot satisfies Slot;
        u.value satisfies unknown;
    }

    // Generic-T call-site: the narrowing must work when invoked from inside a generic function
    // with a parameter typed as `T | undefined`. This mirrors how `useSubscription` consumes
    // the guard against a `ReactiveStreamStore`'s current value.
    function generic<T>(value: T | undefined): { slot: Slot | undefined; value: UnwrapRpcResponse<T> | undefined } {
        if (isSolanaRpcResponse(value)) {
            return { slot: value.context.slot, value: value.value };
        }
        return { slot: undefined, value: value as UnwrapRpcResponse<T> | undefined };
    }
    void generic;
}
