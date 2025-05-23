/**
 * This package contains types that describe the [methods](https://solana.com/docs/rpc/http) of the
 * Solana JSON RPC API, and utilities for creating a {@link RpcApi} implementation with sensible
 * defaults. It can be used standalone, but it is also exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * @example
 * Each RPC method is described in terms of a TypeScript type of the following form:
 *
 * ```ts
 * type ExampleApi = {
 *     getSomething(address: Address): Something;
 * };
 * ```
 *
 * A {@link RpcApi} that implements `ExampleApi` will ultimately expose its defined methods on any
 * {@link Rpc} that uses it.
 *
 * ```ts
 * const rpc: Rpc<ExampleApi> = createExampleRpc(/* ... *\/);
 * const something: Something = await rpc.getSomething(address('95DpK3y3GF7U8s1k4EvZ7xqyeCkhsHeZaE97iZpHUGMN')).send();
 * ```
 *
 * @packageDocumentation
 */
import { createJsonRpcApi, RpcApi } from '@solana/rpc-spec';
import {
    AllowedNumericKeypaths,
    getDefaultRequestTransformerForSolanaRpc,
    getDefaultResponseTransformerForSolanaRpc,
    innerInstructionsConfigs,
    jsonParsedAccountsConfigs,
    jsonParsedTokenAccountsConfigs,
    KEYPATH_WILDCARD,
    messageConfig,
    RequestTransformerConfig,
} from '@solana/rpc-transformers';

import { GetAccountInfoApi } from './getAccountInfo';
import { GetBalanceApi } from './getBalance';
import { GetBlockApi } from './getBlock';
import { GetBlockCommitmentApi } from './getBlockCommitment';
import { GetBlockHeightApi } from './getBlockHeight';
import { GetBlockProductionApi } from './getBlockProduction';
import { GetBlocksApi } from './getBlocks';
import { GetBlocksWithLimitApi } from './getBlocksWithLimit';
import { GetBlockTimeApi } from './getBlockTime';
import { GetClusterNodesApi } from './getClusterNodes';
import { GetEpochInfoApi } from './getEpochInfo';
import { GetEpochScheduleApi } from './getEpochSchedule';
import { GetFeeForMessageApi } from './getFeeForMessage';
import { GetFirstAvailableBlockApi } from './getFirstAvailableBlock';
import { GetGenesisHashApi } from './getGenesisHash';
import { GetHealthApi } from './getHealth';
import { GetHighestSnapshotSlotApi } from './getHighestSnapshotSlot';
import { GetIdentityApi } from './getIdentity';
import { GetInflationGovernorApi } from './getInflationGovernor';
import { GetInflationRateApi } from './getInflationRate';
import { GetInflationRewardApi } from './getInflationReward';
import { GetLargestAccountsApi } from './getLargestAccounts';
import { GetLatestBlockhashApi } from './getLatestBlockhash';
import { GetLeaderScheduleApi } from './getLeaderSchedule';
import { GetMaxRetransmitSlotApi } from './getMaxRetransmitSlot';
import { GetMaxShredInsertSlotApi } from './getMaxShredInsertSlot';
import { GetMinimumBalanceForRentExemptionApi } from './getMinimumBalanceForRentExemption';
import { GetMultipleAccountsApi } from './getMultipleAccounts';
import { GetProgramAccountsApi } from './getProgramAccounts';
import { GetRecentPerformanceSamplesApi } from './getRecentPerformanceSamples';
import { GetRecentPrioritizationFeesApi } from './getRecentPrioritizationFees';
import { GetSignaturesForAddressApi } from './getSignaturesForAddress';
import { GetSignatureStatusesApi } from './getSignatureStatuses';
import { GetSlotApi } from './getSlot';
import { GetSlotLeaderApi } from './getSlotLeader';
import { GetSlotLeadersApi } from './getSlotLeaders';
import { GetStakeMinimumDelegationApi } from './getStakeMinimumDelegation';
import { GetSupplyApi } from './getSupply';
import { GetTokenAccountBalanceApi } from './getTokenAccountBalance';
import { GetTokenAccountsByDelegateApi } from './getTokenAccountsByDelegate';
import { GetTokenAccountsByOwnerApi } from './getTokenAccountsByOwner';
import { GetTokenLargestAccountsApi } from './getTokenLargestAccounts';
import { GetTokenSupplyApi } from './getTokenSupply';
import { GetTransactionApi } from './getTransaction';
import { GetTransactionCountApi } from './getTransactionCount';
import { GetVersionApi } from './getVersion';
import { GetVoteAccountsApi } from './getVoteAccounts';
import { IsBlockhashValidApi } from './isBlockhashValid';
import { MinimumLedgerSlotApi } from './minimumLedgerSlot';
import { RequestAirdropApi } from './requestAirdrop';
import { SendTransactionApi } from './sendTransaction';
import { SimulateTransactionApi } from './simulateTransaction';

