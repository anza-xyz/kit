import {
    getSolanaErrorFromTransactionError,
    isSolanaError,
    type RpcSimulateTransactionResult,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_LOADED_ACCOUNTS_DATA_SIZE_LIMIT,
    SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS,
    SolanaError,
} from '@solana/errors';
import { pipe } from '@solana/functional';
import type { Rpc, SimulateTransactionApi } from '@solana/rpc';
import type { Commitment, Slot } from '@solana/rpc-types';
import {
    getTransactionMessageComputeUnitLimit,
    getTransactionMessageLoadedAccountsDataSizeLimit,
    isTransactionMessageWithDurableNonceLifetime,
    setTransactionMessageComputeUnitLimit,
    setTransactionMessageLoadedAccountsDataSizeLimit,
    TransactionMessage,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import { compileTransaction, getBase64EncodedWireTransaction } from '@solana/transactions';

const PROVISORY_LIMIT = 0;
// From Agave: https://github.com/anza-xyz/agave/blob/2a165e7a90af75c76426d1e031ed0284211d5d1e/program-runtime/src/execution_budget.rs#L39
const MAX_COMPUTE_UNIT_LIMIT = 1_400_000;
// From Agave: https://github.com/anza-xyz/agave/blob/2a165e7a90af75c76426d1e031ed0284211d5d1e/program-runtime/src/execution_budget.rs#L53
const MAX_LOADED_ACCOUNTS_DATA_SIZE_LIMIT = 64 * 1024 * 1024;

type EstimateResourceLimitsFactoryConfig = Readonly<{
    rpc: Rpc<SimulateTransactionApi>;
}>;

type EstimateResourceLimitsConfig = Readonly<{
    abortSignal?: AbortSignal;
    commitment?: Commitment;
    minContextSlot?: Slot;
}>;

/**
 * The estimated resource limits for a transaction message.
 *
 * `computeUnitLimit` is always returned. For version 1 transaction messages,
 * `loadedAccountsDataSizeLimit` is also required. For legacy and version 0 messages, the
 * `loadedAccountsDataSizeLimit` is returned when the RPC includes it in the simulation result,
 * but is not required — callers that don't apply it can ignore the field.
 */
export type ResourceLimitsEstimate<TTransactionMessage extends TransactionMessage> = TTransactionMessage extends {
    version: 1;
}
    ? { computeUnitLimit: number; loadedAccountsDataSizeLimit: number }
    : { computeUnitLimit: number; loadedAccountsDataSizeLimit?: number };

type EstimateResourceLimitsFunction = <TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer>(
    transactionMessage: TTransactionMessage,
    config?: EstimateResourceLimitsConfig,
) => Promise<ResourceLimitsEstimate<TTransactionMessage>>;

/**
 * Returns a function that estimates the resource limits required by a transaction message by
 * simulating it.
 *
 * The estimator sets the compute unit limit to the maximum (1,400,000) and the loaded accounts data
 * size limit to the maximum (64 MiB) before simulating, so the simulation does not fail due to
 * resource exhaustion. For blockhash-lifetime transactions, the RPC is asked to replace the
 * blockhash during simulation, so any blockhash value will work. For durable nonce transactions,
 * the actual nonce value is used.
 *
 * For version 1 transaction messages, both `computeUnitLimit` and `loadedAccountsDataSizeLimit` are
 * returned. The function throws if the RPC does not return a `loadedAccountsDataSize` value, since
 * this value is required for version 1 transactions. For legacy and version 0 messages, only
 * `computeUnitLimit` is returned.
 *
 * @param factoryConfig - An object containing the RPC instance to use for simulation.
 * @return A function that accepts a transaction message and returns the estimated resource limits.
 *
 * @example
 * ```ts
 * import { estimateResourceLimitsFactory } from '@solana/kit';
 *
 * const estimateResourceLimits = estimateResourceLimitsFactory({ rpc });
 * const { computeUnitLimit, loadedAccountsDataSizeLimit } = await estimateResourceLimits(transactionMessage);
 * ```
 */
export function estimateResourceLimitsFactory({
    rpc,
}: EstimateResourceLimitsFactoryConfig): EstimateResourceLimitsFunction {
    return async function estimateResourceLimits<
        TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer,
    >(transactionMessage: TTransactionMessage, config?: EstimateResourceLimitsConfig) {
        const { abortSignal, ...simulateConfig } = config ?? {};
        const replaceRecentBlockhash = !isTransactionMessageWithDurableNonceLifetime(transactionMessage);
        const isDataSizeRequired = transactionMessage.version === 1;

        const transaction = pipe(
            transactionMessage,
            m => setTransactionMessageComputeUnitLimit(MAX_COMPUTE_UNIT_LIMIT, m),
            m =>
                isDataSizeRequired
                    ? setTransactionMessageLoadedAccountsDataSizeLimit(MAX_LOADED_ACCOUNTS_DATA_SIZE_LIMIT, m)
                    : m,
            compileTransaction,
        );
        const wireTransactionBytes = getBase64EncodedWireTransaction(transaction);

        try {
            const response = await rpc
                .simulateTransaction(wireTransactionBytes, {
                    ...simulateConfig,
                    encoding: 'base64',
                    replaceRecentBlockhash,
                    sigVerify: false,
                })
                .send({ abortSignal });
            // The API response and `RpcSimulateTransactionResult` describe overlapping but
            // structurally different shapes (eg. `replacementBlockhash` is a parsed
            // `TransactionBlockhashLifetime` object here, but a raw string there). Cast through
            // `unknown` to bridge the structural gap.
            const { err: transactionError, ...simulationResult } =
                response.value as unknown as RpcSimulateTransactionResult;

            if (simulationResult.unitsConsumed == null) {
                throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT);
            }

            if (isDataSizeRequired && simulationResult.loadedAccountsDataSize == null) {
                throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_LOADED_ACCOUNTS_DATA_SIZE_LIMIT);
            }

            if (transactionError) {
                throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS, {
                    ...simulationResult,
                    cause: getSolanaErrorFromTransactionError(transactionError),
                });
            }

            // Downcast from bigint to number, capping at u32 max.
            const computeUnitLimit =
                simulationResult.unitsConsumed > 4_294_967_295n
                    ? 4_294_967_295
                    : Number(simulationResult.unitsConsumed);

            if (isDataSizeRequired) {
                return {
                    computeUnitLimit,
                    loadedAccountsDataSizeLimit: simulationResult.loadedAccountsDataSize!,
                } as ResourceLimitsEstimate<TTransactionMessage>;
            }
            return (
                simulationResult.loadedAccountsDataSize == null
                    ? { computeUnitLimit }
                    : { computeUnitLimit, loadedAccountsDataSizeLimit: simulationResult.loadedAccountsDataSize }
            ) as ResourceLimitsEstimate<TTransactionMessage>;
        } catch (e) {
            if (
                isSolanaError(e, SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS) ||
                isSolanaError(e, SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_LOADED_ACCOUNTS_DATA_SIZE_LIMIT)
            ) {
                throw e;
            }
            throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT, {
                cause: e,
            });
        }
    };
}

