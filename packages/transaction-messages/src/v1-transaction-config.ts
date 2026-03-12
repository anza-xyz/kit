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

export function isV1ConfigEmpty(config: V1TransactionConfig): boolean {
    return (
        config.computeUnitLimit === undefined &&
        config.heapSize === undefined &&
        config.loadedAccountsDataSizeLimit === undefined &&
        config.priorityFeeLamports === undefined
    );
}

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
