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
    createTransactionPlanExecutorWithConcurrentLeaves,
    FailedSingleTransactionPlanResult,
    flattenTransactionPlanResult,
    passthroughFailedTransactionPlanExecution,
    SingleTransactionPlanResult,
    SuccessfulSingleTransactionPlanResult,
    summarizeTransactionPlanResult,
    type TransactionPlan,
    type TransactionPlanExecutor,
    type TransactionPlanExecutorConfig,
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
    // Its callback returns the context that a successful result should carry.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({ signature: {} as Signature }),
        });
        createTransactionPlanExecutor({
            // @ts-expect-error The context is no longer the callback's only output; it must be returned.
            executeTransactionMessage: () => Promise.resolve(),
        });
        createTransactionPlanExecutor<TransactionPlanResultContextWithSignature>({
            // @ts-expect-error A bare signature is not a context; it belongs under a `signature` key.
            executeTransactionMessage: () => Promise.resolve({} as Signature),
        });
    }

    // Its callback must produce every property its context requires. This is what stops a
    // successful result from promising a property that was never populated.
    {
        createTransactionPlanExecutor<TransactionPlanResultContextWithSignature>({
            // @ts-expect-error This context requires a signature and the callback returns none.
            executeTransactionMessage: () => Promise.resolve({ transaction: {} as Transaction }),
        });
        createTransactionPlanExecutor<{ custom: string; other: string }>({
            // @ts-expect-error This context requires an `other` property and the callback returns none.
            executeTransactionMessage: () => Promise.resolve({ custom: 'value' }),
        });
        createTransactionPlanExecutor<TransactionPlanResultContextWithSignature & { custom: string }>({
            // @ts-expect-error Mutating the context does not discharge the obligation to return it.
            executeTransactionMessage: context => {
                context.custom = 'value';
                return Promise.resolve({ signature: {} as Signature });
            },
        });
    }

    // Its callback cannot return the context it was given, since every property on it is optional.
    {
        createTransactionPlanExecutor({
            // @ts-expect-error The mutable context does not satisfy `TContext` on its own.
            executeTransactionMessage: context => Promise.resolve(context),
        });
        createTransactionPlanExecutor({
            // @ts-expect-error Spreading it does not help; the spread is optional throughout.
            executeTransactionMessage: context => Promise.resolve({ ...context }),
        });
    }

    // When the callback declares no parameters, `TContext` is inferred from the context it
    // returns rather than falling back to the default. Declaring a parameter — which any callback
    // that needs the message must do — makes the callback context-sensitive, at which point the
    // default applies and the returned context must satisfy it.
    {
        const executor = createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({ transaction: {} as Transaction }),
        });
        executor satisfies TransactionPlanExecutor<{ transaction: Transaction }>;

        createTransactionPlanExecutor({
            // @ts-expect-error The default context applies here, and it requires a signature.
            executeTransactionMessage: (_, _message) => Promise.resolve({ transaction: {} as Transaction }),
        });
    }

    // It always receives a transaction message with fee payer.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: (_, message) => {
                message satisfies TransactionMessage & TransactionMessageWithFeePayer;
                return Promise.resolve({ signature: {} as Signature });
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
                return Promise.resolve({ signature: {} as Signature });
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
                return Promise.resolve({ signature: {} as Signature });
            },
        });
    }

    // It can infer a custom context from the callback, which is then assigned to the created TransactionPlanExecutor.
    {
        const executor = createTransactionPlanExecutor({
            executeTransactionMessage: (_: { custom?: string }) => {
                return Promise.resolve({ custom: 'value' });
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
                return Promise.resolve({ custom: 'value' });
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
                return Promise.resolve({ custom: 'value', signature: {} as Signature });
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
                return Promise.resolve({ custom: 'value' });
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
                return Promise.resolve({ signature: {} as Signature });
            },
        });
    }
}

