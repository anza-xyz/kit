import type { createClient } from '@solana/kit';
import React from 'react';

import { ClientProvider } from '../ClientProvider';

/**
 * Builds a `renderHook`/`render` wrapper that mounts its children inside a {@link ClientProvider}
 * for the given client.
 *
 * Shared across the capability-hook tests (`useClientCapability`, `useRpc`, `useRpcSubscriptions`,
 * …) so each file doesn't redeclare the same one-line provider wrapper.
 *
 * @example
 * ```tsx
 * const client = createClient<ClientWithRpc>({ rpc });
 * const { result } = renderHook(() => useRpc(), { wrapper: createClientWrapper(client) });
 * ```
 */
export function createClientWrapper<T extends object>(client: ReturnType<typeof createClient<T>>) {
    return ({ children }: { children: React.ReactNode }) => <ClientProvider client={client}>{children}</ClientProvider>;
}
