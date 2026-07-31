import type { ClientWithIdentity, ClientWithSubscribeToIdentity, TransactionSigner } from '@solana/kit';
import { useCallback, useSyncExternalStore } from 'react';

const NOOP_UNSUBSCRIBE = () => {};

/**
 * Reads `client.identity` and re-renders whenever it changes, returning `undefined` while no
 * identity is available.
 *
 * The identity is the {@link TransactionSigner} representing the wallet whose on-chain assets the
 * application is acting upon.
 *
 * When the client advertises {@link ClientWithSubscribeToIdentity},
 * this hook subscribes via `client.subscribeToIdentity` so the returned value always reflects the
 * latest identity. For a client whose identity is fixed for its lifetime, the hook falls back to a
 * no-op subscription and simply reads the value once.
 *
 * @param client - A client with an identity plugin installed. If it also advertises
 *   `subscribeToIdentity`, the hook tracks changes reactively.
 * @returns The current `client.identity` signer, or `undefined` if no identity is currently
 *   available.
 *
 * @example
 * ```tsx
 * const identity = useIdentity(client);
 * return <span>{identity ? `Signed in as ${identity.address}` : 'Signed out'}</span>;
 * ```
 *
 * @see {@link usePayer}
 */
export function useIdentity(
    client: ClientWithIdentity & Partial<ClientWithSubscribeToIdentity>,
): TransactionSigner | undefined {
    const subscribe = useCallback(
        (onStoreChange: () => void) =>
            client.subscribeToIdentity ? client.subscribeToIdentity(onStoreChange) : NOOP_UNSUBSCRIBE,
        [client],
    );
    const getSnapshot = useCallback((): TransactionSigner | undefined => {
        try {
            return client.identity;
        } catch {
            return undefined;
        }
    }, [client]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
