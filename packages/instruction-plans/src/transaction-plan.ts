import { BaseTransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';

/**
 * A set of transaction messages with constraints on how they can be executed.
 *
 * This is structured as a recursive tree of plans to allow for
 * parallel execution, sequential execution and combinations of both.
 *
 * Namely, the following plans are supported:
 * - {@link SingleTransactionPlan} - A plan that contains a single transaction message.
 *   This is the simplest leaf in this tree.
 * - {@link ParallelTransactionPlan} - A plan that contains other plans that
 *   can be executed in parallel.
 * - {@link SequentialTransactionPlan} - A plan that contains other plans that
 *   must be executed sequentially. It also defines whether the plan is divisible
 *   meaning that transaction messages inside it can be split into separate batches.
 *
 * Helpers are provided for each of these plans to make it easier to create them.
 *
 * @example
 * ```ts
 * const myTransactionPlan: TransactionPlan = parallelTransactionPlan([
 *   sequentialTransactionPlan([messageA, messageB]),
 *   messageC,
 * ]);
 * ```
 *
 * @see {@link SingleTransactionPlan}
 * @see {@link ParallelTransactionPlan}
 * @see {@link SequentialTransactionPlan}
 */
export type TransactionPlan = ParallelTransactionPlan | SequentialTransactionPlan | SingleTransactionPlan;

/**
 * A plan wrapping other plans that must be executed sequentially.
 *
 * It also defines whether nested plans are divisible — meaning that
 * the transaction messages inside them can be split into separate batches.
 * When `divisible` is `false`, the transaction messages inside the plan should
 * all be executed atomically — usually in a transaction bundle.
 *
 * You may use the {@link sequentialTransactionPlan} and {@link nonDivisibleSequentialTransactionPlan}
 * helpers to create objects of this type.
 *
 * @example
 * Simple sequential plan with two transaction messages.
 * ```ts
 * const plan = sequentialTransactionPlan([messageA, messageB]);
 * plan satisfies SequentialTransactionPlan;
 * ```
 *
 * @example
 * Non-divisible sequential plan with two transaction messages.
 * ```ts
 * const plan = nonDivisibleSequentialTransactionPlan([messageA, messageB]);
 * plan satisfies SequentialTransactionPlan & { divisible: false };
 * ```
 *
 * @example
 * Sequential plan with nested parallel plans.
 * Here, messages A and B can be executed in parallel, but they must both be finalized
 * before messages C and D can be sent — which can also be executed in parallel.
 * ```ts
 * const plan = sequentialTransactionPlan([
 *   parallelTransactionPlan([messageA, messageB]),
 *   parallelTransactionPlan([messageC, messageD]),
 * ]);
 * ```
 *
 * @see {@link sequentialTransactionPlan}
 * @see {@link nonDivisibleSequentialTransactionPlan}
 */
export type SequentialTransactionPlan = Readonly<{
    divisible: boolean;
    kind: 'sequential';
    plans: TransactionPlan[];
}>;

/**
 * A plan wrapping other plans that can be executed in parallel.
 *
 * This means direct children of this plan can be executed in separate
 * parallel transactions without causing any side effects.
 * However, the children themselves can define additional constraints
 * for that specific branch of the tree — such as the {@link SequentialTransactionPlan}.
 *
 * You may use the {@link parallelTransactionPlan} helper to create objects of this type.
 *
 * @example
 * Simple parallel plan with two transaction messages.
 * ```ts
 * const plan = parallelTransactionPlan([messageA, messageB]);
 * plan satisfies ParallelTransactionPlan;
 * ```
 *
 * @example
 * Parallel plan with nested sequential plans.
 * Here, messages A and B must be executed sequentially and so must messages C and D,
 * but both pairs can be executed in parallel.
 * ```ts
 * const plan = parallelTransactionPlan([
 *   sequentialTransactionPlan([messageA, messageB]),
 *   sequentialTransactionPlan([messageC, messageD]),
 * ]);
 * plan satisfies ParallelTransactionPlan;
 * ```
 *
 * @see {@link parallelTransactionPlan}
 */
export type ParallelTransactionPlan = Readonly<{
    kind: 'parallel';
    plans: TransactionPlan[];
}>;

/**
 * A plan that contains a single transaction message.
 *
 * This is a simple transaction message wrapper that transforms a message into a plan.
 *
 * You may use the {@link singleTransactionPlan} helper to create objects of this type.
 *
 * @example
 * ```ts
 * const plan = singleTransactionPlan(transactionMessage);
 * plan satisfies SingleTransactionPlan;
 * ```
 *
 * @see {@link singleTransactionPlan}
 */
export type SingleTransactionPlan<
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithFeePayer = BaseTransactionMessage &
        TransactionMessageWithFeePayer,
> = Readonly<{
    kind: 'single';
    message: TTransactionMessage;
}>;

/**
 * Creates a {@link ParallelTransactionPlan} from an array of nested plans.
 *
 * It can accept {@link TransactionMessage} objects directly, which will be wrapped
 * in {@link SingleTransactionPlan | SingleTransactionPlans} automatically.
 *
 * @example
 * Using explicit {@link SingleTransactionPlan | SingleTransactionPlans}.
 * ```ts
 * const plan = parallelTransactionPlan([
 *   singleTransactionPlan(messageA),
 *   singleTransactionPlan(messageB),
 * ]);
 * ```
 *
 * @example
 * Using {@link TransactionMessage | TransactionMessages} directly.
 * ```ts
 * const plan = parallelTransactionPlan([messageA, messageB]);
 * ```
 *
 * @see {@link ParallelTransactionPlan}
 */
export function parallelTransactionPlan(
    plans: (TransactionPlan | (BaseTransactionMessage & TransactionMessageWithFeePayer))[],
): ParallelTransactionPlan {
    return Object.freeze({ kind: 'parallel', plans: parseSingleTransactionPlans(plans) });
}

/**
 * Creates a divisible {@link SequentialTransactionPlan} from an array of nested plans.
 *
 * It can accept {@link TransactionMessage} objects directly, which will be wrapped
 * in {@link SingleTransactionPlan | SingleTransactionPlans} automatically.
 *
 * @example
 * Using explicit {@link SingleTransactionPlan | SingleTransactionPlans}.
 * ```ts
 * const plan = sequentialTransactionPlan([
 *   singleTransactionPlan(messageA),
 *   singleTransactionPlan(messageB),
 * ]);
 * ```
 *
 * @example
 * Using {@link TransactionMessage | TransactionMessages} directly.
 * ```ts
 * const plan = sequentialTransactionPlan([messageA, messageB]);
 * ```
 *
 * @see {@link SequentialTransactionPlan}
 */
export function sequentialTransactionPlan(
    plans: (TransactionPlan | (BaseTransactionMessage & TransactionMessageWithFeePayer))[],
): SequentialTransactionPlan & { divisible: true } {
    return Object.freeze({ divisible: true, kind: 'sequential', plans: parseSingleTransactionPlans(plans) });
}

/**
 * Creates a non-divisible {@link SequentialTransactionPlan} from an array of nested plans.
 *
 * It can accept {@link TransactionMessage} objects directly, which will be wrapped
 * in {@link SingleTransactionPlan | SingleTransactionPlans} automatically.
 *
 * @example
 * Using explicit {@link SingleTransactionPlan | SingleTransactionPlans}.
 * ```ts
 * const plan = nonDivisibleSequentialTransactionPlan([
 *   singleTransactionPlan(messageA),
 *   singleTransactionPlan(messageB),
 * ]);
 * ```
 *
 * @example
 * Using {@link TransactionMessage | TransactionMessages} directly.
 * ```ts
 * const plan = nonDivisibleSequentialTransactionPlan([messageA, messageB]);
 * ```
 *
 * @see {@link SequentialTransactionPlan}
 */
export function nonDivisibleSequentialTransactionPlan(
    plans: (TransactionPlan | (BaseTransactionMessage & TransactionMessageWithFeePayer))[],
): SequentialTransactionPlan & { divisible: false } {
    return Object.freeze({ divisible: false, kind: 'sequential', plans: parseSingleTransactionPlans(plans) });
}

/**
 * Creates a {@link SingleTransactionPlan} from a {@link TransactionMessage} object.
 *
 * @example
 * ```ts
 * const plan = singleTransactionPlan(transactionMessage);
 * plan satisfies SingleTransactionPlan;
 * ```
 *
 * @see {@link SingleTransactionPlan}
 */
export function singleTransactionPlan<
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithFeePayer = BaseTransactionMessage &
        TransactionMessageWithFeePayer,
>(transactionMessage: TTransactionMessage): SingleTransactionPlan<TTransactionMessage> {
    return Object.freeze({ kind: 'single', message: transactionMessage });
}

function parseSingleTransactionPlans(
    plans: (TransactionPlan | (BaseTransactionMessage & TransactionMessageWithFeePayer))[],
): TransactionPlan[] {
    return plans.map(plan => ('kind' in plan ? plan : singleTransactionPlan(plan)));
}

/**
 * Retrieves all individual {@link SingleTransactionPlan} instances from a transaction plan tree.
 *
 * This function recursively traverses any nested structure of transaction plans and extracts
 * all the single transaction plans they contain. It's useful when you need to access all
 * the actual transaction messages that will be executed, regardless of their organization
 * in the plan tree (parallel or sequential).
 *
 * @param transactionPlan - The transaction plan to extract single plans from
 * @returns An array of all single transaction plans contained in the tree
 *
 * @example
 * ```ts
 * const plan = parallelTransactionPlan([
 *   sequentialTransactionPlan([messageA, messageB]),
 *   nonDivisibleSequentialTransactionPlan([messageC, messageD]),
 *   messageE,
 * ]);
 *
 * const singlePlans = getAllSingleTransactionPlans(plan);
 * // Array of `SingleTransactionPlan` containing:
 * // messageA, messageB, messageC and messageD.
 * ```
 */
export function getAllSingleTransactionPlans(transactionPlan: TransactionPlan): SingleTransactionPlan[] {
    if (transactionPlan.kind === 'single') {
        return [transactionPlan];
    }
    return transactionPlan.plans.flatMap(getAllSingleTransactionPlans);
}
