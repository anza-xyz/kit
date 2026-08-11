/* eslint-disable @typescript-eslint/no-floating-promises */

import { Signature } from '@solana/keys';
import {
    setTransactionMessageLifetimeUsingBlockhash,
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import { compileTransaction, Transaction, TransactionWithBlockhashLifetime } from '@solana/transactions';

import {
    CanceledSingleTransactionPlanResult,
    createTransactionPlanExecutor,
    FailedSingleTransactionPlanResult,
    flattenTransactionPlanResult,
    passthroughFailedTransactionPlanExecution,
    SingleTransactionPlanResult,
    SuccessfulSingleTransactionPlanResult,
    summarizeTransactionPlanResult,
    type TransactionPlan,
    type TransactionPlanExecutor,
    type TransactionPlanResult,
    type TransactionPlanResultContextWithSignature,
} from '../index';

// [DESCRIBE] TransactionPlanExecutor
{
    // Its return type satisfies TransactionPlanResult.
    {
        const transactionPlan = null as unknown as TransactionPlan;
        const executor = null as unknown as TransactionPlanExecutor;
        const result = executor(transactionPlan);
        result satisfies Promise<TransactionPlanResult>;
    }

    // Its return type keeps track of the executor context.
    {
        type CustomContext = { customData: string };
        const transactionPlan = null as unknown as TransactionPlan;
        const executor = null as unknown as TransactionPlanExecutor<CustomContext>;
        const result = executor(transactionPlan);
        result satisfies Promise<TransactionPlanResult<CustomContext>>;
    }
}

// [DESCRIBE] createTransactionPlanExecutor
{
    // It can still return a signature or a full transaction, using the deprecated overload.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({} as Signature),
        });
        createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({} as Transaction),
        });
    }

    // It can return the context that a successful result should carry.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({ signature: {} as Signature }),
        });
        createTransactionPlanExecutor({
            executeTransactionMessage: () =>
                Promise.resolve({ signature: {} as Signature, transaction: {} as Transaction }),
        });
    }

    // A returned context needs no signature of its own; since `TContext` alone decides what a
    // context carries, one inferred from the return value drops the signature guarantee.
    {
        const executor = createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({ sent: true }),
        });
        executor satisfies TransactionPlanExecutor<{ sent: boolean }>;
    }

    // It requires a returned context to carry the signature when `TContext` guarantees one.
    {
        createTransactionPlanExecutor<TransactionPlanResultContextWithSignature>({
            // @ts-expect-error The returned context is missing the guaranteed `signature` property.
            executeTransactionMessage: () => Promise.resolve({ sent: true }),
        });
    }

    // It always receives a transaction message with fee payer.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: (_, message) => {
                message satisfies TransactionMessage & TransactionMessageWithFeePayer;
                return Promise.resolve({} as Transaction);
            },
        });
    }

    // It receives a base context by default.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: context => {
                context.message satisfies (TransactionMessage & TransactionMessageWithFeePayer) | undefined;
                context.transaction satisfies Transaction | undefined;
                context.signature satisfies Signature | undefined;
                // @ts-expect-error Populating the signature is the callback's job; it is absent on entry.
                context.signature satisfies Signature;
                return Promise.resolve({} as Signature);
            },
        });
    }

    // It removes undefined after assignment in the context.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: context => {
                // @ts-expect-error Initially, the context transaction may be undefined.
                context.transaction satisfies Transaction;
                context.transaction satisfies Transaction | undefined;
                const mySignedTransaction = {} as unknown as Transaction;
                context.transaction = mySignedTransaction;
                context.transaction satisfies Transaction;
                return Promise.resolve(context.transaction);
            },
        });
    }

    // It can infer a custom context from the callback, which is then assigned to the created TransactionPlanExecutor.
    {
        const executor = createTransactionPlanExecutor({
            executeTransactionMessage: (_: { custom?: string }) => {
                return Promise.resolve({} as Signature);
            },
        });
        executor satisfies TransactionPlanExecutor<{ custom?: string }>;
    }

    // A callback cannot demand that a custom property is already populated. A fresh context is
    // created for every single transaction plan, so anything the callback declares is its own job
    // to fill in. Supply the context as an explicit type argument to guarantee it on the result.
    {
        createTransactionPlanExecutor({
            // @ts-expect-error The context starts empty, so `custom` cannot be present on entry.
            executeTransactionMessage: (_: { custom: string }) => {
                return Promise.resolve({} as Signature);
            },
        });
    }

    // It can use a custom context with the base context, by intersecting one of the base context
    // types into the type argument. Nothing is added to `TContext` on the caller's behalf.
    {
        const executor = createTransactionPlanExecutor<TransactionPlanResultContextWithSignature & { custom: string }>({
            executeTransactionMessage: context => {
                context.custom satisfies string | undefined;
                // @ts-expect-error Populating the custom property is the callback's job; it is absent on entry.
                context.custom satisfies string;
                context.custom = 'value';
                context.custom satisfies string;
                context.message satisfies (TransactionMessage & TransactionMessageWithFeePayer) | undefined;
                context.transaction satisfies Transaction | undefined;
                context.signature satisfies Signature | undefined;
                // @ts-expect-error Populating the signature is the callback's job; it is absent on entry.
                context.signature satisfies Signature;
                return Promise.resolve({} as Signature);
            },
        });
        executor satisfies TransactionPlanExecutor<TransactionPlanResultContextWithSignature & { custom: string }>;
    }

    // A bare custom context gets exactly what it declared — no base properties are injected.
    {
        createTransactionPlanExecutor<{ custom: string }>({
            executeTransactionMessage: context => {
                context.custom satisfies string | undefined;
                // @ts-expect-error This context declares no `message`, so the executor does not add one.
                void context.message;
                return Promise.resolve({} as Signature);
            },
        });
    }

    // It can return a custom context.
    {
        const executor = createTransactionPlanExecutor<{ custom: string }>({
            executeTransactionMessage: () => Promise.resolve({ custom: 'custom value', signature: {} as Signature }),
        });
        executor satisfies TransactionPlanExecutor<{ custom: string }>;
    }

    // It requires a returned context to carry the custom context.
    {
        createTransactionPlanExecutor<{ custom: string }>({
            // @ts-expect-error The returned context is missing the `custom` property.
            executeTransactionMessage: () => Promise.resolve({ signature: {} as Signature }),
        });
    }

    // It transfers the lifetime to the compiled transaction.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: (_, message) => {
                const latestBlockhash = {} as unknown as Parameters<
                    typeof setTransactionMessageLifetimeUsingBlockhash
                >[0];
                const messageWithBlockhash = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message);
                messageWithBlockhash satisfies TransactionMessageWithBlockhashLifetime;
                const transaction = compileTransaction(messageWithBlockhash);
                transaction satisfies TransactionWithBlockhashLifetime;
                return Promise.resolve(transaction);
            },
        });
    }
}

