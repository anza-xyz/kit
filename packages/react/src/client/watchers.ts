import type { Lamports } from '@solana/rpc-types';

import type { ClientAction } from './reducer';
import type {
    AccountCacheEntry,
    AccountWatcherConfig,
    BalanceWatcherConfig,
    ClientLogger,
    ClientState,
    SolanaClientRuntime,
    SubscriptionStatus,
    WatchSubscription,
} from './types';
import { formatError, now } from './utils';

type SubscriptionKind = 'account';

type ClientWatchers = {
    watchAccount(config: AccountWatcherConfig, listener: (account: AccountCacheEntry) => void): WatchSubscription;
    watchBalance(config: BalanceWatcherConfig, listener: (lamports: Lamports) => void): WatchSubscription;
};

type WatcherDeps = Readonly<{
    dispatch: (action: ClientAction) => void;
    getState: () => ClientState;
    logger: ClientLogger;
    runtime: SolanaClientRuntime;
}>;

/**
 * Create watchers for account and balance subscriptions backed by RPC websocket notifications.
 *
 * @param deps - Dependencies extracted from the Solana client context.
 * @param deps.dispatch - Dispatcher used to update reducer-managed state.
 * @param deps.getState - Function that retrieves the latest immutable client state snapshot.
 * @param deps.logger - Logger invoked when subscription errors occur.
 * @param deps.runtime - Runtime RPC clients used to issue subscription requests.
 * @returns An object exposing helpers to watch accounts and balances.
 */
export function createWatchers({ dispatch, getState, logger, runtime }: WatcherDeps): ClientWatchers {

    function setSubscriptionStatus(kind: SubscriptionKind, id: string, status: SubscriptionStatus): void {
        const current = getState();
        const nextSubscriptions = {
            ...current.subscriptions,
            [kind]: {
                ...current.subscriptions[kind],
                [id]: status,
            },
        } as typeof current.subscriptions;
        dispatch({
            payload: {
                subscriptions: nextSubscriptions,
            },
            type: 'UPDATE_STATE',
        });
    }

    function onAbort(kind: SubscriptionKind, id: string): void {
        setSubscriptionStatus(kind, id, { status: 'inactive' });
    }

    function createSubscriptionHandle(kind: SubscriptionKind, id: string, abortController: AbortController): WatchSubscription {
        function abort(): void {
            abortController.abort();
            onAbort(kind, id);
        }

        return { abort };
    }

    async function handleAccountNotifications(
        config: AccountWatcherConfig,
        listener: (account: AccountCacheEntry) => void,
        abortController: AbortController,
    ): Promise<void> {
        const commitment = config.commitment ?? getState().cluster.commitment;
        const plan = runtime.rpcSubscriptions.accountNotifications(config.address, { commitment });
        const key = config.address.toString();
        setSubscriptionStatus('account', key, { status: 'activating' });
        abortController.signal.addEventListener('abort', () => onAbort('account', key));
        try {
            const iterator = await plan.subscribe({ abortSignal: abortController.signal });
            setSubscriptionStatus('account', key, { status: 'active' });
            for await (const notification of iterator) {
                const lamports = notification.value?.lamports ?? null;
                const slot = (notification.context?.slot ?? null) as bigint | null;
                const previous = getState().accounts[key];
                if (
                    previous &&
                    previous.error === undefined &&
                    previous.fetching === false &&
                    previous.lamports === lamports &&
                    previous.slot === slot
                ) {
                    continue;
                }
                const entry: AccountCacheEntry = {
                    address: config.address,
                    data: notification.value?.data,
                    error: undefined,
                    fetching: false,
                    lamports,
                    lastFetchedAt: now(),
                    slot,
                };
                listener(entry);
                dispatch({
                    payload: entry,
                    type: 'UPDATE_ACCOUNT',
                });
            }
        } catch (error) {
            if (!abortController.signal.aborted) {
                logger({
                    data: { address: key, ...formatError(error) },
                    level: 'error',
                    message: 'account subscription failed',
                });
                setSubscriptionStatus('account', key, { error, status: 'error' });
            }
        }
    }

    function watchAccount(config: AccountWatcherConfig, listener: (account: AccountCacheEntry) => void): WatchSubscription {
        const abortController = new AbortController();
        handleAccountNotifications(config, listener, abortController).catch(error => {
            if (!abortController.signal.aborted) {
                logger({
                    data: { address: config.address.toString(), ...formatError(error) },
                    level: 'error',
                    message: 'account watcher error',
                });
            }
        });
        return createSubscriptionHandle('account', config.address.toString(), abortController);
    }

    function watchBalance(config: BalanceWatcherConfig, listener: (lamports: Lamports) => void): WatchSubscription {
        return watchAccount(config, account => {
            if (account.lamports !== null) {
                listener(account.lamports);
            }
        });
    }

    return {
        watchAccount,
        watchBalance,
    };
}
