import type { Instruction } from '@solana/instructions';

import {
    getComputeUnitLimitFromInstructionData,
    getSetComputeUnitLimitInstruction,
    isSetComputeUnitLimitInstruction,
    removeTransactionMessageInstruction,
    replaceTransactionMessageInstruction,
} from './compute-budget-instruction';
import { appendTransactionMessageInstruction } from './instructions';
import { TransactionMessage } from './transaction-message';
import { areV1ConfigsEqual, isV1ConfigEmpty } from './v1-transaction-config';

/**
 * Returns the compute unit limit currently set on a transaction message, or `undefined` if none is
 * set.
 *
 * This function works with all transaction versions:
 * - **V1**: Reads from the transaction message's `config.computeUnitLimit`.
 * - **Legacy / V0**: Searches the instructions for a `SetComputeUnitLimit` instruction and decodes
 *   its value.
 *
 * @param transactionMessage - The transaction message to inspect.
 * @return The compute unit limit, or `undefined` if none is set.
 *
 * @example
 * ```ts
 * const limit = getTransactionMessageComputeUnitLimit(transactionMessage);
 * if (limit !== undefined) {
 *     console.log(`Compute unit limit: ${limit}`);
 * }
 * ```
 */
export function getTransactionMessageComputeUnitLimit(transactionMessage: TransactionMessage): number | undefined {
    switch (transactionMessage.version) {
        case 1:
            return transactionMessage.config?.computeUnitLimit;
        default:
            return getTransactionMessageComputeUnitLimitUsingInstruction(transactionMessage);
    }
}

function getTransactionMessageComputeUnitLimitUsingInstruction(
    transactionMessage: TransactionMessage,
): number | undefined {
    const instructions = transactionMessage.instructions as Instruction[];
    const existingInstruction = instructions.find(isSetComputeUnitLimitInstruction);
    return existingInstruction ? getComputeUnitLimitFromInstructionData(existingInstruction.data) : undefined;
}

/**
 * Sets the compute unit limit for a transaction message.
 *
 * This function works with all transaction versions:
 * - **V1**: Sets the `computeUnitLimit` field in the transaction message's config.
 * - **Legacy / V0**: Appends (or replaces) a `SetComputeUnitLimit` instruction from the Compute
 *   Budget program.
 *
 * @param computeUnitLimit - The maximum compute units (CUs) allowed, or `undefined` to remove the
 *   limit.
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
 */
export function setTransactionMessageComputeUnitLimit<TTransactionMessage extends TransactionMessage>(
    computeUnitLimit: number | undefined,
    transactionMessage: TTransactionMessage,
): TTransactionMessage {
    switch (transactionMessage.version) {
        case 1:
            return setTransactionMessageComputeUnitLimitUsingConfig(
                computeUnitLimit,
                transactionMessage,
            ) as TTransactionMessage;
        default:
            return setTransactionMessageComputeUnitLimitUsingInstruction(computeUnitLimit, transactionMessage);
    }
}

function setTransactionMessageComputeUnitLimitUsingConfig<
    TTransactionMessage extends TransactionMessage & { version: 1 },
>(computeUnitLimit: number | undefined, transactionMessage: TTransactionMessage): TTransactionMessage {
    const mergedConfig = { ...(transactionMessage.config ?? {}), computeUnitLimit };
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

function setTransactionMessageComputeUnitLimitUsingInstruction<TTransactionMessage extends TransactionMessage>(
    computeUnitLimit: number | undefined,
    transactionMessage: TTransactionMessage,
): TTransactionMessage {
    const existingIndex = transactionMessage.instructions.findIndex(isSetComputeUnitLimitInstruction);

    // Remove the compute unit limit instruction if there is one and the new limit is undefined.
    if (computeUnitLimit === undefined) {
        return existingIndex === -1
            ? transactionMessage
            : removeTransactionMessageInstruction(existingIndex, transactionMessage);
    }

    // Ignore if the new compute unit limit is the same as the existing one.
    if (getTransactionMessageComputeUnitLimit(transactionMessage) === computeUnitLimit) {
        return transactionMessage;
    }

    // Add or replace the compute unit limit instruction with the new limit.
    const newInstruction = getSetComputeUnitLimitInstruction(computeUnitLimit);
    return existingIndex === -1
        ? (appendTransactionMessageInstruction(newInstruction, transactionMessage) as TTransactionMessage)
        : replaceTransactionMessageInstruction(existingIndex, newInstruction, transactionMessage);
}