// [DESCRIBE] passthroughFailedTransactionPlanExecution
{
    // It returns a single result when the provided promise expects a single result.
    {
        const promise = null as unknown as Promise<SingleTransactionPlanResult>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<SingleTransactionPlanResult>);
    }

    // It widens the result of successful single results to include all possible single results.
    {
        const promise = null as unknown as Promise<SuccessfulSingleTransactionPlanResult>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<SingleTransactionPlanResult>);
        // @ts-expect-error Can no longer expect successful result only.
        void (result satisfies Promise<SuccessfulSingleTransactionPlanResult>);
    }

    // It widens the result of canceled single results to include all possible single results.
    {
        const promise = null as unknown as Promise<CanceledSingleTransactionPlanResult>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<SingleTransactionPlanResult>);
        // @ts-expect-error Can no longer expect canceled result only.
        void (result satisfies Promise<CanceledSingleTransactionPlanResult>);
    }

    // It widens the result of failed single results to include all possible single results.
    {
        const promise = null as unknown as Promise<FailedSingleTransactionPlanResult>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<SingleTransactionPlanResult>);
        // @ts-expect-error Can no longer expect failed result only. It could be canceled too.
        void (result satisfies Promise<FailedSingleTransactionPlanResult>);
    }

    // It returns any TransactionPlanResult otherwise.
    {
        const promise = null as unknown as Promise<TransactionPlanResult>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<TransactionPlanResult>);
    }

    // It accepts a result carrying an entirely custom context, and preserves it.
    {
        const promise = null as unknown as Promise<SingleTransactionPlanResult<{ custom: string }>>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<SingleTransactionPlanResult<{ custom: string }>>);
    }
}

