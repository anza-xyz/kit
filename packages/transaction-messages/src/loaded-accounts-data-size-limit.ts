import type { Instruction } from '@solana/instructions';

import {
    getLoadedAccountsDataSizeLimitFromInstructionData,
    getSetLoadedAccountsDataSizeLimitInstruction,
    isSetLoadedAccountsDataSizeLimitInstruction,
    removeTransactionMessageInstruction,
    replaceTransactionMessageInstruction,
} from './compute-budget-instruction';
import { appendTransactionMessageInstruction } from './instructions';
import { TransactionMessage } from './transaction-message';
import { areV1ConfigsEqual, isV1ConfigEmpty } from './v1-transaction-config';

/**
 * Returns the loaded accounts data size limit currently set on a transaction message, or
 * `undefined` if none is set.
 *
 * This function works with all transaction versions:
 * - **V1**: Reads from the transaction message's `config.loadedAccountsDataSizeLimit`.
 * - **Legacy / V0**: Searches the instructions for a `SetLoadedAccountsDataSizeLimit` instruction
 *   and decodes its value.
 *
 * @param transactionMessage - The transaction message to inspect.
 * @return The loaded accounts data size limit in bytes, or `undefined` if none is set.
 *
 * @example
 * ```ts
 * const limit = getTransactionMessageLoadedAccountsDataSizeLimit(transactionMessage);
 * if (limit !== undefined) {
 *     console.log(`Loaded accounts data size limit: ${limit}`);
 * }
 * ```
 */
export function getTransactionMessageLoadedAccountsDataSizeLimit(
    transactionMessage: TransactionMessage,
): number | undefined {
    switch (transactionMessage.version) {
        case 1:
            return transactionMessage.config?.loadedAccountsDataSizeLimit;
        default:
            return getTransactionMessageLoadedAccountsDataSizeLimitUsingInstruction(transactionMessage);
    }
}

function getTransactionMessageLoadedAccountsDataSizeLimitUsingInstruction(
    transactionMessage: TransactionMessage,
): number | undefined {
    const instructions = transactionMessage.instructions as Instruction[];
    const existingInstruction = instructions.find(isSetLoadedAccountsDataSizeLimitInstruction);
    return existingInstruction
        ? getLoadedAccountsDataSizeLimitFromInstructionData(existingInstruction.data)
        : undefined;
}

/**
 * Sets the loaded accounts data size limit for a transaction message.
 *
 * This function works with all transaction versions:
 * - **V1**: Sets the `loadedAccountsDataSizeLimit` field in the transaction message's config.
 * - **Legacy / V0**: Appends (or replaces) a `SetLoadedAccountsDataSizeLimit` instruction from
 *   the Compute Budget program.
 *
 * @param loadedAccountsDataSizeLimit - The maximum size in bytes for loaded account data, or
 *   `undefined` to remove the limit.
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
 */
export function setTransactionMessageLoadedAccountsDataSizeLimit<TTransactionMessage extends TransactionMessage>(
    loadedAccountsDataSizeLimit: number | undefined,
    transactionMessage: TTransactionMessage,
): TTransactionMessage {
    switch (transactionMessage.version) {
        case 1:
            return setTransactionMessageLoadedAccountsDataSizeLimitUsingConfig(
                loadedAccountsDataSizeLimit,
                transactionMessage,
            ) as TTransactionMessage;
        default:
            return setTransactionMessageLoadedAccountsDataSizeLimitUsingInstruction(
                loadedAccountsDataSizeLimit,
                transactionMessage,
            );
    }
}

function setTransactionMessageLoadedAccountsDataSizeLimitUsingConfig<
    TTransactionMessage extends TransactionMessage & { version: 1 },
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

function setTransactionMessageLoadedAccountsDataSizeLimitUsingInstruction<
    TTransactionMessage extends TransactionMessage,
>(loadedAccountsDataSizeLimit: number | undefined, transactionMessage: TTransactionMessage): TTransactionMessage {
    const existingIndex = transactionMessage.instructions.findIndex(isSetLoadedAccountsDataSizeLimitInstruction);

    // Remove the loaded accounts data size limit instruction if there is one and the new limit is undefined.
    if (loadedAccountsDataSizeLimit === undefined) {
        return existingIndex === -1
            ? transactionMessage
            : removeTransactionMessageInstruction(existingIndex, transactionMessage);
    }

    // Ignore if the new loaded accounts data size limit is the same as the existing one.
    if (getTransactionMessageLoadedAccountsDataSizeLimit(transactionMessage) === loadedAccountsDataSizeLimit) {
        return transactionMessage;
    }

    // Add or replace the loaded accounts data size limit instruction with the new limit.
    const newInstruction = getSetLoadedAccountsDataSizeLimitInstruction(loadedAccountsDataSizeLimit);
    return existingIndex === -1
        ? (appendTransactionMessageInstruction(newInstruction, transactionMessage) as TTransactionMessage)
        : replaceTransactionMessageInstruction(existingIndex, newInstruction, transactionMessage);
}
