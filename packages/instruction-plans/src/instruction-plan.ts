import {
    SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN,
    SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE,
    SolanaError,
} from '@solana/errors';
import { Instruction } from '@solana/instructions';
import {
    appendTransactionMessageInstruction,
    BaseTransactionMessage,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import { getTransactionMessageSize, TRANSACTION_SIZE_LIMIT } from '@solana/transactions';

/**
 * A set of instructions with constraints on how they can be executed.
 *
 * This is structured as a recursive tree of plans in order to allow for
 * parallel execution, sequential execution and combinations of both.
 *
 * Namely the following plans are supported:
 * - {@link SingleInstructionPlan} - A plan that contains a single instruction.
 *   This is a simple instruction wrapper and the simplest leaf in this tree.
 * - {@link ParallelInstructionPlan} - A plan that contains other plans that
 *   can be executed in parallel.
 * - {@link SequentialInstructionPlan} - A plan that contains other plans that
 *   must be executed sequentially. It also defines whether the plan is divisible
 *   meaning that instructions inside it can be split into separate transactions.
 * - {@link MessagePackerInstructionPlan} - A plan that can dynamically pack
 *  instructions into transaction messages.
 *
 * Helpers are provided for each of these plans to make it easier to create them.
 *
 * @example
 * ```ts
 * const myInstructionPlan: InstructionPlan = parallelInstructionPlan([
 *    sequentialInstructionPlan([instructionA, instructionB]),
 *    instructionC,
 *    instructionD,
 * ]);
 * ```
 *
 * @see {@link SingleInstructionPlan}
 * @see {@link ParallelInstructionPlan}
 * @see {@link SequentialInstructionPlan}
 * @see {@link MessagePackerInstructionPlan}
 */
export type InstructionPlan =
    | MessagePackerInstructionPlan
    | ParallelInstructionPlan
    | SequentialInstructionPlan
    | SingleInstructionPlan;

/**
 * A plan wrapping other plans that must be executed sequentially.
 *
 * It also defines whether nested plans are divisible — meaning that
 * the instructions inside them can be split into separate transactions.
 * When `divisible` is `false`, the instructions inside the plan should
 * all be executed atomicly — either in a single transaction or in a
 * transaction bundle.
 *
 * You may use the {@link sequentialInstructionPlan} and {@link nonDivisibleSequentialInstructionPlan}
 * helpers to create objects of this type.
 *
 * @example Simple sequential plan with two instructions.
 * ```ts
 * const plan = sequentialInstructionPlan([instructionA, instructionB]);
 * plan satisfies SequentialInstructionPlan;
 * ```
 *
 * @example Non-divisible sequential plan with two instructions.
 * ```ts
 * const plan = nonDivisibleSequentialInstructionPlan([instructionA, instructionB]);
 * plan satisfies SequentialInstructionPlan & { divisible: false };
 * ```
 *
 * @example Sequential plan with nested parallel plans.
 * Here, instructions A and B can be executed in parallel, but they must both be finalized
 * before instructions C and D can be sent — which can also be executed in parallel.
 * ```ts
 * const plan = sequentialInstructionPlan([
 *   parallelInstructionPlan([instructionA, instructionB]),
 *   parallelInstructionPlan([instructionC, instructionD]),
 * ]);
 * plan satisfies SequentialInstructionPlan & { divisible: false };
 * ```
 *
 * @see {@link sequentialInstructionPlan}
 * @see {@link nonDivisibleSequentialInstructionPlan}
 */
export type SequentialInstructionPlan = Readonly<{
    divisible: boolean;
    kind: 'sequential';
    plans: InstructionPlan[];
}>;

/**
 * A plan wrapping other plans that can be executed in parallel.
 *
 * This means direct children of this plan can be executed in separate
 * parallel transactions without consequence.
 * However, the children themselves can define additional constraints
 * for that specific branch of the tree — such as the {@link SequentialInstructionPlan}.
 *
 * You may use the {@link parallelInstructionPlan} helper to create objects of this type.
 *
 * @example Simple parallel plan with two instructions.
 * ```ts
 * const plan = parallelInstructionPlan([instructionA, instructionB]);
 * plan satisfies ParallelInstructionPlan;
 * ```
 *
 * @example Parallel plan with nested sequential plans.
 * Here, instructions A and B must be executed sequentially and so must instructions C and D,
 * but both pairs can be executed in parallel.
 * ```ts
 * const plan = parallelInstructionPlan([
 *   sequentialInstructionPlan([instructionA, instructionB]),
 *   sequentialInstructionPlan([instructionC, instructionD]),
 * ]);
 * plan satisfies ParallelInstructionPlan;
 * ```
 *
 * @see {@link parallelInstructionPlan}
 */
export type ParallelInstructionPlan = Readonly<{
    kind: 'parallel';
    plans: InstructionPlan[];
}>;

/**
 * A plan that contains a single instruction.
 *
 * This is a simple instruction wrapper that transforms an instruction into a plan.
 *
 * You may use the {@link singleInstructionPlan} helper to create objects of this type.
 *
 * @example
 * ```ts
 * const plan = singleInstructionPlan(instructionA);
 * plan satisfies SingleInstructionPlan;
 * ```
 *
 * @see {@link singleInstructionPlan}
 */
export type SingleInstructionPlan<TInstruction extends Instruction = Instruction> = Readonly<{
    instruction: TInstruction;
    kind: 'single';
}>;

/**
 * A plan that can dynamically pack instructions into transaction messages.
 *
 * This plan provides a {@link MessagePacker} via the `getMessagePacker`
 * method, which enables instructions to be dynamically packed into the
 * provided transaction message until there are no more instructions to pack.
 * The returned {@link MessagePacker} offers a `packMessageToCapacity(message)`
 * method that packs the provided message — when possible — and a `done()` method
 * that checks whether there are more instructions to pack.
 *
 * Several helper functions are provided to create objects of this type such as
 * {@link getLinearMessagePackerInstructionPlan} or {@link getMessagePackerInstructionPlanFromInstructions}.
 *
 * @example An message packer plan for a write instruction that uses as many bytes as possible.
 * ```ts
 * const plan = getLinearMessagePackerInstructionPlan({
 *   totalLength: dataToWrite.length,
 *   getInstruction: (offset, length) =>
 *     getWriteInstruction({
 *       offset,
 *       data: dataToWrite.slice(offset, offset + length),
 *     }),
 * });
 * plan satisfies MessagePackerInstructionPlan;
 * ```
 *
 * @example A message packer plan for multiple realloc instructions.
 * ```ts
 * const plan = getReallocMessagePackerInstructionPlan({
 *   totalSize: additionalDataSize,
 *   getInstruction: (size) => getExtendInstruction({ length: size }),
 * });
 * plan satisfies MessagePackerInstructionPlan;
 * ```
 *
 * @example Using a message packer plan.
 * ```ts
 * let plan: MessagePackerInstructionPlan;
 * const messagePacker = plan.getMessagePacker();
 *
 * while (!messagePacker.done()) {
 *   try {
 *     transactionMessage = messagePacker.packMessageToCapacity(transactionMessage);
 *   } catch (error) {
 *     // The current transaction message cannot be used to pack this plan.
 *     // We should create a new one and try again.
 *   }
 * }
 * ```
 *
 * @see {@link getLinearMessagePackerInstructionPlan}
 * @see {@link getMessagePackerInstructionPlanFromInstructions}
 * @see {@link getReallocMessagePackerInstructionPlan}
 */
export type MessagePackerInstructionPlan = Readonly<{
    getMessagePacker: () => MessagePacker;
    kind: 'messagePacker';
}>;

/**
 * The message packer returned by the {@link MessagePackerInstructionPlan}.
 *
 * It offers a `packMessageToCapacity(transactionMessage)` method that packs as many instructions
 * as possible into the provided transaction message, while still being able to fit into the
 * transaction size limit. It returns the updated transaction message with the packed instructions
 * or throws an error if the current transaction message cannot accommodate this plan.
 *
 * The `done()` method checks whether there are more instructions to pack into
 * transaction messages.
 *
 * @example
 * ```ts
 * let plan: MessagePackerInstructionPlan;
 * const messagePacker = plan.getMessagePacker();
 *
 * while (!messagePacker.done()) {
 *   try {
 *     transactionMessage = messagePacker.packMessageToCapacity(transactionMessage);
 *   } catch (error) {
 *     // The current transaction message cannot be used to pack this plan.
 *     // We should create a new one and try again.
 *   }
 * }
 * ```
 *
 * @see {@link MessagePackerInstructionPlan}
 */
export type MessagePacker = Readonly<{
    /** Checks whether the message packer has more instructions to pack into transaction messages. */
    done: () => boolean;
    /**
     * Packs the provided transaction message with instructions or throws if not possible.
     *
     * @throws {@link SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN}
     *   if the provided transaction message cannot be used to fill the next instructions.
     * @throws {@link SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE}
     *   if the message packer is already done and no more instructions can be packed.
     */
    packMessageToCapacity: (
        transactionMessage: BaseTransactionMessage & TransactionMessageWithFeePayer,
    ) => BaseTransactionMessage & TransactionMessageWithFeePayer;
}>;

/**
 * Creates a {@link ParallelInstructionPlan} from an array of nested plans.
 *
 * It can accept {@link Instruction} objects directly, which will be wrapped
 * in {@link SingleInstructionPlan | SingleInstructionPlans} automatically.
 *
 * @example Using explicit {@link SingleInstructionPlan | SingleInstructionPlans}.
 * ```ts
 * const plan = parallelInstructionPlan([
 *   singleInstructionPlan(instructionA),
 *   singleInstructionPlan(instructionB),
 * ]);
 * ```
 *
 * @example Using {@link Instruction | Instructions} directly.
 * ```ts
 * const plan = parallelInstructionPlan([instructionA, instructionB]);
 * ```
 *
 * @see {@link ParallelInstructionPlan}
 */
export function parallelInstructionPlan(plans: (Instruction | InstructionPlan)[]): ParallelInstructionPlan {
    return Object.freeze({
        kind: 'parallel',
        plans: parseSingleInstructionPlans(plans),
    });
}

/**
 * Creates a divisible {@link SequentialInstructionPlan} from an array of nested plans.
 *
 * It can accept {@link Instruction} objects directly, which will be wrapped
 * in {@link SingleInstructionPlan | SingleInstructionPlans} automatically.
 *
 * @example Using explicit {@link SingleInstructionPlan | SingleInstructionPlans}.
 * ```ts
 * const plan = sequentialInstructionPlan([
 *   singleInstructionPlan(instructionA),
 *   singleInstructionPlan(instructionB),
 * ]);
 * ```
 *
 * @example Using {@link Instruction | Instructions} directly.
 * ```ts
 * const plan = sequentialInstructionPlan([instructionA, instructionB]);
 * ```
 *
 * @see {@link SequentialInstructionPlan}
 */
export function sequentialInstructionPlan(
    plans: (Instruction | InstructionPlan)[],
): SequentialInstructionPlan & { divisible: true } {
    return Object.freeze({
        divisible: true,
        kind: 'sequential',
        plans: parseSingleInstructionPlans(plans),
    });
}

/**
 * Creates a non-divisible {@link SequentialInstructionPlan} from an array of nested plans.
 *
 * It can accept {@link Instruction} objects directly, which will be wrapped
 * in {@link SingleInstructionPlan | SingleInstructionPlans} automatically.
 *
 * @example Using explicit {@link SingleInstructionPlan | SingleInstructionPlans}.
 * ```ts
 * const plan = nonDivisibleSequentialInstructionPlan([
 *   singleInstructionPlan(instructionA),
 *   singleInstructionPlan(instructionB),
 * ]);
 * ```
 *
 * @example Using {@link Instruction | Instructions} directly.
 * ```ts
 * const plan = nonDivisibleSequentialInstructionPlan([instructionA, instructionB]);
 * ```
 *
 * @see {@link SequentialInstructionPlan}
 */
export function nonDivisibleSequentialInstructionPlan(
    plans: (Instruction | InstructionPlan)[],
): SequentialInstructionPlan & { divisible: false } {
    return Object.freeze({
        divisible: false,
        kind: 'sequential',
        plans: parseSingleInstructionPlans(plans),
    });
}

/**
 * Creates a {@link SingleInstructionPlan} from an {@link Instruction} object.
 *
 * @example
 * ```ts
 * const plan = singleInstructionPlan(instructionA);
 * ```
 *
 * @see {@link SingleInstructionPlan}
 */
export function singleInstructionPlan(instruction: Instruction): SingleInstructionPlan {
    return Object.freeze({ instruction, kind: 'single' });
}

function parseSingleInstructionPlans(plans: (Instruction | InstructionPlan)[]): InstructionPlan[] {
    return plans.map(plan => ('kind' in plan ? plan : singleInstructionPlan(plan)));
}

/**
 * Creates a {@link MessagePackerInstructionPlan} that packs instructions
 * such that each instruction consumes as many bytes as possible from the given
 * `totalLength` while still being able to fit into the given transaction messages.
 *
 * This is particularly useful for instructions that write data to accounts and must
 * span multiple transactions due to their size limit.
 *
 * This message packer will first call `getInstruction` with a length of zero to
 * determine the base size of the instruction before figuring out how many
 * additional bytes can be packed into the transaction message. That remaining space
 * will then be used to call `getInstruction` again with the appropriate length.
 *
 * @param getInstruction - A function that returns an instruction for a given offset and length.
 * @param totalLength - The total length of the data to write, in bytes.
 *
 * @example
 * ```ts
 * const plan = getLinearMessagePackerInstructionPlan({
 *   totalLength: dataToWrite.length,
 *   getInstruction: (offset, length) =>
 *     getWriteInstruction({
 *       offset,
 *       data: dataToWrite.slice(offset, offset + length),
 *     }),
 * });
 * plan satisfies MessagePackerInstructionPlan;
 * ```
 *
 * @see {@link MessagePackerInstructionPlan}
 */
export function getLinearMessagePackerInstructionPlan({
    getInstruction,
    totalLength: totalBytes,
}: {
    getInstruction: (offset: number, length: number) => Instruction;
    totalLength: number;
}): MessagePackerInstructionPlan {
    return Object.freeze({
        getMessagePacker: () => {
            let offset = 0;
            return Object.freeze({
                done: () => offset >= totalBytes,
                packMessageToCapacity: (message: BaseTransactionMessage & TransactionMessageWithFeePayer) => {
                    if (offset >= totalBytes) {
                        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE);
                    }

                    const messageSizeWithBaseInstruction = getTransactionMessageSize(
                        appendTransactionMessageInstruction(getInstruction(offset, 0), message),
                    );
                    const freeSpace =
                        TRANSACTION_SIZE_LIMIT -
                        messageSizeWithBaseInstruction /* Includes the base instruction (length: 0). */ -
                        1; /* Leeway for shortU16 numbers in transaction headers. */

                    if (freeSpace <= 0) {
                        const messageSize = getTransactionMessageSize(message);
                        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, {
                            // (+1) We need to pack at least one byte of data otherwise
                            // there is no point packing the base instruction alone.
                            numBytesRequired: messageSizeWithBaseInstruction - messageSize + 1,
                            // (-1) Leeway for shortU16 numbers in transaction headers.
                            numFreeBytes: TRANSACTION_SIZE_LIMIT - messageSize - 1,
                        });
                    }

                    const length = Math.min(totalBytes - offset, freeSpace);
                    const instruction = getInstruction(offset, length);
                    offset += length;
                    return appendTransactionMessageInstruction(instruction, message);
                },
            });
        },
        kind: 'messagePacker',
    });
}

