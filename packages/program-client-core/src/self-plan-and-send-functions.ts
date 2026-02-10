import type { InstructionPlan } from '@solana/instruction-plans';
import type { Instruction } from '@solana/instructions';
import type { ClientWithTransactionPlanning, ClientWithTransactionSending } from '@solana/plugin-interfaces';

type PlanTransaction = ClientWithTransactionPlanning['planTransaction'];
type PlanTransactions = ClientWithTransactionPlanning['planTransactions'];
type SendTransaction = ClientWithTransactionSending['sendTransaction'];
type SendTransactions = ClientWithTransactionSending['sendTransactions'];

/**
 * Methods that allow an instruction or instruction plan to plan and send itself.
 *
 * These methods are added to instruction or instruction plan objects via
 * {@link addSelfPlanAndSendFunctions}, enabling a fluent API where you can call
 * `.sendTransaction()` directly on an instruction without passing it to a separate function.
 *
 * @example
 * Sending a transfer instruction directly.
 * ```ts
 * const result = await getTransferInstruction({ source, destination, amount }).sendTransaction();
 * ```
 *
 * @example
 * Planning multiple transactions from an instruction plan.
 * ```ts
 * const plan = await getComplexInstructionPlan(/* ... *\/).planTransactions();
 * ```
 *
 * @see {@link addSelfPlanAndSendFunctions}
 */
export type SelfPlanAndSendFunctions = {
    /** Plans a single transaction. */
    planTransaction: (config?: Parameters<PlanTransaction>[1]) => ReturnType<PlanTransaction>;
    /** Plans one or more transactions. */
    planTransactions: (config?: Parameters<PlanTransactions>[1]) => ReturnType<PlanTransactions>;
    /** Sends a single transaction. */
    sendTransaction: (config?: Parameters<SendTransaction>[1]) => ReturnType<SendTransaction>;
    /** Sends one or more transactions. */
    sendTransactions: (config?: Parameters<SendTransactions>[1]) => ReturnType<SendTransactions>;
};

/**
 * Adds self-planning and self-sending methods to an instruction or instruction plan.
 *
 * This function augments the provided instruction or instruction plan with methods
 * that allow it to plan and send itself using the provided client. It enables a fluent API
 * where you can call methods like `.sendTransaction()` directly on the instruction.
 *
 * The function supports both synchronous inputs (instructions, instruction plans) and
 * promise-like inputs, making it suitable for use with async instruction builders.
 *
 * @typeParam TItem - The type of the instruction, instruction plan, or a promise resolving to one.
 *
 * @param client - A client that provides transaction planning and sending capabilities.
 * @param input - The instruction, instruction plan, or promise to augment with self-plan/send methods.
 * @returns The input augmented with {@link SelfPlanAndSendFunctions} methods.
 *
 * @example
 * Adding self-plan and send to a transfer instruction.
 * ```ts
 * import { addSelfPlanAndSendFunctions } from '@solana/program-client-core';
 *
 * const transferInstruction = addSelfPlanAndSendFunctions(
 *     client,
 *     getTransferInstruction({ payer, source, destination, amount })
 * );
 *
 * // Now you can send directly from the instruction.
 * const result = await transferInstruction.sendTransaction();
 * ```
 *
 * @example
 * Using with an async instruction builder.
 * ```ts
 * const asyncInstruction = addSelfPlanAndSendFunctions(
 *     client,
 *     fetchAndBuildInstruction(/* ... *\/)
 * );
 *
 * // The promise is augmented with self-plan/send methods.
 * const result = await asyncInstruction.sendTransaction();
 * ```
 *
 * @see {@link SelfPlanAndSendFunctions}
 */
export function addSelfPlanAndSendFunctions<
    TItem extends Instruction | InstructionPlan | PromiseLike<Instruction> | PromiseLike<InstructionPlan>,
>(
    client: ClientWithTransactionPlanning & ClientWithTransactionSending,
    input: TItem,
): SelfPlanAndSendFunctions & TItem {
    if (isPromiseLike(input)) {
        const newInput = input as SelfPlanAndSendFunctions & TItem;
        newInput.planTransaction = async config => await client.planTransaction(await input, config);
        newInput.planTransactions = async config => await client.planTransactions(await input, config);
        newInput.sendTransaction = async config => await client.sendTransaction(await input, config);
        newInput.sendTransactions = async config => await client.sendTransactions(await input, config);
        return newInput;
    }

    return Object.freeze(<SelfPlanAndSendFunctions & (Instruction | InstructionPlan)>{
        ...input,
        planTransaction: config => client.planTransaction(input, config),
        planTransactions: config => client.planTransactions(input, config),
        sendTransaction: config => client.sendTransaction(input, config),
        sendTransactions: config => client.sendTransactions(input, config),
    }) as unknown as SelfPlanAndSendFunctions & TItem;
}

function isPromiseLike(
    item: Instruction | InstructionPlan | PromiseLike<Instruction> | PromiseLike<InstructionPlan>,
): item is PromiseLike<Instruction> | PromiseLike<InstructionPlan> {
    return (
        !!item &&
        (typeof item === 'object' || typeof item === 'function') &&
        typeof (item as PromiseLike<unknown>).then === 'function'
    );
}
