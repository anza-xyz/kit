import { TransactionMessage, TransactionVersion } from './transaction-message';
import { areV1ConfigsEqual, isV1ConfigEmpty } from './v1-transaction-config';

// TODO later: add support for other transaction versions
type SupportedTransactionVersions = Extract<TransactionVersion, 1>;

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
    const mergedConfig = { ...(transactionMessage.config ?? {}), priorityFeeLamports };
    const nextConfig = isV1ConfigEmpty(mergedConfig) ? undefined : Object.freeze(mergedConfig);
    if (nextConfig === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { config, ...rest } = transactionMessage;
        return Object.freeze(rest) as TTransactionMessage;
    }

    if (transactionMessage.config && areV1ConfigsEqual(transactionMessage.config, nextConfig)) {
        return transactionMessage;
    }

    return Object.freeze({ ...transactionMessage, config: nextConfig }) as TTransactionMessage;
}