/**
 * Returns a function that estimates the resource limits for a transaction message and sets them on
 * the message.
 *
 * For all versions, the compute unit limit is updated to the estimated value if it is not already
 * set to an explicit, non-provisory value. The compute unit limit also treats the maximum
 * (1,400,000) as non-explicit, so messages that pre-set the max for simulation get re-estimated.
 *
 * For version 1 messages, the loaded accounts data size limit is updated only if it is unset or set
 * to the provisory value of 0. An explicit value — including the runtime maximum — is left
 * untouched, since callers who set it explicitly are signaling a deliberate choice.
 *
 * This is designed to work with {@link fillTransactionMessageProvisoryResourceLimits}: first add
 * provisory limits during transaction construction, then later estimate and replace them before
 * sending.
 *
 * @param estimateResourceLimits - The estimator function, typically created by
 *   {@link estimateResourceLimitsFactory}. You can also pass a custom wrapper that applies a buffer
 *   to the returned values.
 * @return A function that accepts a transaction message and returns it with resource limits set to
 *   the estimated values.
 *
 * @example
 * ```ts
 * import { estimateAndSetResourceLimitsFactory, estimateResourceLimitsFactory } from '@solana/kit';
 *
 * const estimator = estimateResourceLimitsFactory({ rpc });
 * const estimateAndSet = estimateAndSetResourceLimitsFactory(estimator);
 * const updatedMessage = await estimateAndSet(transactionMessage);
 * ```
 */
