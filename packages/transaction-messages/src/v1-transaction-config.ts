import { SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS, SolanaError } from '@solana/errors';

import { TransactionMessage, TransactionVersion } from './transaction-message';

/**
 * Configuration options for transaction messages.
 *
 * These options allow fine-grained control over transaction resource usage and
 * prioritization. All fields are optional and will be encoded into the transaction
 * when present.
 */
export type V1TransactionConfig = {
    /**
     * Maximum number of compute units the transaction may consume.
     *
     * Unlike legacy and version 0 transactions, which fall back to 200,000 compute units per
     * instruction when no `SetComputeUnitLimit` instruction is present, a version 1 transaction that
     * leaves this field unset is budgeted **zero** compute units and will fail at execution. Set it
     * explicitly on every version 1 transaction. The maximum allowed value is 1,400,000 CUs.
     */
    computeUnitLimit?: number;
    /**
     * Requested heap frame size in bytes for the transaction's execution.
     */
    heapSize?: number;
    /**
     * Maximum size in bytes for loaded account data.
     *
     * As with {@link V1TransactionConfig.computeUnitLimit}, leaving this field unset budgets
     * **zero** bytes rather than applying a default, so any transaction that loads account data
     * must set it explicitly.
     */
    loadedAccountsDataSizeLimit?: number;
    /**
     * Total priority fee in lamports to pay for transaction prioritization.
     *
     * Unlike legacy and version 0 transactions, where the priority fee is derived from a price per
     * compute unit, this is the total fee paid for the whole transaction. If not specified, no
     * priority fee is paid.
     */
    priorityFeeLamports?: bigint;
};

/**
 * Determines whether a transaction config has no fields set.
 *
 * @param config - The config to inspect.
 * @return `true` if every field of the config is `undefined`, `false` otherwise.
 */
export function isV1ConfigEmpty(config: V1TransactionConfig): boolean {
    return (
        config.computeUnitLimit === undefined &&
        config.heapSize === undefined &&
        config.loadedAccountsDataSizeLimit === undefined &&
        config.priorityFeeLamports === undefined
    );
}

/**
 * Determines whether two transaction configs set the same value for every field.
 *
 * @param config1 - The first config to compare.
 * @param config2 - The second config to compare.
 * @return `true` if all four fields are equal between the two configs, `false` otherwise.
 */
export function areV1ConfigsEqual(config1: V1TransactionConfig, config2: V1TransactionConfig) {
    return (
        config1.computeUnitLimit === config2.computeUnitLimit &&
        config1.heapSize === config2.heapSize &&
        config1.loadedAccountsDataSizeLimit === config2.loadedAccountsDataSizeLimit &&
        config1.priorityFeeLamports === config2.priorityFeeLamports
    );
}

type SupportedTransactionVersions = Extract<TransactionVersion, 1>;

/**
 * Sets configuration options on a transaction message.
 *
 * This function merges the provided configuration with any existing configuration
 * on the transaction message. Configuration values control resource limits and
 * transaction prioritization.
 *
 * @param config - The configuration options to apply.
 * @param transactionMessage - The transaction message to configure.
 * @typeParam TTransactionMessage - The transaction message type.
 * @return A new transaction message with the merged configuration.
 *
 * @example
 * ```ts
 * const configuredTx = setTransactionMessageConfig(
 *     {
 *         computeUnitLimit: 300_000,
 *         priorityFeeLamports: 50_000n,
 *     },
 *     transactionMessage,
 * );
 * ```
 *
 * @example
 * Incrementally adding configuration values.
 * ```ts
 * const txMessage = pipe(
 *     baseTransaction,
 *     tx => setTransactionMessageConfig({ computeUnitLimit: 300_000 }, tx),
 *     tx => setTransactionMessageConfig({ priorityFeeLamports: 50_000n }, tx),
 * );
 * ```
 *
 * @example
 * Removing a configuration value.
 * ```ts
 * const txMessage = setTransactionMessageConfig({ computeUnitLimit: undefined }, tx);
 * ```
 *
 * @see {@link setTransactionMessageComputeUnitLimit}
 * @see {@link setTransactionMessagePriorityFeeLamports}
 */
