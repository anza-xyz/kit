/* eslint-disable @typescript-eslint/no-floating-promises */

import {
    setTransactionMessageLifetimeUsingBlockhash,
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import { compileTransaction, Transaction, TransactionWithBlockhashLifetime } from '@solana/transactions';

import type { TransactionPlan } from '../transaction-plan';
import {
    createTransactionPlanExecutor,
    passthroughFailedTransactionPlanExecution,
    type TransactionPlanExecutor,
} from '../transaction-plan-executor';
import {
    CanceledSingleTransactionPlanResult,
    FailedSingleTransactionPlanResult,
    SingleTransactionPlanResult,
    SuccessfulSingleTransactionPlanResult,
    type TransactionPlanResult,
} from '../transaction-plan-result';

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
    // It always receives a transaction message with fee payer.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: message => {
                message satisfies TransactionMessage & TransactionMessageWithFeePayer;
                return Promise.resolve({ transaction: {} as Transaction });
            },
        });
    }

    // It transfers the lifetime to the compiled transaction.
    {
        createTransactionPlanExecutor({
            executeTransactionMessage: message => {
                const latestBlockhash = {} as unknown as Parameters<
                    typeof setTransactionMessageLifetimeUsingBlockhash
                >[0];
                const messageWithBlockhash = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message);
                messageWithBlockhash satisfies TransactionMessageWithBlockhashLifetime;
                const transaction = compileTransaction(messageWithBlockhash);
                transaction satisfies TransactionWithBlockhashLifetime;
                return Promise.resolve({ transaction });
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
}
