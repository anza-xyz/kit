import { Instruction } from '@solana/instructions';
import { appendTransactionMessageInstruction, CompilableTransactionMessage } from '@solana/transaction-messages';
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
 * - {@link IterableInstructionPlan} - A plan that can be iterated over to retrieve
 *   instructions dynamically — based on the current transaction message being built.
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
 * @see {@link IterableInstructionPlan}
 */
export type InstructionPlan =
    | IterableInstructionPlan
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
 * @example
 * Simple sequential plan with two instructions.
 * ```ts
 * const plan = sequentialInstructionPlan([instructionA, instructionB]);
 * plan satisfies SequentialInstructionPlan;
 * ```
 *
 * @example
 * Non-divisible sequential plan with two instructions.
 * ```ts
 * const plan = nonDivisibleSequentialInstructionPlan([instructionA, instructionB]);
 * plan satisfies SequentialInstructionPlan & { divisible: false };
 * ```
 *
 * @example
 * Sequential plan with nested parallel plans.
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
 * parallel transactions without causing any side effects.
 * However, the children themselves can define additional constraints
 * for that specific branch of the tree — such as the {@link SequentialInstructionPlan}.
 *
 * You may use the {@link parallelInstructionPlan} helper to create objects of this type.
 *
 * @example
 * Simple parallel plan with two instructions.
 * ```ts
 * const plan = parallelInstructionPlan([instructionA, instructionB]);
 * plan satisfies ParallelInstructionPlan;
 * ```
 *
 * @example
 * Parallel plan with nested sequential plans.
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
 * A plan that can be iterated over to retrieve instructions dynamically.
 *
 * This plan provide an instruction iterator via the `getIterator` method,
 * which enables instructions to be created dynamically based on the
 * current transaction message being built. The returned {@link InstructionIterator}
 * offers a `next()` method that retrieves the next instruction and a `hasNext()` method
 * that checks whether there are more instructions to retrieve.
 *
 * Additionally, this plan provides a `getAll()` method that allows retrieving
 * all instructions at once, if possible. Otherwise, it returns `null`.
 * This is useful to assess whether the iterable plan can be fully included
 * in a candidate transaction.
 *
 * Several helper functions are provided to create objects of this type such as
 * {@link getLinearIterableInstructionPlan} or {@link getIterableInstructionPlanFromInstructions}.
 *
 * @example
 * An iterable plan for a write instruction that uses as many bytes as possible.
 * ```ts
 * const plan = getLinearIterableInstructionPlan({
 *   totalLength: dataToWrite.length,
 *   getInstruction: (offset, length) =>
 *     getWriteInstruction({
 *       offset,
 *       data: dataToWrite.slice(offset, offset + length),
 *     }),
 * });
 * plan satisfies IterableInstructionPlan;
 * ```
 *
 * @example
 * An iterable plan for multiple realloc instructions.
 * ```ts
 * const plan = getReallocIterableInstructionPlan({
 *   totalSize: additionalDataSize,
 *   getInstruction: (size) => getExtendInstruction({ length: size }),
 * });
 * plan satisfies IterableInstructionPlan;
 * ```
 *
 * @example
 * Using an iterable plan via its iterator.
 * ```ts
 * let plan: IterableInstructionPlan;
 * const iterator = plan.getIterator();
 *
 * while (iterator.hasNext()) {
 *   const instruction = iterator.next(transactionMessage);
 *   if (instruction === null) {
 *     // The instruction cannot be packed into the given transaction message.
 *     // The `next()` method should be tried again with a different transaction message.
 *     // This could be another candidate or a brand new transaction message.
 *   } else {
 *     // Pack the instruction into the given transaction message.
 *     transactionMessage = appendTransactionMessageInstruction(instruction, transactionMessage);
 *   }
 * }
 * ```
 *
 * @example
 * Get all instructions from an iterable plan at once.
 * ```ts
 * let plan: IterableInstructionPlan;
 * const iterator = plan.getIterator();
 * const instructions = plan.getAll();
 *
 * // Now we can try to pack all instructions into the transaction message
 * // to see if the whole plan can be included in a single transaction.
 * ```
 *
 * @see {@link getLinearIterableInstructionPlan}
 * @see {@link getIterableInstructionPlanFromInstructions}
 * @see {@link getReallocIterableInstructionPlan}
 */