type SolanaRpcApiForAllClusters = GetAccountInfoApi &
    GetBalanceApi &
    GetBlockApi &
    GetBlockCommitmentApi &
    GetBlockHeightApi &
    GetBlockProductionApi &
    GetBlocksApi &
    GetBlocksWithLimitApi &
    GetBlockTimeApi &
    GetClusterNodesApi &
    GetEpochInfoApi &
    GetEpochScheduleApi &
    GetFeeForMessageApi &
    GetFirstAvailableBlockApi &
    GetGenesisHashApi &
    GetHealthApi &
    GetHighestSnapshotSlotApi &
    GetIdentityApi &
    GetInflationGovernorApi &
    GetInflationRateApi &
    GetInflationRewardApi &
    GetLargestAccountsApi &
    GetLatestBlockhashApi &
    GetLeaderScheduleApi &
    GetMaxRetransmitSlotApi &
    GetMaxShredInsertSlotApi &
    GetMinimumBalanceForRentExemptionApi &
    GetMultipleAccountsApi &
    GetProgramAccountsApi &
    GetRecentPerformanceSamplesApi &
    GetRecentPrioritizationFeesApi &
    GetSignaturesForAddressApi &
    GetSignatureStatusesApi &
    GetSlotApi &
    GetSlotLeaderApi &
    GetSlotLeadersApi &
    GetStakeMinimumDelegationApi &
    GetSupplyApi &
    GetTokenAccountBalanceApi &
    GetTokenAccountsByDelegateApi &
    GetTokenAccountsByOwnerApi &
    GetTokenLargestAccountsApi &
    GetTokenSupplyApi &
    GetTransactionApi &
    GetTransactionCountApi &
    GetVersionApi &
    GetVoteAccountsApi &
    IsBlockhashValidApi &
    MinimumLedgerSlotApi &
    SendTransactionApi &
    SimulateTransactionApi;
type SolanaRpcApiForTestClusters = RequestAirdropApi & SolanaRpcApiForAllClusters;
/**
 * Represents the RPC methods available on test clusters.
 *
 * For instance, the test clusters support the {@link RequestAirdropApi} while mainnet does not.
 */
export type SolanaRpcApi = SolanaRpcApiForTestClusters;
/**
 * Represents the RPC methods available on the devnet cluster.
 *
 * For instance, the devnet cluster supports the {@link RequestAirdropApi} while mainnet does not.
 */
export type SolanaRpcApiDevnet = SolanaRpcApiForTestClusters;
/**
 * Represents the RPC methods available on the testnet cluster.
 *
 * For instance, the testnet cluster supports the {@link RequestAirdropApi} while mainnet does not.
 */
export type SolanaRpcApiTestnet = SolanaRpcApiForTestClusters;
/**
 * Represents the RPC methods available on the mainnet cluster.
 *
 * For instance, the mainnet cluster does not support the {@link RequestAirdropApi} whereas test
 * clusters do.
 */
