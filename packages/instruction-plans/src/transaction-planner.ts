import {
    isSolanaError,
    SOLANA_ERROR__INSTRUCTION_PLANS__EMPTY_INSTRUCTION_PLAN,
    SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN,
    SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_INSTRUCTION_PLAN_KIND,
    SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND,
    SolanaError,
} from '@solana/errors';
import { getAbortablePromise } from '@solana/promises';
import {
    appendTransactionMessageInstructions,
    BaseTransactionMessage,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import { getTransactionMessageSize, TRANSACTION_SIZE_LIMIT } from '@solana/transactions';

import {
    InstructionPlan,
    MessagePackerInstructionPlan,
    ParallelInstructionPlan,
    SequentialInstructionPlan,
    SingleInstructionPlan,
} from './instruction-plan';
import {
    getAllSingleTransactionPlans,
    nonDivisibleSequentialTransactionPlan,
    parallelTransactionPlan,
    sequentialTransactionPlan,
    SingleTransactionPlan,
    singleTransactionPlan,
    TransactionPlan,
} from './transaction-plan';

/**
 * Plans one or more transactions according to the provided instruction plan.
 *
 * @param instructionPlan - The instruction plan to be planned and executed.
 * @param config - Optional configuration object that can include an `AbortSignal` to cancel the planning process.
 *
 * @see {@link InstructionPlan}
 * @see {@link TransactionPlan}
 */
export type TransactionPlanner = (
    instructionPlan: InstructionPlan,
    config?: { abortSignal?: AbortSignal },
) => Promise<TransactionPlan>;

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

type CreateTransactionMessage = (config?: {
    abortSignal?: AbortSignal;
}) =>
    | Promise<BaseTransactionMessage & TransactionMessageWithFeePayer>
    | (BaseTransactionMessage & TransactionMessageWithFeePayer);

type OnTransactionMessageUpdated = (
    transactionMessage: BaseTransactionMessage & TransactionMessageWithFeePayer,
    config?: { abortSignal?: AbortSignal },
) =>
    | Promise<BaseTransactionMessage & TransactionMessageWithFeePayer>
    | (BaseTransactionMessage & TransactionMessageWithFeePayer);

/**
 * Configuration object for creating a new transaction planner.
 *
 * @see {@link createTransactionPlanner}
 */
export type TransactionPlannerConfig = {
    /** Called whenever a new transaction message is needed. */
    createTransactionMessage: CreateTransactionMessage;
    /**
     * Called whenever a transaction message is updated — e.g. new instructions were added.
     * This function must return the updated transaction message back — even if no changes were made.
     */
    onTransactionMessageUpdated?: OnTransactionMessageUpdated;
};

/**
 * Creates a new transaction planner based on the provided configuration.
 *
 * At the very least, the `createTransactionMessage` function must be provided.
 * This function is used to create new transaction messages whenever needed.
 *
 * Additionally, the `onTransactionMessageUpdated` function can be provided
 * to update transaction messages during the planning process. This function will
 * be called whenever a transaction message is updated, e.g. when new instructions
 * are added to a transaction message. It accepts the updated transaction message
 * and must return a transaction message back, even if no changes were made.
 *
 * @example
 * ```ts
 * const transactionPlanner = createTransactionPlanner({
 *   createTransactionMessage: () => pipe(
 *     createTransactionMessage({ version: 0 }),
 *     message => setTransactionMessageFeePayerSigner(mySigner, message),
 *   )
 * });
 * ```
 *
 * @see {@link TransactionPlannerConfig}
 */
export function createTransactionPlanner(config: TransactionPlannerConfig): TransactionPlanner {
    return async (instructionPlan, { abortSignal } = {}): Promise<TransactionPlan> => {
        const plan = await traverse(instructionPlan, {
            abortSignal,
            createTransactionMessage: config.createTransactionMessage,
            onTransactionMessageUpdated: config.onTransactionMessageUpdated ?? (msg => msg),
            parent: null,
            parentCandidates: [],
        });

        if (!plan) {
            throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__EMPTY_INSTRUCTION_PLAN);
        }

        return freezeTransactionPlan(plan);
    };
}

type MutableTransactionPlan = Mutable<TransactionPlan>;
type MutableSingleTransactionPlan = Mutable<SingleTransactionPlan>;

type TraverseContext = {
    abortSignal?: AbortSignal;
    createTransactionMessage: CreateTransactionMessage;
    onTransactionMessageUpdated: OnTransactionMessageUpdated;
    parent: InstructionPlan | null;
    parentCandidates: MutableSingleTransactionPlan[];
};

async function traverse(
    instructionPlan: InstructionPlan,
    context: TraverseContext,
): Promise<MutableTransactionPlan | null> {
    context.abortSignal?.throwIfAborted();
    const kind = instructionPlan.kind;
    switch (kind) {
        case 'sequential':
            return await traverseSequential(instructionPlan, context);
        case 'parallel':
            return await traverseParallel(instructionPlan, context);
        case 'single':
            return await traverseSingle(instructionPlan, context);
        case 'messagePacker':
            return await traverseMessagePacker(instructionPlan, context);
        default:
            instructionPlan satisfies never;
            throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_INSTRUCTION_PLAN_KIND, { kind });
    }
}

