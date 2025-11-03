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

function isSolanaClientConfig(value: unknown): value is SolanaClientConfig {
    return typeof value === 'object' && value !== null && 'endpoint' in value;
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
export function useAccount(addressLike?: AddressLike, options?: UseAccountOptions): AccountCacheEntry | undefined;
export function useAccount(
    config: SolanaClientConfig,
    addressLike?: AddressLike,
    options?: UseAccountOptions,
): AccountCacheEntry | undefined;
export function useAccount(
    configOrAddress?: SolanaClientConfig | AddressLike,
    addressLikeOrOptions?: AddressLike | UseAccountOptions,
    maybeOptions: UseAccountOptions = {},
): AccountCacheEntry | undefined {
    let config: SolanaClientConfig | undefined;
    let accountAddressLike: AddressLike | undefined;
    let options: UseAccountOptions | undefined;

    if (isSolanaClientConfig(configOrAddress)) {
        config = configOrAddress;
        accountAddressLike = addressLikeOrOptions as AddressLike | undefined;
        options = maybeOptions;
    } else {
        accountAddressLike = configOrAddress as AddressLike | undefined;
        options = addressLikeOrOptions as UseAccountOptions | undefined;
    }

    const resolvedOptions = options ?? {};
    const state = useSolanaState();
    const { config: contextConfig, dispatch, getState, logger, runtime } = useSolanaActions();
    const { fetchAccount } = useAccountActions(config ?? contextConfig);
    const watchers = useMemo(
        () => createWatchers({ dispatch, getState, logger, runtime }),
        [dispatch, getState, logger, runtime],
    );
    const fetchAccountRef = useRef(fetchAccount);

    useEffect(() => {
        fetchAccountRef.current = fetchAccount;
    }, [fetchAccount]);

    const shouldSkip = resolvedOptions.skip ?? !accountAddressLike;
    const address = useMemo(() => {
        if (shouldSkip || !accountAddressLike) {
            return undefined;
        }
        return toAddress(accountAddressLike);
    }, [accountAddressLike, shouldSkip]);

    const accountKey = useMemo(() => address?.toString(), [address]);
    const account = accountKey ? state.accounts[accountKey] : undefined;

    useEffect(() => {
        if (!address) {
            return;
        }
        const commitment = resolvedOptions.commitment;
        if (resolvedOptions.fetch !== false) {
            void fetchAccountRef.current(address, commitment).catch(() => undefined);
        }
        if (resolvedOptions.watch) {
            const subscription = watchers.watchAccount({ address, commitment }, () => undefined);
            return () => {
                subscription.abort();
            };
        }
        return undefined;
    }, [address, watchers, resolvedOptions.commitment, resolvedOptions.fetch, resolvedOptions.watch]);

    return account;
}