export type IterableInstructionPlan<TInstruction extends Instruction = Instruction> = Readonly<{
    /** Get all the instructions in one go or return `null` if not possible */
    getAll: () => TInstruction[] | null;
    /** Get an iterator for the instructions. */
    getIterator: () => InstructionIterator<TInstruction>;
    kind: 'iterable';
}>;

/**
 * The iterator returned by the {@link IterableInstructionPlan}.
 *
 * It offers a `next(transactionMessage)` method that retrieves the next instruction
 * for the given transaction message or returns `null` if the instruction cannot be packed
 * into the transaction message. The `hasNext()` method checks whether there are more
 * instructions to retrieve.
 *
 * @example
 * ```ts
 * let plan: IterableInstructionPlan;
 * const iterator = plan.getIterator();
 *
 * while (iterator.hasNext()) {
 *   const instruction = iterator.next(transactionMessage);
 *   if (instruction === null) {
 *     // The instruction cannot be packed into the given transaction message.
 *     // The `next()` method should be tried again with a different transaction message.
 *     // This could be another candidate or a brand new transaction message.
 *   } else {
 *     // Pack the instruction into the given transaction message.
 *     transactionMessage = appendTransactionMessageInstruction(instruction, transactionMessage);
 *   }
 * }
 * ```
 *
 * @see {@link IterableInstructionPlan}
 */
export type InstructionIterator<TInstruction extends Instruction = Instruction> = Readonly<{
    /** Checks whether there are more instructions to retrieve. */
    hasNext: () => boolean;
    /** Get the next instruction for the given transaction message or return `null` if not possible. */
    next: (transactionMessage: CompilableTransactionMessage) => TInstruction | null;
}>;

/**
 * Creates a {@link ParallelInstructionPlan} from an array of nested plans.
 *
 * It can accept {@link Instruction} objects directly, which will be wrapped
 * in {@link SingleInstructionPlan | SingleInstructionPlans} automatically.
 *
 * @example
 * Using explicit {@link SingleInstructionPlan | SingleInstructionPlans}.
 * ```ts
 * const plan = parallelInstructionPlan([
 *   singleInstructionPlan(instructionA),
 *   singleInstructionPlan(instructionB),
 * ]);
 * ```
 *
 * @example
 * Using {@link Instruction | Instructions} directly.
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
 * @example
 * Using explicit {@link SingleInstructionPlan | SingleInstructionPlans}.
 * ```ts
 * const plan = sequentialInstructionPlan([
 *   singleInstructionPlan(instructionA),
 *   singleInstructionPlan(instructionB),
 * ]);
 * ```
 *
 * @example
 * Using {@link Instruction | Instructions} directly.
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
 * @example
 * Using explicit {@link SingleInstructionPlan | SingleInstructionPlans}.
 * ```ts
 * const plan = nonDivisibleSequentialInstructionPlan([
 *   singleInstructionPlan(instructionA),
 *   singleInstructionPlan(instructionB),
 * ]);
 * ```
 *
 * @example
 * Using {@link Instruction | Instructions} directly.
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
 * Creates an {@link IterableInstructionPlan} that generates a list of instructions
 * such that each instruction consumes as many bytes as possible from the given
 * `totalLength` while still being able to fit into the given transaction messages.
 *
 * This is particularly useful for instructions that write data to accounts and must
 * span multiple transactions due to their size limit.
 *
 * @param getInstruction - A function that returns an instruction for a given offset and length.
 * @param totalLength - The total length of the data to write, in bytes.
 *
 * @example
 * ```ts
 * const plan = getLinearIterableInstructionPlan({
 *   totalLength: dataToWrite.length,
 *   getInstruction: (offset, length) =>
 *     getWriteInstruction({
 *       offset,
 *       data: dataToWrite.slice(offset, offset + length),
 *     }),
 * });
 * plan satisfies IterableInstructionPlan;
 * ```
 *
 * @see {@link IterableInstructionPlan}
 */