// [DESCRIBE] createTransactionPlanExecutorWithConcurrentLeaves
{
    // It shares its configuration type with `createTransactionPlanExecutor`.
    {
        const config = null as unknown as TransactionPlanExecutorConfig<{ custom: string }>;
        createTransactionPlanExecutor(config) satisfies TransactionPlanExecutor<{ custom: string }>;
        createTransactionPlanExecutorWithConcurrentLeaves(config) satisfies TransactionPlanExecutor<{
            custom: string;
        }>;
    }

    // It creates an executor with the caller-defined result context.
    {
        const executor = createTransactionPlanExecutorWithConcurrentLeaves<{ transaction: Transaction }>({
            executeTransactionMessage: () => Promise.resolve({ transaction: {} as Transaction }),
        });
        executor satisfies TransactionPlanExecutor<{ transaction: Transaction }>;
    }

    // When the callback declares no parameters, `TContext` is inferred from the context it
    // returns rather than falling back to the default. Declaring a parameter — which any callback
    // that needs the message must do — makes the callback context-sensitive, at which point the
    // default applies and the returned context must satisfy it. This matches
    // `createTransactionPlanExecutor`.
    {
        const executor = createTransactionPlanExecutorWithConcurrentLeaves({
            executeTransactionMessage: () => Promise.resolve({ custom: 'value' }),
        });
        executor satisfies TransactionPlanExecutor<{ custom: string }>;

        createTransactionPlanExecutorWithConcurrentLeaves({
            // @ts-expect-error The default context applies here, and it requires a signature.
            executeTransactionMessage: (_, _message) => Promise.resolve({ transaction: {} as Transaction }),
        });
    }

    // Its callback receives a mutable context, the transaction message and the optional abort
    // signal, exactly as in `createTransactionPlanExecutor`.
    {
        createTransactionPlanExecutorWithConcurrentLeaves<{ custom: string }>({
            executeTransactionMessage: (context, message, config) => {
                context satisfies Partial<{ custom: string }>;
                message satisfies TransactionMessage & TransactionMessageWithFeePayer;
                config?.abortSignal satisfies AbortSignal | undefined;
                return Promise.resolve({ custom: 'value' });
            },
        });
    }

    // Every property of the context it hands the callback is optional and mutable.
    {
        createTransactionPlanExecutorWithConcurrentLeaves<{ custom: string }>({
            executeTransactionMessage: context => {
                context.custom satisfies string | undefined;
                context.custom = 'value';
                return Promise.resolve({ custom: 'value' });
            },
        });
    }

    // It does not accept a context property that the configured context does not declare.
    {
        createTransactionPlanExecutorWithConcurrentLeaves<{ custom: string }>({
            executeTransactionMessage: context => {
                // @ts-expect-error The configured context has no `unknownProperty` property.
                context.unknownProperty = 'value';
                return Promise.resolve({ custom: 'value' });
            },
        });
    }

    // Its callback must return the complete configured context.
    {
        createTransactionPlanExecutorWithConcurrentLeaves<{ custom: string }>({
            // @ts-expect-error The returned context is missing the `custom` property.
            executeTransactionMessage: () => Promise.resolve({ signature: {} as Signature }),
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
            executeTransactionMessage: () => Promise.resolve({ signature: {} as Signature }),
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
            executeTransactionMessage: () => Promise.resolve({ signature: {} as Signature }),
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
            executeTransactionMessage: () => Promise.resolve({ custom: 'value', signature: {} as Signature }),
        });
        void executor(null as unknown as TransactionPlan).then(result => {
            if (result.kind === 'single' && result.status === 'successful') {
                result.context.signature satisfies Signature;
                result.context.custom satisfies string;
            }
        });
    }

    // A custom context that omits the signature does not get one back. Nothing writes to the
    // context but the callback, so a context that never mentions a signature reports none — at
    // the type level and at runtime alike.
    {
        const executor = createTransactionPlanExecutor<{ custom: string }>({
            executeTransactionMessage: () => Promise.resolve({ custom: 'value' }),
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

    // `createTransactionPlanExecutor` builds one. Returning a transaction the fee payer has not
    // signed is enough, because nothing downstream tries to read a signature out of it.
    {
        const executor = createTransactionPlanExecutor<{ transaction: Transaction }>({
            executeTransactionMessage: () => Promise.resolve({ transaction: {} as Transaction }),
        });
        executor satisfies TransactionPlanExecutor<{ transaction: Transaction }>;
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
