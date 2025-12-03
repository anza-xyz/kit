import type { createSolanaRpcApi } from '@solana/rpc-api';

import { createSolanaJsonRpcIntegerOverflowError } from './rpc-integer-overflow-error';

/**
 * When you create {@link Rpc} instances with custom transports but otherwise the default RPC API
 * behaviours, use this.
 *
 * @example
 * ```ts
 * const myCustomRpc = createRpc({
 *     api: createSolanaRpcApi(DEFAULT_RPC_CONFIG),
 *     transport: myCustomTransport,
 * });
 * ```
 */
export const DEFAULT_RPC_CONFIG: Partial<NonNullable<Parameters<typeof createSolanaRpcApi>[0]>> = {
    defaultCommitment: 'confirmed',
    onIntegerOverflow(request, keyPath, value) {
        throw createSolanaJsonRpcIntegerOverflowError(request.methodName, keyPath, value);
    },
};
