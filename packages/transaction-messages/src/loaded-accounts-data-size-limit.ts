import { TransactionMessage, TransactionVersion } from './transaction-message';
import { areV1ConfigsEqual, isV1ConfigEmpty } from './v1-transaction-config';

// TODO later: add support for other transaction versions
type SupportedTransactionVersions = Extract<TransactionVersion, 1>;

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
    const mergedConfig = { ...(transactionMessage.config ?? {}), loadedAccountsDataSizeLimit };
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
