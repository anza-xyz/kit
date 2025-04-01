/**
 * This package contains types that describe the [methods](https://solana.com/docs/rpc/websocket) of
 * the Solana JSON RPC Subscriptions API, and utilities for creating a
 * {@link RpcSubscriptionsApi} implementation with sensible defaults. It can be used standalone, but
 * it is also exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * Each RPC subscriptions method is described in terms of a TypeScript type of the following form:
 *
 * ```ts
 * type ExampleApi = {
 *     thingNotifications(address: Address): Thing;
 * };
 * ```
 *
 * A {@link RpcSubscriptionsApi} that implements `ExampleApi` will ultimately expose its defined
 * methods on any {@link RpcSubscriptions} that uses it.
 *
 * ```ts
 * const rpcSubscriptions: RpcSubscriptions<ExampleApi> = createExampleRpcSubscriptions(/* ... *\/);
 * const thingNotifications = await rpc
 *     .thingNotifications(address('95DpK3y3GF7U8s1k4EvZ7xqyeCkhsHeZaE97iZpHUGMN'))
 *     .subscribe({ abortSignal: AbortSignal.timeout(5_000) });
 * try {
 *     for await (const thing of thingNotifications) {
 *         console.log('Got a thing', thing);
 *     }
 * } catch (e) {
 *     console.error('Our subscription to `Thing` notifications has failed', e);
 * } finally {
 *     console.log('We are done listening for `Thing` notifications');
 * }
 * ```
 *
 * @packageDocumentation
 */

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
    jsonParsedAccountsConfigs,
    KEYPATH_WILDCARD,
    RequestTransformerConfig,
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

/** Represents the RPC Subscriptions methods available on all clusters. */
export type SolanaRpcSubscriptionsApi = AccountNotificationsApi &
    LogsNotificationsApi &
    ProgramNotificationsApi &
    RootNotificationsApi &
    SignatureNotificationsApi &
    SlotNotificationsApi;
/** Represents unstable RPC Subscriptions methods available on nodes that have enabled them. */
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

/**
 * Creates a {@link RpcSubscriptionsApi} implementation of the Solana JSON RPC API with some default
 * behaviours.
 *
 * The default behaviours include:
 * - A transform that converts `bigint` inputs to `number` for compatibility with version 1.0 of the
 *   Solana JSON RPC.
 * - A transform that calls the config's {@link Config.onIntegerOverflow | onIntegerOverflow}
 *   handler whenever a `bigint` input would overflow a JavaScript IEEE 754 number. See
 *   [this](https://github.com/solana-labs/solana-web3.js/issues/1116) GitHub issue for more
 *   information.
 * - A transform that applies a default commitment wherever not specified
 */
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
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'meta',
                    'preTokenBalances',
                    KEYPATH_WILDCARD,
                    'accountIndex',
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'meta',
                    'preTokenBalances',
                    KEYPATH_WILDCARD,
                    'uiTokenAmount',
                    'decimals',
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'meta',
                    'postTokenBalances',
                    KEYPATH_WILDCARD,
                    'accountIndex',
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'meta',
                    'postTokenBalances',
                    KEYPATH_WILDCARD,
                    'uiTokenAmount',
                    'decimals',
                ],
                ['value', 'block', 'transactions', KEYPATH_WILDCARD, 'meta', 'rewards', KEYPATH_WILDCARD, 'commission'],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'meta',
                    'innerInstructions',
                    KEYPATH_WILDCARD,
                    'index',
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'meta',
                    'innerInstructions',
                    KEYPATH_WILDCARD,
                    'instructions',
                    KEYPATH_WILDCARD,
                    'programIdIndex',
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'meta',
                    'innerInstructions',
                    KEYPATH_WILDCARD,
                    'instructions',
                    KEYPATH_WILDCARD,
                    'accounts',
                    KEYPATH_WILDCARD,
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'transaction',
                    'message',
                    'addressTableLookups',
                    KEYPATH_WILDCARD,
                    'writableIndexes',
                    KEYPATH_WILDCARD,
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'transaction',
                    'message',
                    'addressTableLookups',
                    KEYPATH_WILDCARD,
                    'readonlyIndexes',
                    KEYPATH_WILDCARD,
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'transaction',
                    'message',
                    'instructions',
                    KEYPATH_WILDCARD,
                    'programIdIndex',
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'transaction',
                    'message',
                    'instructions',
                    KEYPATH_WILDCARD,
                    'accounts',
                    KEYPATH_WILDCARD,
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'transaction',
                    'message',
                    'header',
                    'numReadonlySignedAccounts',
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'transaction',
                    'message',
                    'header',
                    'numReadonlyUnsignedAccounts',
                ],
                [
                    'value',
                    'block',
                    'transactions',
                    KEYPATH_WILDCARD,
                    'transaction',
                    'message',
                    'header',
                    'numRequiredSignatures',
                ],
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
