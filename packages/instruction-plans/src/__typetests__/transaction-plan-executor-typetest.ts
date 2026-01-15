/* eslint-disable @typescript-eslint/no-floating-promises */

import {
    setTransactionMessageLifetimeUsingBlockhash,
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import { compileTransaction, Transaction, TransactionWithBlockhashLifetime } from '@solana/transactions';

import type { TransactionPlan } from '../transaction-plan';
import { createTransactionPlanExecutor, type TransactionPlanExecutor } from '../transaction-plan-executor';
import type { TransactionPlanResult } from '../transaction-plan-result';

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

    // It returns a successful result, which may be nested.
    void (async () => {
        const executor = null as unknown as TransactionPlanExecutor;
        const transactionPlan = null as unknown as TransactionPlan;
        const result = await executor(transactionPlan);

        function _checkRecursive(r: typeof result) {
            switch (r.kind) {
                case 'single': {
                    r.status.kind satisfies 'successful';
                    return;
                }
                case 'sequential': {
                    for (const subResult of r.plans) {
                        _checkRecursive(subResult);
                    }
                    return;
                }
                case 'parallel': {
                    for (const subResult of r.plans) {
                        _checkRecursive(subResult);
                    }
                    return;
                }
            }
        }
        void _checkRecursive(result);
    })();
}