export function setTransactionMessageConfig<
    TTransactionMessage extends TransactionMessage & { version: SupportedTransactionVersions },
>(config: V1TransactionConfig, transactionMessage: TTransactionMessage): TTransactionMessage {
    const mergedConfig = {
        ...transactionMessage.config,
        ...config,
    };

    if (isV1ConfigEmpty(mergedConfig)) {
        // If config has no defined values, remove it entirely
        if (!transactionMessage.config) {
            // No config before, no config after - return same reference
            return transactionMessage;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { config, ...rest } = transactionMessage;
        return Object.freeze(rest) as TTransactionMessage;
    }

    // Check if config is identical for idempotency
    if (transactionMessage.config && areV1ConfigsEqual(transactionMessage.config, mergedConfig)) {
        return transactionMessage;
    }

    return Object.freeze({
        ...transactionMessage,
        config: Object.freeze(mergedConfig),
    }) as TTransactionMessage;
}

export const TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK = 0b11;
export const TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK = 0b100;
export const TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK = 0b1000;
export const TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK = 0b10000;

/**
 * Checks whether the transaction config mask indicates a priority fee is present.
 *
 * The priority fee uses bits 0 and 1 of the mask. Both bits must be set or
 * both must be unset — having only one bit set is invalid and will throw an error.
 *
 * @param mask - The transaction config mask to check.
 * @return `true` if the mask indicates a priority fee is present, `false` otherwise.
 *
 * @throws {SolanaError} Throws `SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS`
 * if only one of the two priority fee bits is set.
 *
 * @example
 * Check if a mask has a priority fee.
 * ```ts
 * const hasPriorityFee = transactionConfigMaskHasPriorityFee(0b11);
 * // true (both bits 0 and 1 are set)
 * ```
 */
export function transactionConfigMaskHasPriorityFee(mask: number): boolean {
    // bits 0 and 1 must both be set or both be unset
    const priorityFeeBits = mask & TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK;
    if (priorityFeeBits === 0b01 || priorityFeeBits === 0b10) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS, { mask });
    }
    return priorityFeeBits === TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK;
}

/**
 * Checks whether the transaction config mask indicates a compute unit limit is present.
 *
 * The compute unit limit uses bit 2 of the mask.
 *
 * @param mask - The transaction config mask to check.
 * @return `true` if the mask indicates a compute unit limit is present, `false` otherwise.
 *
 * @example
 * ```ts
 * const hasComputeUnitLimit = transactionConfigMaskHasComputeUnitLimit(0b100);
 * // true (bit 2 is set)
 * ```
 */
export function transactionConfigMaskHasComputeUnitLimit(mask: number): boolean {
    return (mask & TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK) !== 0;
}

/**
 * Checks whether the transaction config mask indicates a loaded accounts data size limit is present.
 *
 * The loaded accounts data size limit uses bit 3 of the mask.
 *
 * @param mask - The transaction config mask to check.
 * @return `true` if the mask indicates a loaded accounts data size limit is present, `false` otherwise.
 *
 * @example
 * ```ts
 * const hasLimit = transactionConfigMaskHasLoadedAccountsDataSizeLimit(0b1000);
 * // true (bit 3 is set)
 * ```
 */
export function transactionConfigMaskHasLoadedAccountsDataSizeLimit(mask: number): boolean {
    return (mask & TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK) !== 0;
}

/**
 * Checks whether the transaction config mask indicates a heap size is present.
 *
 * The heap size uses bit 4 of the mask.
 *
 * @param mask - The transaction config mask to check.
 * @return `true` if the mask indicates a heap size is present, `false` otherwise.
 *
 * @example
 * ```ts
 * const hasHeapSize = transactionConfigMaskHasHeapSize(0b10000);
 * // true (bit 4 is set)
 * ```
 */
export function transactionConfigMaskHasHeapSize(mask: number): boolean {
    return (mask & TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK) !== 0;
}
