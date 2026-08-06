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
    type SingleTransactionPlanResultWithOptionalSignature,
    SuccessfulSingleTransactionPlanResult,
    type SuccessfulSingleTransactionPlanResultWithOptionalSignature,
    type TransactionPlan,
    type TransactionPlanExecutor,
    type TransactionPlanResult,
    type TransactionPlanResultContext,
    type TransactionPlanResultWithOptionalSignature,
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
    // It can return a signature or a full transaction.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({} as Signature),
        });
        createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({} as Transaction),
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

    // It can use a custom context which is then assigned to the created TransactionPlanExecutor.
    {
        const executor = createTransactionPlanExecutor({
            executeTransactionMessage: (_: { custom: string }) => {
                return Promise.resolve({} as Signature);
            },
        });
        executor satisfies TransactionPlanExecutor<{ custom: string }>;
    }

    // It can use a custom context with the base context.
    {
        const executor = createTransactionPlanExecutor<{ custom: string }>({
            executeTransactionMessage: context => {
                context.custom satisfies string;
                context.message satisfies (TransactionMessage & TransactionMessageWithFeePayer) | undefined;
                context.transaction satisfies Transaction | undefined;
                context.signature satisfies Signature | undefined;
                return Promise.resolve({} as Signature);
            },
        });
        executor satisfies TransactionPlanExecutor<{ custom: string }>;
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

    // It returns strict single results when the flag is omitted.
    {
        const executor = createTransactionPlanExecutor({
            executeTransactionMessage: () => Promise.resolve({} as Transaction),
        });
        executor satisfies TransactionPlanExecutor;
    }

    // It returns strict single results when the flag is explicitly false.
    {
        const executor = createTransactionPlanExecutor({
            allowMissingFeePayerSignature: false,
            executeTransactionMessage: () => Promise.resolve({} as Transaction),
        });
        executor satisfies TransactionPlanExecutor;
    }

    // It returns loose single results when the flag is true.
    {
        const executor = createTransactionPlanExecutor({
            allowMissingFeePayerSignature: true,
            executeTransactionMessage: () => Promise.resolve({} as Transaction),
        });
        executor satisfies TransactionPlanExecutor<
            TransactionPlanResultContext,
            SingleTransactionPlanResultWithOptionalSignature
        >;
        // @ts-expect-error A loose executor is not assignable to a strict one.
        executor satisfies TransactionPlanExecutor;
    }

    // It fails closed, returning loose single results for a non-literal boolean.
    {
        const allowMissingFeePayerSignature = {} as boolean;
        const executor = createTransactionPlanExecutor({
            allowMissingFeePayerSignature,
            executeTransactionMessage: () => Promise.resolve({} as Transaction),
        });
        // @ts-expect-error An unknown flag value must not narrow to the strict executor.
        executor satisfies TransactionPlanExecutor;
    }

    // A loose executor's successful results have an optional signature.
    {
        void (async () => {
            const executor = createTransactionPlanExecutor({
                allowMissingFeePayerSignature: true,
                executeTransactionMessage: () => Promise.resolve({} as Transaction),
            });
            const result = await executor(null as unknown as TransactionPlan);
            const single = flattenTransactionPlanResult(result)[0];
            single.context.signature satisfies Signature | undefined;
            // @ts-expect-error The signature may be absent.
            single.context.signature satisfies Signature;
        })();
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
}

// [DESCRIBE] passthroughFailedTransactionPlanExecution with optional signatures
{
    // It accepts a loose single result and widens it to all loose single results.
    {
        const promise = null as unknown as Promise<SuccessfulSingleTransactionPlanResultWithOptionalSignature>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<SingleTransactionPlanResultWithOptionalSignature>);
        // @ts-expect-error Can no longer expect a successful result only.
        void (result satisfies Promise<SuccessfulSingleTransactionPlanResultWithOptionalSignature>);
    }

    // It accepts a loose result tree.
    {
        const promise = null as unknown as Promise<TransactionPlanResultWithOptionalSignature>;
        const result = passthroughFailedTransactionPlanExecution(promise);
        void (result satisfies Promise<TransactionPlanResultWithOptionalSignature>);
    }
}
