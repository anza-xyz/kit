import type { Address } from '@solana/addresses';
import type { Commitment } from '@solana/rpc-types';
import { useEffect, useMemo, useRef } from 'react';

import { useAccountActions } from '../client/actions';
import { useSolanaActions, useSolanaState } from '../client/context';
import type { AccountCacheEntry, SolanaClientConfig } from '../client/types';
import { createWatchers } from '../client/watchers';

type AddressLike = Address | string;

type UseAccountOptions = Readonly<{
    commitment?: Commitment;
    fetch?: boolean;
    skip?: boolean;
    watch?: boolean;
}>;

function toAddress(addressLike: AddressLike): Address {
    return typeof addressLike === 'string' ? (addressLike as Address) : addressLike;
}

/**
 * Subscribe to the cached account state for a specific address and optionally trigger initial fetches
 * or live websocket updates.
 *
 * @param config - Solana client configuration provided to the surrounding provider.
 * @param addressLike - Address instance or base58 string identifying the account to observe.
 * @param options - Behaviour flags that control fetching, watching, and commitment overrides.
 * @returns The most recent cached account entry or `undefined` when no data is available.
 */
export function useAccount(
    config: SolanaClientConfig,
    addressLike?: AddressLike,
    options: UseAccountOptions = {},
): AccountCacheEntry | undefined {
    const state = useSolanaState();
    const { dispatch, getState, logger, runtime } = useSolanaActions();
    const { fetchAccount } = useAccountActions(config);
    const watchers = useMemo(
        () => createWatchers({ dispatch, getState, logger, runtime }),
        [dispatch, getState, logger, runtime],
    );
    const fetchAccountRef = useRef(fetchAccount);

    useEffect(() => {
        fetchAccountRef.current = fetchAccount;
    }, [fetchAccount]);

    const shouldSkip = options.skip ?? !addressLike;
    const address = useMemo(() => {
        if (shouldSkip || !addressLike) {
            return undefined;
        }
        return toAddress(addressLike);
    }, [addressLike, shouldSkip]);

    const accountKey = useMemo(() => address?.toString(), [address]);
    const account = accountKey ? state.accounts[accountKey] : undefined;

    useEffect(() => {
        if (!address) {
            return;
        }
        const commitment = options.commitment;
        if (options.fetch !== false) {
            void fetchAccountRef.current(address, commitment).catch(() => undefined);
        }
        if (options.watch) {
            const subscription = watchers.watchAccount({ address, commitment }, () => undefined);
            return () => {
                subscription.abort();
            };
        }
        return undefined;
    }, [address, watchers, options.commitment, options.fetch, options.watch]);

    return account;
}