async function traverseSequential(
    instructionPlan: SequentialInstructionPlan,
    context: TraverseContext,
): Promise<MutableTransactionPlan | null> {
    let candidate: MutableSingleTransactionPlan | null = null;

    // Check if the sequential plan must fit entirely in its parent candidates
    // due to constraints like being inside a parallel plan or not being divisible.
    const mustEntirelyFitInParentCandidate =
        context.parent && (context.parent.kind === 'parallel' || !instructionPlan.divisible);

    // If so, try to fit the entire plan inside one of the parent candidates.
    if (mustEntirelyFitInParentCandidate) {
        const candidate = await selectAndMutateCandidate(context, context.parentCandidates, message =>
            fitEntirePlanInsideMessage(instructionPlan, message),
        );
        // If that's possible, we the candidate is mutated and we can return null.
        // Otherwise, we proceed with the normal traversal and no parent candidate.
        if (candidate) {
            return null;
        }
    } else {
        // Otherwise, we can use the first parent candidate, if any,
        // since we know it must be a divisible sequential plan.
        candidate = context.parentCandidates.length > 0 ? context.parentCandidates[0] : null;
    }

    const transactionPlans: TransactionPlan[] = [];
    for (const plan of instructionPlan.plans) {
        const transactionPlan = await traverse(plan, {
            ...context,
            parent: instructionPlan,
            parentCandidates: candidate ? [candidate] : [],
        });
        if (transactionPlan) {
            candidate = getSequentialCandidate(transactionPlan);
            const newPlans =
                transactionPlan.kind === 'sequential' && (transactionPlan.divisible || !instructionPlan.divisible)
                    ? transactionPlan.plans
                    : [transactionPlan];
            transactionPlans.push(...newPlans);
        }
    }

    // Wrap in a sequential plan or simplify.
    if (transactionPlans.length === 1) {
        return transactionPlans[0];
    }
    if (transactionPlans.length === 0) {
        return null;
    }
    return {
        divisible: instructionPlan.divisible,
        kind: 'sequential',
        plans: transactionPlans,
    };
}

async function traverseParallel(
    instructionPlan: ParallelInstructionPlan,
    context: TraverseContext,
): Promise<MutableTransactionPlan | null> {
    const candidates: MutableSingleTransactionPlan[] = [...context.parentCandidates];
    const transactionPlans: TransactionPlan[] = [];

    // Reorder children so message packer plans are last.
    const sortedChildren = Array.from(instructionPlan.plans).sort(
        (a, b) => Number(a.kind === 'messagePacker') - Number(b.kind === 'messagePacker'),
    );

    for (const plan of sortedChildren) {
        const transactionPlan = await traverse(plan, {
            ...context,
            parent: instructionPlan,
            parentCandidates: candidates,
        });
        if (transactionPlan) {
            candidates.push(...getParallelCandidates(transactionPlan));
            const newPlans = transactionPlan.kind === 'parallel' ? transactionPlan.plans : [transactionPlan];
            transactionPlans.push(...newPlans);
        }
    }

    // Wrap in a parallel plan or simplify.
    if (transactionPlans.length === 1) {
        return transactionPlans[0];
    }
    if (transactionPlans.length === 0) {
        return null;
    }
    return { kind: 'parallel', plans: transactionPlans };
}

async function traverseSingle(
    instructionPlan: SingleInstructionPlan,
    context: TraverseContext,
): Promise<MutableTransactionPlan | null> {
    const predicate = (message: BaseTransactionMessage & TransactionMessageWithFeePayer) =>
        appendTransactionMessageInstructions([instructionPlan.instruction], message);
    const candidate = await selectAndMutateCandidate(context, context.parentCandidates, predicate);
    if (candidate) {
        return null;
    }
    const message = await createNewMessage(context, predicate);
    return { kind: 'single', message };
}

async function traverseMessagePacker(
    instructionPlan: MessagePackerInstructionPlan,
    context: TraverseContext,
): Promise<MutableTransactionPlan | null> {
    const messagePacker = instructionPlan.getMessagePacker();
    const transactionPlans: SingleTransactionPlan[] = [];
    const candidates = [...context.parentCandidates];

    while (!messagePacker.done()) {
        const candidate = await selectAndMutateCandidate(context, candidates, messagePacker.packMessageToCapacity);
        if (!candidate) {
            const message = await createNewMessage(context, messagePacker.packMessageToCapacity);
            const newPlan: MutableSingleTransactionPlan = { kind: 'single', message };
            transactionPlans.push(newPlan);
        }
    }

    if (transactionPlans.length === 1) {
        return transactionPlans[0];
    }
    if (transactionPlans.length === 0) {
        return null;
    }
    if (context.parent?.kind === 'parallel') {
        return { kind: 'parallel', plans: transactionPlans };
    }
    return {
        divisible: context.parent?.kind === 'sequential' ? context.parent.divisible : true,
        kind: 'sequential',
        plans: transactionPlans,
    };
}