export type SolanaRpcApiMainnet = SolanaRpcApiForAllClusters;

export type {
    GetAccountInfoApi,
    GetBalanceApi,
    GetBlockApi,
    GetBlockCommitmentApi,
    GetBlockHeightApi,
    GetBlockProductionApi,
    GetBlocksApi,
    GetBlocksWithLimitApi,
    GetBlockTimeApi,
    GetClusterNodesApi,
    GetEpochInfoApi,
    GetEpochScheduleApi,
    GetFeeForMessageApi,
    GetFirstAvailableBlockApi,
    GetGenesisHashApi,
    GetHealthApi,
    GetHighestSnapshotSlotApi,
    GetIdentityApi,
    GetInflationGovernorApi,
    GetInflationRateApi,
    GetInflationRewardApi,
    GetLargestAccountsApi,
    GetLatestBlockhashApi,
    GetLeaderScheduleApi,
    GetMaxRetransmitSlotApi,
    GetMaxShredInsertSlotApi,
    GetMinimumBalanceForRentExemptionApi,
    GetMultipleAccountsApi,
    GetProgramAccountsApi,
    GetRecentPerformanceSamplesApi,
    GetRecentPrioritizationFeesApi,
    GetSignaturesForAddressApi,
    GetSignatureStatusesApi,
    GetSlotApi,
    GetSlotLeaderApi,
    GetSlotLeadersApi,
    GetStakeMinimumDelegationApi,
    GetSupplyApi,
    GetTokenAccountBalanceApi,
    GetTokenAccountsByDelegateApi,
    GetTokenAccountsByOwnerApi,
    GetTokenLargestAccountsApi,
    GetTokenSupplyApi,
    GetTransactionApi,
    GetTransactionCountApi,
    GetVersionApi,
    GetVoteAccountsApi,
    IsBlockhashValidApi,
    MinimumLedgerSlotApi,
    RequestAirdropApi,
    SendTransactionApi,
    SimulateTransactionApi,
};

type Config = RequestTransformerConfig;

/**
 * Creates a {@link RpcApi} implementation of the Solana JSON RPC API with some default behaviours.
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
export function createSolanaRpcApi<
    // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
    TRpcMethods extends SolanaRpcApi | SolanaRpcApiDevnet | SolanaRpcApiMainnet | SolanaRpcApiTestnet = SolanaRpcApi,
>(config?: Config): RpcApi<TRpcMethods> {
    return createJsonRpcApi<TRpcMethods>({
        requestTransformer: getDefaultRequestTransformerForSolanaRpc(config),
        responseTransformer: getDefaultResponseTransformerForSolanaRpc({
            allowedNumericKeyPaths: getAllowedNumericKeypaths(),
        }),
    });
}

let memoizedKeypaths: AllowedNumericKeypaths<RpcApi<SolanaRpcApi>>;

/**
 * These are keypaths at the end of which you will find a numeric value that should *not* be upcast
 * to a `bigint`. These are values that are legitimately defined as `u8` or `usize` on the backend.
 */
