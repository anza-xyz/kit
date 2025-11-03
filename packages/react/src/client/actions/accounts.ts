import type { Address } from '@solana/addresses';
import type { Commitment, Lamports } from '@solana/rpc-types';
import { useCallback } from 'react';

import { useSolanaActions } from '../context';
import type { AccountCacheEntry, SolanaClientConfig } from '../types';
import { formatError, now } from '../utils';

export type AccountActions = {
    fetchAccount(address: Address, commitment?: Commitment): Promise<AccountCacheEntry>;
    fetchBalance(address: Address, commitment?: Commitment): Promise<Lamports>;
};

/**
 * Build account-oriented helper actions that interact with the reducer-managed cache.
 *
 * @param config - Solana client configuration provided to the surrounding provider.
 * @returns Helpers for fetching account info and lamport balances.
 */
export function useAccountActions(_config?: SolanaClientConfig): AccountActions {
    const { dispatch, getState, logger, runtime } = useSolanaActions();

    const getCommitment = useCallback(
        (commitment?: Commitment): Commitment => commitment ?? getState().cluster.commitment,
        [getState],
    );

    const fetchBalance = useCallback(
        async (address: Address, commitment?: Commitment): Promise<Lamports> => {
            const key = address.toString();
            const currentAccount = getState().accounts[key];
            dispatch({
                payload: {
                    address,
                    data: currentAccount?.data,
                    error: undefined,
                    fetching: true,
                    lamports: currentAccount?.lamports ?? null,
                    lastFetchedAt: now(),
                    slot: currentAccount?.slot ?? null,
                },
                type: 'UPDATE_ACCOUNT',
            });
            try {
                const response = await runtime.rpc
                    .getBalance(address, { commitment: getCommitment(commitment) })
                    .send({ abortSignal: AbortSignal.timeout(10_000) });
                const lamports = response.value;
                dispatch({
                    payload: {
                        address,
                        data: currentAccount?.data,
                        error: undefined,
                        fetching: false,
                        lamports,
                        lastFetchedAt: now(),
                        slot: response.context.slot,
                    },
                    type: 'UPDATE_ACCOUNT',
                });
                return lamports;
            } catch (error) {
                dispatch({
                    payload: {
                        address,
                        data: currentAccount?.data,
                        error,
                        fetching: false,
                        lamports: currentAccount?.lamports ?? null,
                        lastFetchedAt: now(),
                        slot: currentAccount?.slot ?? null,
                    },
                    type: 'UPDATE_ACCOUNT',
                });
                logger({
                    data: { address: key, ...formatError(error) },
                    level: 'error',
                    message: 'balance fetch failed',
                });
                throw error;
            }
        },
        [dispatch, getCommitment, getState, logger, runtime],
    );

    const fetchAccount = useCallback(
        async (address: Address, commitment?: Commitment): Promise<AccountCacheEntry> => {
            const key = address.toString();
            const currentAccount = getState().accounts[key];
            dispatch({
                payload: {
                    address,
                    data: currentAccount?.data,
                    error: undefined,
                    fetching: true,
                    lamports: currentAccount?.lamports ?? null,
                    lastFetchedAt: now(),
                    slot: currentAccount?.slot ?? null,
                },
                type: 'UPDATE_ACCOUNT',
            });
            try {
                const response = await runtime.rpc
                    .getAccountInfo(address, { commitment: getCommitment(commitment), encoding: 'base64' })
                    .send({ abortSignal: AbortSignal.timeout(10_000) });
                const value = response.value;
                const lamports = value?.lamports ?? null;
                const updatedAccount: AccountCacheEntry = {
                    address,
                    data: value,
                    error: undefined,
                    fetching: false,
                    lamports,
                    lastFetchedAt: now(),
                    slot: response.context.slot,
                };
                dispatch({
                    payload: updatedAccount,
                    type: 'UPDATE_ACCOUNT',
                });
                return updatedAccount;
            } catch (error) {
                const errorAccount: AccountCacheEntry = {
                    address,
                    data: currentAccount?.data,
                    error,
                    fetching: false,
                    lamports: currentAccount?.lamports ?? null,
                    lastFetchedAt: now(),
                    slot: currentAccount?.slot ?? null,
                };
                dispatch({
                    payload: errorAccount,
                    type: 'UPDATE_ACCOUNT',
                });
                logger({
                    data: { address: key, ...formatError(error) },
                    level: 'error',
                    message: 'account fetch failed',
                });
                throw error;
            }
        },
        [dispatch, getCommitment, getState, logger, runtime],
    );

    return { fetchAccount, fetchBalance };
}
