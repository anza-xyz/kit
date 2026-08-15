import {
    createRpcSubscriptionsApi,
    executeRpcPubSubSubscriptionPlan,
    RpcSubscriptionsApi,
    RpcSubscriptionsApiMethods,
} from '@solana/rpc-subscriptions-spec';
import {
    AllowedNumericKeypaths,
    getDefaultRequestTransformerForSolanaRpc,
    getDefaultResponseTransformerForSolanaRpcSubscriptions,
    innerInstructionsConfigs,
    jsonParsedAccountsConfigs,
    KEYPATH_WILDCARD,
    messageConfig,
    RequestTransformerConfig,
    tokenBalancesConfigs,
} from '@solana/rpc-transformers';

import { AccountNotificationsApi } from './account-notifications';
import { BlockNotificationsApi } from './block-notifications';
import { LogsNotificationsApi } from './logs-notifications';
import { ProgramNotificationsApi } from './program-notifications';
import { RootNotificationsApi } from './root-notifications';
import { SignatureNotificationsApi } from './signature-notifications';
import { SlotNotificationsApi } from './slot-notifications';
import { SlotsUpdatesNotificationsApi } from './slots-updates-notifications';
import { VoteNotificationsApi } from './vote-notifications';

export type SolanaRpcSubscriptionsApi = AccountNotificationsApi &
    LogsNotificationsApi &
    ProgramNotificationsApi &
    RootNotificationsApi &
    SignatureNotificationsApi &
    SlotNotificationsApi;
export type SolanaRpcSubscriptionsApiUnstable = BlockNotificationsApi &
    SlotsUpdatesNotificationsApi &
    VoteNotificationsApi;

export type {
    AccountNotificationsApi,
    BlockNotificationsApi,
    LogsNotificationsApi,
    ProgramNotificationsApi,
    RootNotificationsApi,
    SignatureNotificationsApi,
    SlotNotificationsApi,
    SlotsUpdatesNotificationsApi,
    VoteNotificationsApi,
};

type Config = RequestTransformerConfig;

function createSolanaRpcSubscriptionsApi_INTERNAL<TApi extends RpcSubscriptionsApiMethods>(
    config?: Config,
): RpcSubscriptionsApi<TApi> {
    const requestTransformer = getDefaultRequestTransformerForSolanaRpc(config);
    const responseTransformer = getDefaultResponseTransformerForSolanaRpcSubscriptions({
        allowedNumericKeyPaths: getAllowedNumericKeypaths(),
    });
    return createRpcSubscriptionsApi<TApi>({
        planExecutor({ request, ...rest }) {
            return executeRpcPubSubSubscriptionPlan({
                ...rest,
                responseTransformer,
                subscribeRequest: { ...request, methodName: request.methodName.replace(/Notifications$/, 'Subscribe') },
                unsubscribeMethodName: request.methodName.replace(/Notifications$/, 'Unsubscribe'),
            });
        },
        requestTransformer,
    });
}

export function createSolanaRpcSubscriptionsApi<TApi extends RpcSubscriptionsApiMethods = SolanaRpcSubscriptionsApi>(
    config?: Config,
): RpcSubscriptionsApi<TApi> {
    return createSolanaRpcSubscriptionsApi_INTERNAL<TApi>(config);
}

export function createSolanaRpcSubscriptionsApi_UNSTABLE(config?: Config) {
    return createSolanaRpcSubscriptionsApi_INTERNAL<SolanaRpcSubscriptionsApi & SolanaRpcSubscriptionsApiUnstable>(
        config,
    );
}

let memoizedKeypaths: AllowedNumericKeypaths<
    RpcSubscriptionsApi<SolanaRpcSubscriptionsApi & SolanaRpcSubscriptionsApiUnstable>
>;

/**
 * These are keypaths at the end of which you will find a numeric value that should *not* be upcast
 * to a `bigint`. These are values that are legitimately defined as `u8` or `usize` on the backend.
 */
function getAllowedNumericKeypaths(): AllowedNumericKeypaths<
    RpcSubscriptionsApi<SolanaRpcSubscriptionsApi & SolanaRpcSubscriptionsApiUnstable>
> {
    if (!memoizedKeypaths) {
        memoizedKeypaths = {
            accountNotifications: jsonParsedAccountsConfigs.map(c => ['value', ...c]),
            blockNotifications: [
                ...tokenBalancesConfigs.flatMap(c => [
                    [
                        'value',
                        'block',
                        'transactions',
                        KEYPATH_WILDCARD,
                        'meta',
                        'preTokenBalances',
                        KEYPATH_WILDCARD,
                        ...c,
                    ],
                    [
                        'value',
                        'block',
                        'transactions',
                        KEYPATH_WILDCARD,
                        'meta',
                        'postTokenBalances',
                        KEYPATH_WILDCARD,
                        ...c,
                    ],
                ]),
                ['value', 'block', 'transactions', KEYPATH_WILDCARD, 'meta', 'rewards', KEYPATH_WILDCARD, 'commission'],
                ...innerInstructionsConfigs.map(c => [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'meta',
                    'innerInstructions',
                    KEYPATH_WILDCARD,
                    ...c,
                ]),
                ...messageConfig.map(
                    c => ['value', 'block', 'transactions', KEYPATH_WILDCARD, 'transaction', 'message', ...c] as const,
                ),
                ['value', 'block', 'transactions', KEYPATH_WILDCARD, 'version'],
                ['value', 'block', 'rewards', KEYPATH_WILDCARD, 'commission'],
            ],
            programNotifications: jsonParsedAccountsConfigs.flatMap(c => [
                ['value', KEYPATH_WILDCARD, 'account', ...c],
                [KEYPATH_WILDCARD, 'account', ...c],
            ]),
        };
    }
    return memoizedKeypaths;
}
