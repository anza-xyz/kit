import type { Instruction } from '@solana/instructions';

import {
    type InstructionPlan,
    isInstructionPlan,
    sequentialInstructionPlan,
    singleInstructionPlan,
} from './instruction-plan';
import {
    isTransactionPlan,
    sequentialTransactionPlan,
    SingleTransactionPlan,
    singleTransactionPlan,
    TransactionPlan,
} from './transaction-plan';

/**
 * A flexible input type that can be used to create an {@link InstructionPlan}.
 *
 * This type accepts:
 * - A single {@link Instruction}.
 * - An existing {@link InstructionPlan}.
 * - An array of instructions and/or instruction plans.
 *
 * Use the {@link parseInstructionPlanInput} function to convert this input
 * into a proper {@link InstructionPlan}.
 *
 * @example
 * Using a single instruction.
 * ```ts
 * const input: InstructionPlanInput = myInstruction;
 * ```
 *
 * @example
 * Use as argument type in a function that will parse it into an InstructionPlan.
 * ```ts
 * function myFunction(input: InstructionPlanInput) {
 *   const plan = parseInstructionPlanInput(input);
 *   // Use the plan...
 * }
 * ```
 *
 * @see {@link parseInstructionPlanInput}
 * @see {@link InstructionPlan}
 */
export type InstructionPlanInput = Instruction | InstructionPlan | readonly (Instruction | InstructionPlan)[];

/**
 * Parses an {@link InstructionPlanInput} and returns an {@link InstructionPlan}.
 *
 * This function handles the following input types:
 * - A single {@link Instruction} is wrapped in a {@link SingleInstructionPlan}.
 * - An existing {@link InstructionPlan} is returned as-is.
 * - An array with a single element is unwrapped and parsed recursively.
 * - An array with multiple elements is wrapped in a divisible {@link SequentialInstructionPlan}.
 *
 * @param input - The input to parse into an instruction plan.
 * @return The parsed instruction plan.
 *
 * @example
 * Parsing a single instruction.
 * ```ts
 * const plan = parseInstructionPlanInput(myInstruction);
 * // Equivalent to: singleInstructionPlan(myInstruction)
 * ```
 *
 * @example
 * Parsing an array of instructions.
 * ```ts
 * const plan = parseInstructionPlanInput([instructionA, instructionB]);
 * // Equivalent to: sequentialInstructionPlan([instructionA, instructionB])
 * ```
 *
 * @example
 * Parsing a mixed array with nested plans.
 * ```ts
 * const plan = parseInstructionPlanInput([
 *   instructionA,
 *   parallelInstructionPlan([instructionB, instructionC]),
 * ]);
 * // Returns a sequential plan containing:
 * // - A single instruction plan for instructionA.
 * // - The parallel plan for instructionB and instructionC.
 * ```
 *
 * @example
 * Single-element arrays are unwrapped.
 * ```ts
 * const plan = parseInstructionPlanInput([myInstruction]);
 * // Equivalent to: singleInstructionPlan(myInstruction)
 * ```
 *
 * @see {@link InstructionPlanInput}
 * @see {@link InstructionPlan}
 */
export function parseInstructionPlanInput(input: InstructionPlanInput): InstructionPlan {
    if (Array.isArray(input) && input.length === 1) {
        return parseInstructionPlanInput(input[0]);
    }
    if (Array.isArray(input)) {
        return sequentialInstructionPlan(input.map(parseInstructionPlanInput));
    }
    return isInstructionPlan(input) ? input : singleInstructionPlan(input as Instruction);
}

/**
 * A flexible input type that can be used to create a {@link TransactionPlan}.
 *
 * This type accepts:
 * - A single {@link TransactionMessage} with a fee payer.
 * - An existing {@link TransactionPlan}.
 * - An array of transaction messages and/or transaction plans.
 *
 * Use the {@link parseTransactionPlanInput} function to convert this input
 * into a proper {@link TransactionPlan}.
 *
 * @example
 * Using a single transaction message.
 * ```ts
 * const input: TransactionPlanInput = myTransactionMessage;
 * ```
 *
 * @example
 * Use as argument type in a function that will parse it into a TransactionPlan.
 * ```ts
 * function myFunction(input: TransactionPlanInput) {
 *   const plan = parseTransactionPlanInput(input);
 *   // Use the plan...
 * }
 * ```
 *
 * @see {@link parseTransactionPlanInput}
 * @see {@link TransactionPlan}
 */
export type TransactionPlanInput =
    | SingleTransactionPlan['message']
    | TransactionPlan
    | readonly (SingleTransactionPlan['message'] | TransactionPlan)[];

/**
 * Parses a {@link TransactionPlanInput} and returns a {@link TransactionPlan}.
 *
 * This function handles the following input types:
 * - A single {@link TransactionMessage} is wrapped in a {@link SingleTransactionPlan}.
 * - An existing {@link TransactionPlan} is returned as-is.
 * - An array with a single element is unwrapped and parsed recursively.
 * - An array with multiple elements is wrapped in a divisible {@link SequentialTransactionPlan}.
 *
 * @param input - The input to parse into a transaction plan.
 * @return The parsed transaction plan.
 *
 * @example
 * Parsing a single transaction message.
 * ```ts
 * const plan = parseTransactionPlanInput(myTransactionMessage);
 * // Equivalent to: singleTransactionPlan(myTransactionMessage)
 * ```
 *
 * @example
 * Parsing an array of transaction messages.
 * ```ts
 * const plan = parseTransactionPlanInput([messageA, messageB]);
 * // Equivalent to: sequentialTransactionPlan([messageA, messageB])
 * ```
 *
 * @example
 * Parsing a mixed array with nested plans.
 * ```ts
 * const plan = parseTransactionPlanInput([
 *   messageA,
 *   parallelTransactionPlan([messageB, messageC]),
 * ]);
 * // Returns a sequential plan containing:
 * // - A single transaction plan for messageA.
 * // - The parallel plan for messageB and messageC.
 * ```
 *
 * @example
 * Single-element arrays are unwrapped.
 * ```ts
 * const plan = parseTransactionPlanInput([myTransactionMessage]);
 * // Equivalent to: singleTransactionPlan(myTransactionMessage)
 * ```
 *
 * @see {@link TransactionPlanInput}
 * @see {@link TransactionPlan}
 */
export function parseTransactionPlanInput(input: TransactionPlanInput): TransactionPlan {
    if (Array.isArray(input) && input.length === 1) {
        return parseTransactionPlanInput(input[0]);
    }
    if (Array.isArray(input)) {
        return sequentialTransactionPlan(input.map(item => parseTransactionPlanInput(item)));
    }
    return isTransactionPlan(input) ? input : singleTransactionPlan(input as SingleTransactionPlan['message']);
}