export function estimateAndSetResourceLimitsFactory(
    estimateResourceLimits: EstimateResourceLimitsFunction,
): <TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer>(
    transactionMessage: TTransactionMessage,
    config?: EstimateResourceLimitsConfig,
) => Promise<TTransactionMessage> {
    return async function estimateAndSetResourceLimits(transactionMessage, config) {
        const existingComputeUnitLimit = getTransactionMessageComputeUnitLimit(transactionMessage);
        const computeUnitLimitIsExplicit =
            existingComputeUnitLimit !== undefined &&
            existingComputeUnitLimit !== PROVISORY_LIMIT &&
            existingComputeUnitLimit !== MAX_COMPUTE_UNIT_LIMIT;

        const isV1 = transactionMessage.version === 1;
        let loadedAccountsDataSizeLimitIsExplicit = true;
        if (isV1) {
            const existingLoadedAccountsDataSizeLimit =
                getTransactionMessageLoadedAccountsDataSizeLimit(transactionMessage);
            loadedAccountsDataSizeLimitIsExplicit =
                existingLoadedAccountsDataSizeLimit !== undefined &&
                existingLoadedAccountsDataSizeLimit !== PROVISORY_LIMIT;
        }

        // Nothing to do — every applicable limit is already explicitly set.
        if (computeUnitLimitIsExplicit && loadedAccountsDataSizeLimitIsExplicit) {
            return transactionMessage;
        }

        const estimate = await estimateResourceLimits(transactionMessage, config);

        let result = transactionMessage;
        if (!computeUnitLimitIsExplicit) {
            result = setTransactionMessageComputeUnitLimit(estimate.computeUnitLimit, result);
        }
        if (isV1 && !loadedAccountsDataSizeLimitIsExplicit && 'loadedAccountsDataSizeLimit' in estimate) {
            result = setTransactionMessageLoadedAccountsDataSizeLimit(estimate.loadedAccountsDataSizeLimit, result);
        }
        return result;
    };
}

/**
 * Sets resource limits to a provisory value of 0 if no limit is currently set on the transaction
 * message.
 *
 * For all versions, this fills the compute unit limit. For version 1 messages, it also fills the
 * loaded accounts data size limit. If a limit is already set (any value, including 0), that limit
 * is left unchanged.
 *
 * This is useful during transaction construction to reserve space for resource limits that will
 * later be replaced with actual estimates via {@link estimateAndSetResourceLimitsFactory}.
 *
 * @param transactionMessage - The transaction message to add provisory limits to.
 * @return The transaction message with provisory resource limits set, or unchanged if all
 *   applicable limits were already present.
 *
 * @example
 * ```ts
 * import { fillTransactionMessageProvisoryResourceLimits } from '@solana/kit';
 *
 * const messageWithProvisoryLimits = fillTransactionMessageProvisoryResourceLimits(transactionMessage);
 * ```
 */
export function fillTransactionMessageProvisoryResourceLimits<TTransactionMessage extends TransactionMessage>(
    transactionMessage: TTransactionMessage,
): TTransactionMessage {
    let result: TTransactionMessage = transactionMessage;
    if (getTransactionMessageComputeUnitLimit(result) === undefined) {
        result = setTransactionMessageComputeUnitLimit(PROVISORY_LIMIT, result);
    }
    if (result.version === 1 && getTransactionMessageLoadedAccountsDataSizeLimit(result) === undefined) {
        result = setTransactionMessageLoadedAccountsDataSizeLimit(PROVISORY_LIMIT, result);
    }
    return result;
}
