import type { Instruction } from '@solana/instructions';

import {
    getPriorityFeeFromInstructionData,
    getSetComputeUnitPriceInstruction,
    isSetComputeUnitPriceInstruction,
    removeTransactionMessageInstruction,
    replaceTransactionMessageInstruction,
} from './compute-budget-instruction';
import { appendTransactionMessageInstruction } from './instructions';
import { TransactionMessage, TransactionVersion } from './transaction-message';

type SupportedTransactionVersions = Extract<TransactionVersion, 'legacy' | 0>;

/**
 * Returns the compute unit price currently set on a legacy or v0 transaction message, or
 * `undefined` if none is set.
 *
 * This searches the instructions for a `SetComputeUnitPrice` instruction and decodes its value.
 * The value represents the price in **micro-lamports per compute unit**.
 *
 * @param transactionMessage - The legacy or v0 transaction message to inspect.
 * @return The compute unit price in micro-lamports per compute unit, or `undefined` if none is set.
 *
 * @example
 * ```ts
 * const price = getTransactionMessageComputeUnitPrice(transactionMessage);
 * if (price !== undefined) {
 *     console.log(`Compute unit price: ${price} micro-lamports`);
 * }
 * ```
 *
 * @see {@link setTransactionMessageComputeUnitPrice}
 * @see {@link getTransactionMessagePriorityFeeLamports} for v1 transactions.
 */
export function getTransactionMessageComputeUnitPrice<
    TTransactionMessage extends TransactionMessage & { version: SupportedTransactionVersions },
>(transactionMessage: TTransactionMessage): bigint | undefined {
    const instructions = transactionMessage.instructions as Instruction[];
    const existingInstruction = instructions.find(isSetComputeUnitPriceInstruction);
    return existingInstruction ? getPriorityFeeFromInstructionData(existingInstruction.data) : undefined;
}

/**
 * Sets the compute unit price for a legacy or v0 transaction message.
 *
 * The value represents the price in **micro-lamports per compute unit**. The actual priority fee
 * paid is `computeUnitPrice × computeUnitLimit`.
 *
 * This appends, replaces, or removes a `SetComputeUnitPrice` instruction from the Compute Budget
 * program. The operation is idempotent: setting the same value returns the same reference, and
 * setting `undefined` removes the instruction.
 *
 * @param computeUnitPrice - The price in micro-lamports per compute unit, or `undefined` to remove
 *   the instruction.
 * @param transactionMessage - The legacy or v0 transaction message to configure.
 * @typeParam TTransactionMessage - The transaction message type.
 * @return A new transaction message with the compute unit price set.
 *
 * @example
 * ```ts
 * const txMessage = setTransactionMessageComputeUnitPrice(
 *     10_000n,
 *     transactionMessage,
 * );
 * ```
 *
 * @see {@link getTransactionMessageComputeUnitPrice}
 * @see {@link setTransactionMessagePriorityFeeLamports} for v1 transactions.
 */
export function setTransactionMessageComputeUnitPrice<
    TTransactionMessage extends TransactionMessage & { version: SupportedTransactionVersions },
>(computeUnitPrice: bigint | undefined, transactionMessage: TTransactionMessage): TTransactionMessage {
    const existingIndex = transactionMessage.instructions.findIndex(isSetComputeUnitPriceInstruction);

    // Remove the compute unit price instruction if there is one and the new price is undefined.
    if (computeUnitPrice === undefined) {
        return existingIndex === -1
            ? transactionMessage
            : removeTransactionMessageInstruction(existingIndex, transactionMessage);
    }

    // Ignore if the new compute unit price is the same as the existing one.
    if (getTransactionMessageComputeUnitPrice(transactionMessage) === computeUnitPrice) {
        return transactionMessage;
    }

    // Add or replace the compute unit price instruction with the new price.
    const newInstruction = getSetComputeUnitPriceInstruction(computeUnitPrice);
    return existingIndex === -1
        ? (appendTransactionMessageInstruction(newInstruction, transactionMessage) as TTransactionMessage)
        : replaceTransactionMessageInstruction(existingIndex, newInstruction, transactionMessage);
}
