import { TransactionMessage, TransactionVersion } from './transaction-message';
import { areV1ConfigsEqual, isV1ConfigEmpty } from './v1-transaction-config';

// TODO later: add support for other transaction versions
type SupportedTransactionVersions = Extract<TransactionVersion, 1>;

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
    const mergedConfig = { ...(transactionMessage.config ?? {}), heapSize };
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