function getSequentialCandidate(latestPlan: MutableTransactionPlan): MutableSingleTransactionPlan | null {
    if (latestPlan.kind === 'single') {
        return latestPlan;
    }
    if (latestPlan.kind === 'sequential' && latestPlan.plans.length > 0) {
        return getSequentialCandidate(latestPlan.plans[latestPlan.plans.length - 1]);
    }
    return null;
}

function getParallelCandidates(latestPlan: TransactionPlan): MutableSingleTransactionPlan[] {
    return getAllSingleTransactionPlans(latestPlan);
}

async function selectAndMutateCandidate(
    context: Pick<TraverseContext, 'abortSignal' | 'onTransactionMessageUpdated'>,
    candidates: MutableSingleTransactionPlan[],
    predicate: (
        message: BaseTransactionMessage & TransactionMessageWithFeePayer,
    ) => BaseTransactionMessage & TransactionMessageWithFeePayer,
): Promise<MutableSingleTransactionPlan | null> {
    for (const candidate of candidates) {
        try {
            const message = await getAbortablePromise(
                Promise.resolve(
                    context.onTransactionMessageUpdated(predicate(candidate.message), {
                        abortSignal: context.abortSignal,
                    }),
                ),
                context.abortSignal,
            );
            if (getTransactionMessageSize(message) <= TRANSACTION_SIZE_LIMIT) {
                candidate.message = message;
                return candidate;
            }
        } catch (error) {
            if (isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN)) {
                // Try the next candidate.
            } else {
                throw error;
            }
        }
    }
    return null;
}

async function createNewMessage(
    context: Pick<TraverseContext, 'abortSignal' | 'createTransactionMessage' | 'onTransactionMessageUpdated'>,
    predicate: (
        message: BaseTransactionMessage & TransactionMessageWithFeePayer,
    ) => BaseTransactionMessage & TransactionMessageWithFeePayer,
): Promise<BaseTransactionMessage & TransactionMessageWithFeePayer> {
    const newMessage = await getAbortablePromise(
        Promise.resolve(context.createTransactionMessage({ abortSignal: context.abortSignal })),
        context.abortSignal,
    );
    const updatedMessage = await getAbortablePromise(
        Promise.resolve(
            context.onTransactionMessageUpdated(predicate(newMessage), { abortSignal: context.abortSignal }),
        ),
        context.abortSignal,
    );
    const updatedMessageSize = getTransactionMessageSize(updatedMessage);
    if (updatedMessageSize > TRANSACTION_SIZE_LIMIT) {
        const newMessageSize = getTransactionMessageSize(newMessage);
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, {
            numBytesRequired: updatedMessageSize - newMessageSize,
            numFreeBytes: TRANSACTION_SIZE_LIMIT - newMessageSize,
        });
    }
    return updatedMessage;
}

function freezeTransactionPlan(plan: MutableTransactionPlan): TransactionPlan {
    const kind = plan.kind;
    switch (kind) {
        case 'single':
            return singleTransactionPlan(plan.message);
        case 'sequential':
            return plan.divisible
                ? sequentialTransactionPlan(plan.plans.map(freezeTransactionPlan))
                : nonDivisibleSequentialTransactionPlan(plan.plans.map(freezeTransactionPlan));
        case 'parallel':
            return parallelTransactionPlan(plan.plans.map(freezeTransactionPlan));
        default:
            plan satisfies never;
            throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_TRANSACTION_PLAN_KIND, { kind });
    }
}

function fitEntirePlanInsideMessage(
    instructionPlan: InstructionPlan,
    message: BaseTransactionMessage & TransactionMessageWithFeePayer,
): BaseTransactionMessage & TransactionMessageWithFeePayer {
    let newMessage: BaseTransactionMessage & TransactionMessageWithFeePayer = message;

    const kind = instructionPlan.kind;
    switch (kind) {
        case 'sequential':
        case 'parallel':
            for (const plan of instructionPlan.plans) {
                newMessage = fitEntirePlanInsideMessage(plan, newMessage);
            }
            return newMessage;
        case 'single':
            newMessage = appendTransactionMessageInstructions([instructionPlan.instruction], message);
            // eslint-disable-next-line no-case-declarations
            const newMessageSize = getTransactionMessageSize(newMessage);
            if (newMessageSize > TRANSACTION_SIZE_LIMIT) {
                const baseMessageSize = getTransactionMessageSize(message);
                throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, {
                    numBytesRequired: newMessageSize - baseMessageSize,
                    numFreeBytes: TRANSACTION_SIZE_LIMIT - baseMessageSize,
                });
            }
            return newMessage;
        case 'messagePacker':
            // eslint-disable-next-line no-case-declarations
            const messagePacker = instructionPlan.getMessagePacker();
            while (!messagePacker.done()) {
                newMessage = messagePacker.packMessageToCapacity(message);
            }
            return newMessage;
        default:
            instructionPlan satisfies never;
            throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__INVALID_INSTRUCTION_PLAN_KIND, { kind });
    }
}