/**
 * Creates a {@link MessagePackerInstructionPlan} from a list of instructions.
 *
 * This can be useful to prepare a set of instructions that can be iterated over
 * — e.g. to pack a list of instructions that gradually reallocate the size of an account
 * one `REALLOC_LIMIT` (10'240 bytes) at a time.
 *
 * @example
 * ```ts
 * const plan = getMessagePackerInstructionPlanFromInstructions([
 *   instructionA,
 *   instructionB,
 *   instructionC,
 * ]);
 *
 * const messagePacker = plan.getMessagePacker();
 * firstTransactionMessage = messagePacker.packMessageToCapacity(firstTransactionMessage);
 * // Contains instruction A and instruction B.
 * secondTransactionMessage = messagePacker.packMessageToCapacity(secondTransactionMessage);
 * // Contains instruction C.
 * messagePacker.done(); // true
 * ```
 *
 * @see {@link MessagePackerInstructionPlan}
 * @see {@link getReallocMessagePackerInstructionPlan}
 */
export function getMessagePackerInstructionPlanFromInstructions<TInstruction extends Instruction = Instruction>(
    instructions: TInstruction[],
): MessagePackerInstructionPlan {
    return Object.freeze({
        getMessagePacker: () => {
            let instructionIndex = 0;
            return Object.freeze({
                done: () => instructionIndex >= instructions.length,
                packMessageToCapacity: (message: BaseTransactionMessage & TransactionMessageWithFeePayer) => {
                    if (instructionIndex >= instructions.length) {
                        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE);
                    }

                    const originalMessageSize = getTransactionMessageSize(message);

                    for (let index = instructionIndex; index < instructions.length; index++) {
                        message = appendTransactionMessageInstruction(instructions[index], message);
                        const messageSize = getTransactionMessageSize(message);

                        if (messageSize > TRANSACTION_SIZE_LIMIT) {
                            if (index === instructionIndex) {
                                throw new SolanaError(
                                    SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN,
                                    {
                                        numBytesRequired: messageSize - originalMessageSize,
                                        numFreeBytes: TRANSACTION_SIZE_LIMIT - originalMessageSize,
                                    },
                                );
                            }
                            instructionIndex = index;
                            return message;
                        }
                    }

                    instructionIndex = instructions.length;
                    return message;
                },
            });
        },
        kind: 'messagePacker',
    });
}

const REALLOC_LIMIT = 10_240;

/**
 * Creates a {@link MessagePackerInstructionPlan} that packs a list of realloc instructions.
 *
 * That is, it splits instruction by chunks of `REALLOC_LIMIT` (10'240) bytes until
 * the given total size is reached.
 *
 * @example
 * ```ts
 * const plan = getReallocMessagePackerInstructionPlan({
 *   totalSize: additionalDataSize,
 *   getInstruction: (size) => getExtendInstruction({ length: size }),
 * });
 * ```
 *
 * @see {@link MessagePackerInstructionPlan}
 */
export function getReallocMessagePackerInstructionPlan({
    getInstruction,
    totalSize,
}: {
    getInstruction: (size: number) => Instruction;
    totalSize: number;
}): MessagePackerInstructionPlan {
    const numberOfInstructions = Math.ceil(totalSize / REALLOC_LIMIT);
    const lastInstructionSize = totalSize % REALLOC_LIMIT;
    const instructions = new Array(numberOfInstructions)
        .fill(0)
        .map((_, i) => getInstruction(i === numberOfInstructions - 1 ? lastInstructionSize : REALLOC_LIMIT));

    return getMessagePackerInstructionPlanFromInstructions(instructions);
}
