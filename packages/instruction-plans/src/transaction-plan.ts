import { SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN, SolanaError } from '@solana/errors';
import { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';

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
    planType: 'transactionPlan';
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
    planType: 'transactionPlan';
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
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
> = Readonly<{
    kind: 'single';
    message: TTransactionMessage;
    planType: 'transactionPlan';
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
    plans: (TransactionPlan | (TransactionMessage & TransactionMessageWithFeePayer))[],
): ParallelTransactionPlan {
    return Object.freeze({ kind: 'parallel', planType: 'transactionPlan', plans: parseSingleTransactionPlans(plans) });
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
    plans: (TransactionPlan | (TransactionMessage & TransactionMessageWithFeePayer))[],
): SequentialTransactionPlan & { divisible: true } {
    return Object.freeze({
        divisible: true,
        kind: 'sequential',
        planType: 'transactionPlan',
        plans: parseSingleTransactionPlans(plans),
    });
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
    plans: (TransactionPlan | (TransactionMessage & TransactionMessageWithFeePayer))[],
): SequentialTransactionPlan & { divisible: false } {
    return Object.freeze({
        divisible: false,
        kind: 'sequential',
        planType: 'transactionPlan',
        plans: parseSingleTransactionPlans(plans),
    });
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
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer = TransactionMessage &
        TransactionMessageWithFeePayer,
>(transactionMessage: TTransactionMessage): SingleTransactionPlan<TTransactionMessage> {
    return Object.freeze({ kind: 'single', message: transactionMessage, planType: 'transactionPlan' });
}

function parseSingleTransactionPlans(
    plans: (TransactionPlan | (TransactionMessage & TransactionMessageWithFeePayer))[],
): TransactionPlan[] {
    return plans.map(plan => ('kind' in plan ? plan : singleTransactionPlan(plan)));
}

/**
 * Checks if the given value is a {@link TransactionPlan}.
 *
 * This type guard checks the `planType` property to determine if the value
 * is a transaction plan. This is useful when you have a value that could be
 * an {@link InstructionPlan}, {@link TransactionPlan}, or {@link TransactionPlanResult}
 * and need to narrow the type.
 *
 * @param value - The value to check.
 * @return `true` if the value is a transaction plan, `false` otherwise.
 *
 * @example
 * ```ts
 * function processItem(item: InstructionPlan | TransactionPlan | TransactionPlanResult) {
 *   if (isTransactionPlan(item)) {
 *     // item is narrowed to TransactionPlan
 *     console.log(item.kind);
 *   }
 * }
 * ```
 *
 * @see {@link TransactionPlan}
 * @see {@link isInstructionPlan}
 * @see {@link isTransactionPlanResult}
 */
export function isTransactionPlan(value: unknown): value is TransactionPlan {
    return (
        typeof value === 'object' &&
        value !== null &&
        'planType' in value &&
        typeof value.planType === 'string' &&
        value.planType === 'transactionPlan'
    );
}

/**
 * Checks if the given transaction plan is a {@link SingleTransactionPlan}.
 *
 * @param plan - The transaction plan to check.
 * @return `true` if the plan is a single transaction plan, `false` otherwise.
 *
 * @example
 * ```ts
 * const plan: TransactionPlan = singleTransactionPlan(transactionMessage);
 *
 * if (isSingleTransactionPlan(plan)) {
 *   console.log(plan.message); // TypeScript knows this is a SingleTransactionPlan.
 * }
 * ```
 *
 * @see {@link SingleTransactionPlan}
 * @see {@link assertIsSingleTransactionPlan}
 */
export function isSingleTransactionPlan(plan: TransactionPlan): plan is SingleTransactionPlan {
    return plan.kind === 'single';
}

/**
 * Asserts that the given transaction plan is a {@link SingleTransactionPlan}.
 *
 * @param plan - The transaction plan to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN` if the plan is not a single transaction plan.
 *
 * @example
 * ```ts
 * const plan: TransactionPlan = singleTransactionPlan(transactionMessage);
 *
 * assertIsSingleTransactionPlan(plan);
 * console.log(plan.message); // TypeScript knows this is a SingleTransactionPlan.
 * ```
 *
 * @see {@link SingleTransactionPlan}
 * @see {@link isSingleTransactionPlan}
 */
export function assertIsSingleTransactionPlan(plan: TransactionPlan): asserts plan is SingleTransactionPlan {
    if (!isSingleTransactionPlan(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN, {
            actualKind: plan.kind,
            expectedKind: 'single',
            transactionPlan: plan,
        });
    }
}

/**
 * Checks if the given transaction plan is a {@link SequentialTransactionPlan}.
 *
 * @param plan - The transaction plan to check.
 * @return `true` if the plan is a sequential transaction plan, `false` otherwise.
 *
 * @example
 * ```ts
 * const plan: TransactionPlan = sequentialTransactionPlan([messageA, messageB]);
 *
 * if (isSequentialTransactionPlan(plan)) {
 *   console.log(plan.divisible); // TypeScript knows this is a SequentialTransactionPlan.
 * }
 * ```
 *
 * @see {@link SequentialTransactionPlan}
 * @see {@link assertIsSequentialTransactionPlan}
 */
export function isSequentialTransactionPlan(plan: TransactionPlan): plan is SequentialTransactionPlan {
    return plan.kind === 'sequential';
}

/**
 * Asserts that the given transaction plan is a {@link SequentialTransactionPlan}.
 *
 * @param plan - The transaction plan to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN` if the plan is not a sequential transaction plan.
 *
 * @example
 * ```ts
 * const plan: TransactionPlan = sequentialTransactionPlan([messageA, messageB]);
 *
 * assertIsSequentialTransactionPlan(plan);
 * console.log(plan.divisible); // TypeScript knows this is a SequentialTransactionPlan.
 * ```
 *
 * @see {@link SequentialTransactionPlan}
 * @see {@link isSequentialTransactionPlan}
 */
export function assertIsSequentialTransactionPlan(plan: TransactionPlan): asserts plan is SequentialTransactionPlan {
    if (!isSequentialTransactionPlan(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN, {
            actualKind: plan.kind,
            expectedKind: 'sequential',
            transactionPlan: plan,
        });
    }
}

/**
 * Checks if the given transaction plan is a non-divisible {@link SequentialTransactionPlan}.
 *
 * A non-divisible sequential plan requires all its transaction messages to be executed
 * atomically — usually in a transaction bundle.
 *
 * @param plan - The transaction plan to check.
 * @return `true` if the plan is a non-divisible sequential transaction plan, `false` otherwise.
 *
 * @example
 * ```ts
 * const plan: TransactionPlan = nonDivisibleSequentialTransactionPlan([messageA, messageB]);
 *
 * if (isNonDivisibleSequentialTransactionPlan(plan)) {
 *   // All transaction messages must be executed atomically.
 * }
 * ```
 *
 * @see {@link SequentialTransactionPlan}
 * @see {@link assertIsNonDivisibleSequentialTransactionPlan}
 */
export function isNonDivisibleSequentialTransactionPlan(
    plan: TransactionPlan,
): plan is SequentialTransactionPlan & { divisible: false } {
    return plan.kind === 'sequential' && plan.divisible === false;
}

/**
 * Asserts that the given transaction plan is a non-divisible {@link SequentialTransactionPlan}.
 *
 * A non-divisible sequential plan requires all its transaction messages to be executed
 * atomically — usually in a transaction bundle.
 *
 * @param plan - The transaction plan to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN` if the plan is not a non-divisible sequential transaction plan.
 *
 * @example
 * ```ts
 * const plan: TransactionPlan = nonDivisibleSequentialTransactionPlan([messageA, messageB]);
 *
 * assertIsNonDivisibleSequentialTransactionPlan(plan);
 * // All transaction messages must be executed atomically.
 * ```
 *
 * @see {@link SequentialTransactionPlan}
 * @see {@link isNonDivisibleSequentialTransactionPlan}
 */
export function assertIsNonDivisibleSequentialTransactionPlan(
    plan: TransactionPlan,
): asserts plan is SequentialTransactionPlan & { divisible: false } {
    if (!isNonDivisibleSequentialTransactionPlan(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN, {
            actualKind: plan.kind === 'sequential' ? 'divisible sequential' : plan.kind,
            expectedKind: 'non-divisible sequential',
            transactionPlan: plan,
        });
    }
}

/**
 * Checks if the given transaction plan is a {@link ParallelTransactionPlan}.
 *
 * @param plan - The transaction plan to check.
 * @return `true` if the plan is a parallel transaction plan, `false` otherwise.
 *
 * @example
 * ```ts
 * const plan: TransactionPlan = parallelTransactionPlan([messageA, messageB]);
 *
 * if (isParallelTransactionPlan(plan)) {
 *   console.log(plan.plans.length); // TypeScript knows this is a ParallelTransactionPlan.
 * }
 * ```
 *
 * @see {@link ParallelTransactionPlan}
 * @see {@link assertIsParallelTransactionPlan}
 */
export function isParallelTransactionPlan(plan: TransactionPlan): plan is ParallelTransactionPlan {
    return plan.kind === 'parallel';
}

/**
 * Asserts that the given transaction plan is a {@link ParallelTransactionPlan}.
 *
 * @param plan - The transaction plan to assert.
 * @throws Throws a {@link SolanaError} with code
 * `SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN` if the plan is not a parallel transaction plan.
 *
 * @example
 * ```ts
 * const plan: TransactionPlan = parallelTransactionPlan([messageA, messageB]);
 *
 * assertIsParallelTransactionPlan(plan);
 * console.log(plan.plans.length); // TypeScript knows this is a ParallelTransactionPlan.
 * ```
 *
 * @see {@link ParallelTransactionPlan}
 * @see {@link isParallelTransactionPlan}
 */
export function assertIsParallelTransactionPlan(plan: TransactionPlan): asserts plan is ParallelTransactionPlan {
    if (!isParallelTransactionPlan(plan)) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__UNEXPECTED_TRANSACTION_PLAN, {
            actualKind: plan.kind,
            expectedKind: 'parallel',
            transactionPlan: plan,
        });
    }
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
 * const singlePlans = flattenTransactionPlan(plan);
 * // Array of `SingleTransactionPlan` containing:
 * // messageA, messageB, messageC and messageD.
 *
 * @see {@link TransactionPlan}
 * @see {@link findTransactionPlan}
 * @see {@link everyTransactionPlan}
 * @see {@link transformTransactionPlan}
 * ```
 */
export function flattenTransactionPlan(transactionPlan: TransactionPlan): SingleTransactionPlan[] {
    if (transactionPlan.kind === 'single') {
        return [transactionPlan];
    }
    return transactionPlan.plans.flatMap(flattenTransactionPlan);
}

/**
 * Finds the first transaction plan in the tree that matches the given predicate.
 *
 * This function performs a depth-first search through the transaction plan tree,
 * returning the first plan that satisfies the predicate. It checks the root plan
 * first, then recursively searches through nested plans.
 *
 * @param transactionPlan - The transaction plan tree to search.
 * @param predicate - A function that returns `true` for the plan to find.
 * @return The first matching transaction plan, or `undefined` if no match is found.
 *
 * @example
 * Finding a non-divisible sequential plan.
 * ```ts
 * const plan = parallelTransactionPlan([
 *   sequentialTransactionPlan([messageA, messageB]),
 *   nonDivisibleSequentialTransactionPlan([messageC, messageD]),
 * ]);
 *
 * const nonDivisible = findTransactionPlan(
 *   plan,
 *   (p) => p.kind === 'sequential' && !p.divisible,
 * );
 * // Returns the non-divisible sequential plan containing messageC and messageD.
 * ```
 *
 * @example
 * Finding a specific single transaction plan.
 * ```ts
 * const plan = sequentialTransactionPlan([messageA, messageB, messageC]);
 *
 * const found = findTransactionPlan(
 *   plan,
 *   (p) => p.kind === 'single' && p.message === messageB,
 * );
 * // Returns the SingleTransactionPlan wrapping messageB.
 * ```
 *
 * @see {@link TransactionPlan}
 * @see {@link everyTransactionPlan}
 * @see {@link transformTransactionPlan}
 * @see {@link flattenTransactionPlan}
 */
export function findTransactionPlan(
    transactionPlan: TransactionPlan,
    predicate: (plan: TransactionPlan) => boolean,
): TransactionPlan | undefined {
    if (predicate(transactionPlan)) {
        return transactionPlan;
    }
    if (transactionPlan.kind === 'single') {
        return undefined;
    }
    for (const subPlan of transactionPlan.plans) {
        const foundPlan = findTransactionPlan(subPlan, predicate);
        if (foundPlan) {
            return foundPlan;
        }
    }
    return undefined;
}

/**
 * Checks if every transaction plan in the tree satisfies the given predicate.
 *
 * This function performs a depth-first traversal through the transaction plan tree,
 * returning `true` only if the predicate returns `true` for every plan in the tree
 * (including the root plan and all nested plans).
 *
 * @param transactionPlan - The transaction plan tree to check.
 * @param predicate - A function that returns `true` if the plan satisfies the condition.
 * @return `true` if every plan in the tree satisfies the predicate, `false` otherwise.
 *
 * @example
 * Checking if all plans are divisible.
 * ```ts
 * const plan = sequentialTransactionPlan([
 *   parallelTransactionPlan([messageA, messageB]),
 *   sequentialTransactionPlan([messageC, messageD]),
 * ]);
 *
 * const allDivisible = everyTransactionPlan(
 *   plan,
 *   (p) => p.kind !== 'sequential' || p.divisible,
 * );
 * // Returns true because all sequential plans are divisible.
 * ```
 *
 * @example
 * Checking if all single plans have a specific fee payer.
 * ```ts
 * const plan = parallelTransactionPlan([messageA, messageB, messageC]);
 *
 * const allUseSameFeePayer = everyTransactionPlan(
 *   plan,
 *   (p) => p.kind !== 'single' || p.message.feePayer.address === myFeePayer,
 * );
 * ```
 *
 * @see {@link TransactionPlan}
 * @see {@link findTransactionPlan}
 * @see {@link transformTransactionPlan}
 * @see {@link flattenTransactionPlan}
 */
export function everyTransactionPlan(
    transactionPlan: TransactionPlan,
    predicate: (plan: TransactionPlan) => boolean,
): boolean {
    if (!predicate(transactionPlan)) {
        return false;
    }
    if (transactionPlan.kind === 'single') {
        return true;
    }
    return transactionPlan.plans.every(p => everyTransactionPlan(p, predicate));
}

/**
 * Transforms a transaction plan tree using a bottom-up approach.
 *
 * This function recursively traverses the transaction plan tree, applying the
 * transformation function to each plan. The transformation is applied bottom-up,
 * meaning nested plans are transformed first, then the parent plans receive
 * the already-transformed children before being transformed themselves.
 *
 * All transformed plans are frozen using `Object.freeze` to ensure immutability.
 *
 * @param transactionPlan - The transaction plan tree to transform.
 * @param fn - A function that transforms each plan and returns a new plan.
 * @return A new transformed transaction plan tree.
 *
 * @example
 * Removing parallelism by converting parallel plans to sequential.
 * ```ts
 * const plan = parallelTransactionPlan([messageA, messageB, messageC]);
 *
 * const transformed = transformTransactionPlan(plan, (p) => {
 *   if (p.kind === 'parallel') {
 *     return sequentialTransactionPlan(p.plans);
 *   }
 *   return p;
 * });
 * ```
 *
 * @example
 * Updating the fee payer on all transaction messages.
 * ```ts
 * const plan = parallelTransactionPlan([messageA, messageB]);
 *
 * const transformed = transformTransactionPlan(plan, (p) => {
 *   if (p.kind === 'single') {
 *     return singleTransactionPlan({ ...p.message, feePayer: newFeePayer });
 *   }
 *   return p;
 * });
 * ```
 *
 * @see {@link TransactionPlan}
 * @see {@link findTransactionPlan}
 * @see {@link everyTransactionPlan}
 * @see {@link flattenTransactionPlan}
 */
export function transformTransactionPlan(
    transactionPlan: TransactionPlan,
    fn: (plan: TransactionPlan) => TransactionPlan,
): TransactionPlan {
    if (transactionPlan.kind === 'single') {
        return Object.freeze(fn(transactionPlan));
    }
    return Object.freeze(
        fn(
            Object.freeze({
                ...transactionPlan,
                plans: transactionPlan.plans.map(p => transformTransactionPlan(p, fn)),
            }),
        ),
    );
}
