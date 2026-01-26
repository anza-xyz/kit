import { SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_INSTRUCTION_PLAN_KIND, SolanaError } from '@solana/errors';
import { type Instruction } from '@solana/instructions';
import {
    appendTransactionMessageInstruction,
    appendTransactionMessageInstructions,
    TransactionMessage,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';

import { flattenInstructionPlan, InstructionPlan } from './instruction-plan';

/**
 * A helper type to append instructions to a transaction message
 * without losing type information about the current instructions.
 */

type AppendTransactionMessageInstructions<TTransactionMessage extends TransactionMessage> = ReturnType<
    typeof appendTransactionMessageInstructions<TTransactionMessage, Instruction[]>
>;

/**
 * Appends all instructions from an instruction plan to a transaction message.
 *
 * This function flattens the instruction plan into its leaf plans and sequentially
 * appends each instruction to the provided transaction message. It handles both
 * single instructions and message packer plans.
 *
 * Note that any {@link MessagePackerInstructionPlan} is assumed to only append
 * instructions. If it modifies other properties of the transaction message, the
 * type of the returned transaction message may not accurately reflect those changes.
 *
 * @typeParam TTransactionMessage - The type of transaction message being modified.
 *
 * @param transactionMessage - The transaction message to append instructions to.
 * @param instructionPlan - The instruction plan containing the instructions to append.
 * @returns The transaction message with all instructions from the plan appended.
 *
 * @example
 * Appending a simple instruction plan to a transaction message.
 * ```ts
 * import { appendTransactionMessageInstructionPlan } from '@solana/instruction-plans';
 * import { createTransactionMessage, setTransactionMessageFeePayer } from '@solana/transaction-messages';
 *
 * const message = setTransactionMessageFeePayer(feePayer, createTransactionMessage({ version: 0 }));
 * const plan = singleInstructionPlan(myInstruction);
 *
 * const messageWithInstructions = appendTransactionMessageInstructionPlan(message, plan);
 * ```
 *
 * @example
 * Appending a sequential instruction plan.
 * ```ts
 * const plan = sequentialInstructionPlan([instructionA, instructionB, instructionC]);
 * const messageWithInstructions = appendTransactionMessageInstructionPlan(message, plan);
 * ```
 *
 * @see {@link InstructionPlan}
 * @see {@link flattenInstructionPlan}
 */
export function appendTransactionMessageInstructionPlan<
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer,
>(
    instructionPlan: InstructionPlan,
    transactionMessage: TTransactionMessage,
): AppendTransactionMessageInstructions<TTransactionMessage> {
    type Out = AppendTransactionMessageInstructions<TTransactionMessage>;

    const leafInstructionPlans = flattenInstructionPlan(instructionPlan);

    return leafInstructionPlans.reduce(
        (messageSoFar, plan) => {
            const kind = plan.kind;
            if (kind === 'single') {
                return appendTransactionMessageInstruction(plan.instruction, messageSoFar) as unknown as Out;
            }
            if (kind === 'messagePacker') {
                const messagerPacker = plan.getMessagePacker();
                let nextMessage: Out = messageSoFar;
                while (!messagerPacker.done()) {
                    nextMessage = messagerPacker.packMessageToCapacity(nextMessage) as Out;
                }
                return nextMessage;
            }
            throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_INSTRUCTION_PLAN_KIND, {
                kind,
            });
        },
        transactionMessage as unknown as Out,
    );
}
