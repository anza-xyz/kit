import type { ClientWithRpc, Rpc, SolanaRpcApi } from '@solana/kit';

import { useClientCapability } from './useClientCapability';

/**
 * Reads the RPC client from the nearest {@link ClientProvider} and asserts at mount that the
 * `rpc` capability is installed.
 *
 * Wraps {@link useClientCapability}, so a client missing the RPC plugin fails loudly at mount with
 * a {@link SolanaError} of code {@link SOLANA_ERROR__REACT__MISSING_CAPABILITY} rather than
 * surfacing later as an `undefined` access. Returns the client's `rpc` object directly — its
 * identity is owned by the provided client, so it is stable for that client's lifetime and needs
 * no memoization.
 *
 * @typeParam TRpcMethods - The RPC method set the returned client exposes. Defaults to the full
 *   {@link SolanaRpcApi}; narrow it (e.g. to `SolanaRpcApiMainnet`) to match the client you built.
 *
 * @example
 * ```tsx
 * import { useRpc } from '@solana/react';
 *
 * function Balance({ address }) {
 *     const rpc = useRpc();
 *     // ...call rpc.getBalance(address).send() in an effect or with useRequest, etc.
 * }
 * ```
 *
 * @see {@link useRpcSubscriptions}
 * @see {@link useClientCapability}
 */
export function useRpc<TRpcMethods = SolanaRpcApi>(): Rpc<TRpcMethods> {
    const client = useClientCapability<ClientWithRpc<TRpcMethods>>({
        capability: 'rpc',
        hookName: 'useRpc',
        providerHint: 'Install `solanaRpc()` on the client.',
    });
    return client.rpc;
}