export function getLinearIterableInstructionPlan({
    getInstruction,
    totalLength: totalBytes,
}: {
    getInstruction: (offset: number, length: number) => Instruction;
    totalLength: number;
}): IterableInstructionPlan {
    return Object.freeze({
        getAll: () => [getInstruction(0, totalBytes)],
        getIterator: () => {
            let offset = 0;
            return Object.freeze({
                hasNext: () => offset < totalBytes,
                next: (tx: CompilableTransactionMessage) => {
                    const baseTransactionSize = getTransactionMessageSize(
                        appendTransactionMessageInstruction(
                            getInstruction(offset, 0),
                            tx,
                        ) as CompilableTransactionMessage,
                    );

                    const remainingBytes = totalBytes - offset;
                    const maxLength =
                        TRANSACTION_SIZE_LIMIT -
                        baseTransactionSize -
                        1; /* Leeway for shortU16 numbers in transaction headers. */

                    if (maxLength <= 0 || remainingBytes <= 0) {
                        return null;
                    }

                    const length = Math.min(remainingBytes, maxLength);
                    const instruction = getInstruction(offset, length);
                    offset += length;
                    return instruction;
                },
            });
        },
        kind: 'iterable',
    });
}

/**
 * Creates a simple {@link IterableInstructionPlan} from a list of instructions.
 *
 * This can be useful to prepare a set of instructions that can be iterated over
 * — e.g. to pack a list of instructions that gradually reallocate the size of an account
 * one `REALLOC_LIMIT` (10'240 bytes) at a time.
 *
 * @example
 * ```ts
 * const plan = getIterableInstructionPlanFromInstructions([
 *   instructionA,
 *   instructionB,
 *   instructionC,
 * ]);
 *
 * const instructions = plan.getAll();
 * // [instructionA, instructionB, instructionC]
 *
 * const iterator = plan.getIterator();
 * iterator.next(transactionMessage); // instructionA
 * iterator.next(transactionMessage); // instructionB
 * iterator.next(transactionMessage); // instructionC
 * iterator.next(transactionMessage); // null (no more instructions)
 * ```
 *
 * @see {@link IterableInstructionPlan}
 * @see {@link getReallocIterableInstructionPlan}
 */
export function getIterableInstructionPlanFromInstructions<TInstruction extends Instruction = Instruction>(
    instructions: TInstruction[],
): IterableInstructionPlan<TInstruction> {
    return Object.freeze({
        getAll: () => instructions,
        getIterator: () => {
            let instructionIndex = 0;
            return Object.freeze({
                hasNext: () => instructionIndex < instructions.length,
                next: (tx: CompilableTransactionMessage) => {
                    if (instructionIndex >= instructions.length) {
                        return null;
                    }

                    const instruction = instructions[instructionIndex];
                    const transactionSize = getTransactionMessageSize(
                        appendTransactionMessageInstruction(instruction, tx) as CompilableTransactionMessage,
                    );

                    if (transactionSize > TRANSACTION_SIZE_LIMIT) {
                        return null;
                    }

                    instructionIndex++;
                    return instruction;
                },
            });
        },
        kind: 'iterable',
    });
}

const REALLOC_LIMIT = 10_240;

/**
 * Creates an {@link IterableInstructionPlan} that generates a list of realloc instructions.
 *
 * That is, it splits instruction by chunks of `REALLOC_LIMIT` (10'240) bytes until
 * the given total size is reached.
 *
 * @example
 * ```ts
 * const plan = getReallocIterableInstructionPlan({
 *   totalSize: additionalDataSize,
 *   getInstruction: (size) => getExtendInstruction({ length: size }),
 * });
 * ```
 *
 * @see {@link IterableInstructionPlan}
 */
export function getReallocIterableInstructionPlan({
    getInstruction,
    totalSize,
}: {
    getInstruction: (size: number) => Instruction;
    totalSize: number;
}): IterableInstructionPlan {
    const numberOfInstructions = Math.ceil(totalSize / REALLOC_LIMIT);
    const lastInstructionSize = totalSize % REALLOC_LIMIT;
    const instructions = new Array(numberOfInstructions)
        .fill(0)
        .map((_, i) => getInstruction(i === numberOfInstructions - 1 ? lastInstructionSize : REALLOC_LIMIT));

    return getIterableInstructionPlanFromInstructions(instructions);
}