// [DESCRIBE] createTransactionPlanExecutor result contexts
{
    // Its results guarantee a signature by default, as they did before the context types were loosened.
    {
        const executor = createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({} as Signature),
        });
        void executor(null as unknown as TransactionPlan).then(result => {
            if (result.kind === 'single' && result.status === 'successful') {
                result.context.signature satisfies Signature;
            }
        });
    }

    // Its failed results guarantee nothing.
    {
        const executor = createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({} as Signature),
        });
        void executor(null as unknown as TransactionPlan).then(result => {
            if (result.kind === 'single' && result.status === 'failed') {
                result.context.signature satisfies Signature | undefined;
                // @ts-expect-error A failed result guarantees no signature.
                result.context.signature satisfies Signature;
            }
        });
    }

    // A custom context reports exactly what it declared. The signature guarantee comes from
    // intersecting it in, not from the executor adding it behind the caller's back.
    {
        const executor = createTransactionPlanExecutor<TransactionPlanResultContextWithSignature & { custom: string }>({
            executeTransactionMessage: context => {
                context.custom = 'value';
                return Promise.resolve({} as Signature);
            },
        });
        void executor(null as unknown as TransactionPlan).then(result => {
            if (result.kind === 'single' && result.status === 'successful') {
                result.context.signature satisfies Signature;
                result.context.custom satisfies string;
            }
        });
    }

    // A custom context that omits the signature does not get one back. The executor still
    // populates `context.signature` at runtime, but it makes no type-level promise the caller
    // did not ask for, which is what lets an executor be typed with no signature at all.
    {
        const executor = createTransactionPlanExecutor<{ custom: string }>({
            executeTransactionMessage: context => {
                context.custom = 'value';
                return Promise.resolve({} as Signature);
            },
        });
        void executor(null as unknown as TransactionPlan).then(result => {
            if (result.kind === 'single' && result.status === 'successful') {
                result.context.custom satisfies string;
                // @ts-expect-error This context declared no signature, so none is reported.
                void result.context.signature;
            }
        });
    }
}

// [DESCRIBE] TransactionPlanExecutor with an optional signature
{
    // An executor can be typed to produce results that have a transaction but no signature.
    {
        const result = null as unknown as Awaited<ReturnType<TransactionPlanExecutor<{ transaction: Transaction }>>>;
        if (result.kind === 'single' && result.status === 'successful') {
            result.context.transaction satisfies Transaction;
            // @ts-expect-error This executor makes no promise about the signature.
            void result.context.signature;
        }
    }

    // Such a result is still a TransactionPlanResult and works with the traversal helpers.
    {
        const result = null as unknown as TransactionPlanResult<{ transaction: Transaction }>;
        const flattened = flattenTransactionPlanResult(result);
        flattened satisfies SingleTransactionPlanResult<{ transaction: Transaction }>[];
        const summary = summarizeTransactionPlanResult(result);
        summary.successfulTransactions satisfies SuccessfulSingleTransactionPlanResult<{
            transaction: Transaction;
        }>[];
    }
}
