import { type SolanaRpcResponse, splitSolanaRpcResponse, type UnwrapRpcResponse } from '../rpc-api';
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

// [DESCRIBE] splitSolanaRpcResponse
{
    // Envelope: `value` is the unwrapped inner type, `slot` is `Slot`
    const envelopeResult = splitSolanaRpcResponse(null as unknown as SolanaRpcResponse<{ lamports: bigint }>);
    envelopeResult.value satisfies { lamports: bigint };
    envelopeResult.slot satisfies Slot;

    // Raw notification: `value` is the original type, `slot` is `undefined`
    const rawResult = splitSolanaRpcResponse(null as unknown as { lamports: bigint });
    rawResult.value satisfies { lamports: bigint };
    rawResult.slot satisfies undefined;

    // `undefined` input: both halves are `undefined`
    const undefinedResult = splitSolanaRpcResponse(undefined);
    undefinedResult.value satisfies undefined;
    undefinedResult.slot satisfies undefined;

    // `SolanaRpcResponse<T> | undefined` (e.g. piped from store state): both halves widen
    const maybeEnvelopeResult = splitSolanaRpcResponse(
        null as unknown as SolanaRpcResponse<{ lamports: bigint }> | undefined,
    );
    maybeEnvelopeResult.value satisfies { lamports: bigint } | undefined;
    maybeEnvelopeResult.slot satisfies Slot | undefined;

    // `SolanaRpcResponse<T> | T` (call site doesn't know which it has): `value` is `T`,
    // `slot` widens to `Slot | undefined` since the envelope arm produces a real slot at runtime.
    const mixedResult = splitSolanaRpcResponse(
        null as unknown as SolanaRpcResponse<{ lamports: bigint }> | { lamports: bigint },
    );
    mixedResult.value satisfies { lamports: bigint };
    mixedResult.slot satisfies Slot | undefined;
}
