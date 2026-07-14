import { type Client, SOLANA_ERROR__REACT__MISSING_PROVIDER, SolanaError } from '@solana/kit';
import React from 'react';

import { ClientContext } from './ClientProvider';

/**
 * Reads the Kit client published by the nearest {@link ClientProvider}. Throws a
 * {@link SolanaError} with code {@link SOLANA_ERROR__REACT__MISSING_PROVIDER} if no provider is
 * mounted in the ancestor tree.
 *
 * Pass the shape of your client through the generic (typically the `AppClient` type you export
 * alongside the client) so every installed capability is typed at the call site. This is a pure
 * cast with no runtime capability check, so reach for {@link useClientCapability} when a missing
 * plugin should fail loudly at mount instead of surfacing later as `undefined`.
 *
 * @typeParam TClient - The shape the client is expected to satisfy. Pure type assertion, so this
 *   must always be supplied — the hook can't infer it from its (absent) arguments.
 *
 * @example
 * ```tsx
 * import { ClientWithRpc, GetEpochInfoApi } from '@solana/kit';
 * import { useClient } from '@solana/react';
 *
 * function ManualSend() {
 *     const client = useClient<ClientWithRpc<GetEpochInfoApi>>();
 *     return <button onClick={() => client.rpc.getEpochInfo().send()}>Fetch</button>;
 * }
 * ```
 *
 * @see {@link ClientProvider}
 * @see {@link useClientCapability}
 */
export function useClient<TClient extends object>(): Client<TClient> {
    const client = React.useContext(ClientContext);
    if (client == null) {
        throw new SolanaError(SOLANA_ERROR__REACT__MISSING_PROVIDER, { hookName: 'useClient' });
    }
    return client as Client<TClient>;
}