function getAllowedNumericKeypaths(): AllowedNumericKeypaths<RpcApi<SolanaRpcApi>> {
    if (!memoizedKeypaths) {
        memoizedKeypaths = {
            getAccountInfo: jsonParsedAccountsConfigs.map(c => ['value', ...c]),
            getBlock: [
                ['transactions', KEYPATH_WILDCARD, 'meta', 'preTokenBalances', KEYPATH_WILDCARD, 'accountIndex'],
                [
                    'transactions',
                    KEYPATH_WILDCARD,
                    'meta',
                    'preTokenBalances',
                    KEYPATH_WILDCARD,
                    'uiTokenAmount',
                    'decimals',
                ],
                ['transactions', KEYPATH_WILDCARD, 'meta', 'postTokenBalances', KEYPATH_WILDCARD, 'accountIndex'],
                [
                    'transactions',
                    KEYPATH_WILDCARD,
                    'meta',
                    'postTokenBalances',
                    KEYPATH_WILDCARD,
                    'uiTokenAmount',
                    'decimals',
                ],
                ['transactions', KEYPATH_WILDCARD, 'meta', 'rewards', KEYPATH_WILDCARD, 'commission'],
                ...innerInstructionsConfigs.map(c => [
                    'transactions',
                    KEYPATH_WILDCARD,
                    'meta',
                    'innerInstructions',
                    KEYPATH_WILDCARD,
                    ...c,
                ]),
                ...messageConfig.map(c => ['transactions', KEYPATH_WILDCARD, 'transaction', 'message', ...c] as const),
                ['rewards', KEYPATH_WILDCARD, 'commission'],
            ],
            getClusterNodes: [
                [KEYPATH_WILDCARD, 'featureSet'],
                [KEYPATH_WILDCARD, 'shredVersion'],
            ],
            getInflationGovernor: [['initial'], ['foundation'], ['foundationTerm'], ['taper'], ['terminal']],
            getInflationRate: [['foundation'], ['total'], ['validator']],
            getInflationReward: [[KEYPATH_WILDCARD, 'commission']],
            getMultipleAccounts: jsonParsedAccountsConfigs.map(c => ['value', KEYPATH_WILDCARD, ...c]),
            getProgramAccounts: jsonParsedAccountsConfigs.flatMap(c => [
                ['value', KEYPATH_WILDCARD, 'account', ...c],
                [KEYPATH_WILDCARD, 'account', ...c],
            ]),
            getRecentPerformanceSamples: [[KEYPATH_WILDCARD, 'samplePeriodSecs']],
            getTokenAccountBalance: [
                ['value', 'decimals'],
                ['value', 'uiAmount'],
            ],
            getTokenAccountsByDelegate: jsonParsedTokenAccountsConfigs.map(c => [
                'value',
                KEYPATH_WILDCARD,
                'account',
                ...c,
            ]),
            getTokenAccountsByOwner: jsonParsedTokenAccountsConfigs.map(c => [
                'value',
                KEYPATH_WILDCARD,
                'account',
                ...c,
            ]),
            getTokenLargestAccounts: [
                ['value', KEYPATH_WILDCARD, 'decimals'],
                ['value', KEYPATH_WILDCARD, 'uiAmount'],
            ],
            getTokenSupply: [
                ['value', 'decimals'],
                ['value', 'uiAmount'],
            ],
            getTransaction: [
                ['meta', 'preTokenBalances', KEYPATH_WILDCARD, 'accountIndex'],
                ['meta', 'preTokenBalances', KEYPATH_WILDCARD, 'uiTokenAmount', 'decimals'],
                ['meta', 'postTokenBalances', KEYPATH_WILDCARD, 'accountIndex'],
                ['meta', 'postTokenBalances', KEYPATH_WILDCARD, 'uiTokenAmount', 'decimals'],
                ['meta', 'rewards', KEYPATH_WILDCARD, 'commission'],
                ...innerInstructionsConfigs.map(c => ['meta', 'innerInstructions', KEYPATH_WILDCARD, ...c]),
                ...messageConfig.map(c => ['transaction', 'message', ...c] as const),
            ],
            getVersion: [['feature-set']],
            getVoteAccounts: [
                ['current', KEYPATH_WILDCARD, 'commission'],
                ['delinquent', KEYPATH_WILDCARD, 'commission'],
            ],
            simulateTransaction: [
                ...jsonParsedAccountsConfigs.map(c => ['value', 'accounts', KEYPATH_WILDCARD, ...c]),
                ...innerInstructionsConfigs.map(c => ['value', 'innerInstructions', KEYPATH_WILDCARD, ...c]),
            ],
        };
    }
    return memoizedKeypaths;
}
