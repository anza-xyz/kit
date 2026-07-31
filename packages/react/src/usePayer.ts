import type { ClientWithPayer, ClientWithSubscribeToPayer, TransactionSigner } from '@solana/kit';
import { useCallback, useSyncExternalStore } from 'react';

const NOOP_UNSUBSCRIBE = () => {};

/**
 * Reads `client.payer` and re-renders whenever it changes, returning `undefined` while no payer is
 * available.
 *
 * The payer is the {@link TransactionSigner} a client uses to sign and pay for transactions by
 * default.
 *
 * When the client advertises {@link ClientWithSubscribeToPayer}, this hook subscribes via
 * `client.subscribeToPayer` so the returned value always reflects the latest payer. For a client
 * whose payer is fixed for its lifetime, the hook falls back to a no-op subscription and simply
 * reads the value once.
 *
 * @param client - A client with a payer plugin installed. If it also advertises
 *   `subscribeToPayer`, the hook tracks changes reactively.
 * @returns The current `client.payer` signer, or `undefined` if no payer is currently available.
 *
 * @example
 * ```tsx
 * const payer = usePayer(client);
 * return <span>{payer ? `Paying with ${payer.address}` : 'No payer'}</span>;
 * ```
 *
 * @see {@link useIdentity}
 */
export function usePayer(client: ClientWithPayer & Partial<ClientWithSubscribeToPayer>): TransactionSigner | undefined {
    const subscribe = useCallback(
        (onStoreChange: () => void) =>
            client.subscribeToPayer ? client.subscribeToPayer(onStoreChange) : NOOP_UNSUBSCRIBE,
        [client],
    );
    const getSnapshot = useCallback((): TransactionSigner | undefined => {
        try {
            return client.payer;
        } catch {
            return undefined;
        }
    }, [client]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
