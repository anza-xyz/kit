import { TransactionMessage, TransactionVersion } from './transaction-message';

/**
 * Configuration options for transaction messages.
 *
 * These options allow fine-grained control over transaction resource usage and
 * prioritization. All fields are optional and will be encoded into the transaction
 * when present.
 */
export type TransactionConfig = {
    /**
     * Maximum number of compute units the transaction may consume.
     *
     * If not specified, defaults to 200,000 CUs per instruction. The maximum
     * allowed value is 1,400,000 CUs.
     */
    computeUnitLimit?: number;
    /**
     * Requested heap frame size in bytes for the transaction's execution.
     */
    heapSize?: number;
    /**
     * Maximum size in bytes for loaded account data.
     */
    loadedAccountsDataSizeLimit?: number;
    /**
     * Total priority fee in lamports to pay for transaction prioritization.
     */
    priorityFeeLamports?: bigint;
};

type SupportedTransactionVersions = Extract<TransactionVersion, 1>;

function hasDefinedConfigValues(config: TransactionConfig): boolean {
    return (
        config.computeUnitLimit !== undefined ||
        config.heapSize !== undefined ||
        config.loadedAccountsDataSizeLimit !== undefined ||
        config.priorityFeeLamports !== undefined
    );
}

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
>(config: TransactionConfig, transactionMessage: TTransactionMessage): TTransactionMessage {
    const mergedConfig = {
        ...transactionMessage.config,
        ...config,
    };

    if (!hasDefinedConfigValues(mergedConfig)) {
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
    if (
        transactionMessage.config &&
        transactionMessage.config.computeUnitLimit === mergedConfig.computeUnitLimit &&
        transactionMessage.config.heapSize === mergedConfig.heapSize &&
        transactionMessage.config.loadedAccountsDataSizeLimit === mergedConfig.loadedAccountsDataSizeLimit &&
        transactionMessage.config.priorityFeeLamports === mergedConfig.priorityFeeLamports
    ) {
        return transactionMessage;
    }

    return Object.freeze({
        ...transactionMessage,
        config: Object.freeze(mergedConfig),
    }) as TTransactionMessage;
}

/**
 * Sets the compute unit limit for a transaction message.
 *
 * @param computeUnitLimit - The maximum compute units (CUs) allowed, or `undefined` to remove the limit.
 * @param transactionMessage - The transaction message to configure.
 * @typeParam TTransactionMessage - The transaction message type.
 * @return A new transaction message with the compute unit limit set.
 *
 * @example
 * ```ts
 * const txMessage = setTransactionMessageComputeUnitLimit(
 *     400_000,
 *     transactionMessage,
 * );
 * ```
 *
 * @see {@link setTransactionMessageConfig}
 */
export function setTransactionMessageComputeUnitLimit<
    TTransactionMessage extends TransactionMessage & { version: SupportedTransactionVersions },
>(computeUnitLimit: number | undefined, transactionMessage: TTransactionMessage): TTransactionMessage {
    return setTransactionMessageConfig({ computeUnitLimit }, transactionMessage);
}

/**
 * Sets the heap frame size for a transaction message.
 *
 * @param heapSize - The requested heap frame size in bytes, or `undefined` to remove the setting.
 * @param transactionMessage - The transaction message to configure.
 * @typeParam TTransactionMessage - The transaction message type.
 * @return A new transaction message with the heap size set.
 *
 * @example
 * ```ts
 * const txMessage = setTransactionMessageHeapSize(
 *     256_000,
 *     transactionMessage,
 * );
 * ```
 *
 * @see {@link setTransactionMessageConfig}
 */
export function setTransactionMessageHeapSize<
    TTransactionMessage extends TransactionMessage & { version: SupportedTransactionVersions },
>(heapSize: number | undefined, transactionMessage: TTransactionMessage): TTransactionMessage {
    return setTransactionMessageConfig({ heapSize }, transactionMessage);
}

/**
 * Sets the loaded accounts data size limit for a transaction message.
 *
 * @param loadedAccountsDataSizeLimit - The maximum size in bytes for loaded account data, or `undefined` to remove the limit.
 * @param transactionMessage - The transaction message to configure.
 * @typeParam TTransactionMessage - The transaction message type.
 * @return A new transaction message with the loaded accounts data size limit set.
 *
 * @example
 * ```ts
 * const txMessage = setTransactionMessageLoadedAccountsDataSizeLimit(
 *     64_000,
 *     transactionMessage,
 * );
 * ```
 *
 * @see {@link setTransactionMessageConfig}
 */
export function setTransactionMessageLoadedAccountsDataSizeLimit<
    TTransactionMessage extends TransactionMessage & { version: SupportedTransactionVersions },
>(loadedAccountsDataSizeLimit: number | undefined, transactionMessage: TTransactionMessage): TTransactionMessage {
    return setTransactionMessageConfig({ loadedAccountsDataSizeLimit }, transactionMessage);
}

/**
 * Sets the total priority fee for a transaction message.

 * @param priorityFeeLamports - The priority fee amount in lamports, or `undefined` to remove the fee.
 * @param transactionMessage - The transaction message to configure.
 * @typeParam TTransactionMessage - The transaction message type.
 * @return A new transaction message with the priority fee set.
 *
 * @example
 * ```ts
 * const txMessage = setTransactionMessagePriorityFeeLamports(
 *     10_000n,
 *     transactionMessage,
 * );
 * ```
 *
 * @see {@link setTransactionMessageConfig}
 */
export function setTransactionMessagePriorityFeeLamports<
    TTransactionMessage extends TransactionMessage & { version: SupportedTransactionVersions },
>(priorityFeeLamports: bigint | undefined, transactionMessage: TTransactionMessage): TTransactionMessage {
    return setTransactionMessageConfig({ priorityFeeLamports }, transactionMessage);
}
