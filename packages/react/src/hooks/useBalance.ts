import type { Address } from '@solana/addresses';
import type { Commitment, Lamports } from '@solana/rpc-types';
import { useEffect, useMemo, useRef } from 'react';

import { useAccountActions } from '../client/actions';
import { useSolanaActions, useSolanaState } from '../client/context';
import type { AccountCacheEntry, SolanaClientConfig } from '../client/types';
import { createWatchers } from '../client/watchers';

type AddressLike = Address | string;

type UseBalanceOptions = Readonly<{
    commitment?: Commitment;
    fetch?: boolean;
    skip?: boolean;
    watch?: boolean;
}>;

function toAddress(addressLike: AddressLike): Address {
    return typeof addressLike === 'string' ? (addressLike as Address) : addressLike;
}

/**
 * Track the lamport balance for the provided address. The hook performs an eager RPC fetch by default
 * and can attach a websocket watcher to keep the cache in sync.
 *
 * @param config - Solana client configuration provided to the surrounding provider.
 * @param addressLike - Address instance or base58 string whose balance should be tracked.
 * @param options - Behaviour flags controlling fetching cadence, commitment, and subscription usage.
 * @returns Cached balance metadata including fetch status, lamports, and the backing account entry.
 */
export function useBalance(
    config: SolanaClientConfig,
    addressLike?: AddressLike,
    options: UseBalanceOptions = {},
): Readonly<{
    account?: AccountCacheEntry;
    error?: unknown;
    fetching: boolean;
    lamports: Lamports | null;
    slot: bigint | null | undefined;
}> {
    const state = useSolanaState();
    const { dispatch, getState, logger, runtime } = useSolanaActions();
    const { fetchBalance } = useAccountActions(config);
    const watchers = useMemo(
        () => createWatchers({ dispatch, getState, logger, runtime }),
        [dispatch, getState, logger, runtime],
    );
    const fetchBalanceRef = useRef(fetchBalance);

    useEffect(() => {
        fetchBalanceRef.current = fetchBalance;
    }, [fetchBalance]);

    const mergedOptions = useMemo(
        () => ({
            commitment: options.commitment,
            fetch: options.fetch ?? true,
            skip: options.skip,
            watch: options.watch ?? true,
        }),
        [options.commitment, options.fetch, options.skip, options.watch],
    );

    const shouldSkip = mergedOptions.skip ?? !addressLike;
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
        const commitment = mergedOptions.commitment;
        if (mergedOptions.fetch !== false) {
            void fetchBalanceRef.current(address, commitment).catch(() => undefined);
        }
        if (mergedOptions.watch) {
            const watcher = watchers.watchBalance({ address, commitment }, () => undefined);
            return () => {
                watcher.abort();
            };
        }
        return undefined;
    }, [address, watchers, mergedOptions.commitment, mergedOptions.fetch, mergedOptions.watch]);

    const lamports = account?.lamports ?? null;
    const fetching = account?.fetching ?? false;
    const slot = account?.slot;
    const error = account?.error;

    return useMemo(
        () => ({
            account,
            error,
            fetching,
            lamports,
            slot,
        }),
        [account, error, fetching, lamports, slot],
    );
}
