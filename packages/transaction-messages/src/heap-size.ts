import type { Instruction } from '@solana/instructions';

import {
    getHeapSizeFromInstructionData,
    getRequestHeapFrameInstruction,
    isRequestHeapFrameInstruction,
    removeTransactionMessageInstruction,
    replaceTransactionMessageInstruction,
} from './compute-budget-instruction';
import { appendTransactionMessageInstruction } from './instructions';
import { TransactionMessage } from './transaction-message';
import { areV1ConfigsEqual, isV1ConfigEmpty } from './v1-transaction-config';

/**
 * Returns the heap size currently set on a transaction message, or `undefined` if none is set.
 *
 * This function works with all transaction versions:
 * - **V1**: Reads from the transaction message's `config.heapSize`.
 * - **Legacy / V0**: Searches the instructions for a `RequestHeapFrame` instruction and decodes its
 *   value.
 *
 * @param transactionMessage - The transaction message to inspect.
 * @return The heap size in bytes, or `undefined` if none is set.
 *
 * @example
 * ```ts
 * const heapSize = getTransactionMessageHeapSize(transactionMessage);
 * if (heapSize !== undefined) {
 *     console.log(`Heap size: ${heapSize}`);
 * }
 * ```
 */
export function getTransactionMessageHeapSize(transactionMessage: TransactionMessage): number | undefined {
    switch (transactionMessage.version) {
        case 1:
            return transactionMessage.config?.heapSize;
        default:
            return getTransactionMessageHeapSizeUsingInstruction(transactionMessage);
    }
}

function getTransactionMessageHeapSizeUsingInstruction(transactionMessage: TransactionMessage): number | undefined {
    const instructions = transactionMessage.instructions as Instruction[];
    const existingInstruction = instructions.find(isRequestHeapFrameInstruction);
    return existingInstruction ? getHeapSizeFromInstructionData(existingInstruction.data) : undefined;
}

/**
 * Sets the heap frame size for a transaction message.
 *
 * This function works with all transaction versions:
 * - **V1**: Sets the `heapSize` field in the transaction message's config.
 * - **Legacy / V0**: Appends (or replaces) a `RequestHeapFrame` instruction from the Compute
 *   Budget program.
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
 */
export function setTransactionMessageHeapSize<TTransactionMessage extends TransactionMessage>(
    heapSize: number | undefined,
    transactionMessage: TTransactionMessage,
): TTransactionMessage {
    switch (transactionMessage.version) {
        case 1:
            return setTransactionMessageHeapSizeUsingConfig(heapSize, transactionMessage) as TTransactionMessage;
        default:
            return setTransactionMessageHeapSizeUsingInstruction(heapSize, transactionMessage);
    }
}

function setTransactionMessageHeapSizeUsingConfig<TTransactionMessage extends TransactionMessage & { version: 1 }>(
    heapSize: number | undefined,
    transactionMessage: TTransactionMessage,
): TTransactionMessage {
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

function setTransactionMessageHeapSizeUsingInstruction<TTransactionMessage extends TransactionMessage>(
    heapSize: number | undefined,
    transactionMessage: TTransactionMessage,
): TTransactionMessage {
    const existingIndex = transactionMessage.instructions.findIndex(isRequestHeapFrameInstruction);

    // Remove the heap size instruction if there is one and the new size is undefined.
    if (heapSize === undefined) {
        return existingIndex === -1
            ? transactionMessage
            : removeTransactionMessageInstruction(existingIndex, transactionMessage);
    }

    // Ignore if the new heap size is the same as the existing one.
    if (getTransactionMessageHeapSize(transactionMessage) === heapSize) {
        return transactionMessage;
    }

    // Add or replace the heap size instruction with the new size.
    const newInstruction = getRequestHeapFrameInstruction(heapSize);
    return existingIndex === -1
        ? (appendTransactionMessageInstruction(newInstruction, transactionMessage) as TTransactionMessage)
        : replaceTransactionMessageInstruction(existingIndex, newInstruction, transactionMessage);
}
