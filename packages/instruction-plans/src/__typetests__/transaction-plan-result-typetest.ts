import type { SolanaError } from '@solana/errors';
import type { BaseTransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';
import type { Transaction } from '@solana/transactions';

import {
    canceledSingleTransactionPlanResult,
    failedSingleTransactionPlanResult,
    nonDivisibleSequentialTransactionPlanResult,
    ParallelTransactionPlanResult,
    parallelTransactionPlanResult,
    SequentialTransactionPlanResult,
    sequentialTransactionPlanResult,
    SingleTransactionPlanResult,
    successfulSingleTransactionPlanResult,
    TransactionPlanResult,
    TransactionPlanResultContext,
} from '../transaction-plan-result';

const messageA = null as unknown as BaseTransactionMessage & TransactionMessageWithFeePayer & { id: 'A' };
const messageB = null as unknown as BaseTransactionMessage & TransactionMessageWithFeePayer & { id: 'B' };
const messageC = null as unknown as BaseTransactionMessage & TransactionMessageWithFeePayer & { id: 'C' };
const transactionA = null as unknown as Transaction;
const transactionB = null as unknown as Transaction;
const error = null as unknown as SolanaError;

type CustomContext = { customData: string };

// [DESCRIBE] parallelTransactionPlanResult
{
    // It satisfies ParallelTransactionPlanResult.
    {
        const result = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, transactionA),
            successfulSingleTransactionPlanResult(messageB, transactionB),
        ]);
        result satisfies ParallelTransactionPlanResult;
        result satisfies TransactionPlanResult;
    }

    // It can work with custom context.
    {
        const result = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, transactionA, { customData: 'A' }),
            successfulSingleTransactionPlanResult(messageB, transactionB, { customData: 'B' }),
        ]);
        result satisfies ParallelTransactionPlanResult<CustomContext>;
        result satisfies TransactionPlanResult;
    }

    // It can nest other result plans.
    {
        const result = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, transactionA),
            parallelTransactionPlanResult([
                successfulSingleTransactionPlanResult(messageB, transactionB),
                canceledSingleTransactionPlanResult(messageC),
            ]),
        ]);
        result satisfies ParallelTransactionPlanResult;
        result satisfies TransactionPlanResult;
    }
}

// [DESCRIBE] sequentialTransactionPlanResult
{
    // It satisfies a divisible SequentialTransactionPlanResult.
    {
        const result = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, transactionA),
            successfulSingleTransactionPlanResult(messageB, transactionB),
        ]);
        result satisfies SequentialTransactionPlanResult & { divisible: true };
        result satisfies TransactionPlanResult;
    }

    // It can work with custom context.
    {
        const result = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, transactionA, { customData: 'A' }),
            successfulSingleTransactionPlanResult(messageB, transactionB, { customData: 'B' }),
        ]);
        result satisfies SequentialTransactionPlanResult<CustomContext> & { divisible: true };
        result satisfies TransactionPlanResult;
    }

    // It can nest other result plans.
    {
        const result = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, transactionA),
            sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(messageB, transactionB),
                canceledSingleTransactionPlanResult(messageC),
            ]),
        ]);
        result satisfies SequentialTransactionPlanResult & { divisible: true };
        result satisfies TransactionPlanResult;
    }
}

// [DESCRIBE] nonDivisibleSequentialTransactionPlanResult
{
    // It satisfies a non-divisible SequentialTransactionPlanResult.
    {
        const result = nonDivisibleSequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, transactionA),
            successfulSingleTransactionPlanResult(messageB, transactionB),
        ]);
        result satisfies SequentialTransactionPlanResult & { divisible: false };
        result satisfies TransactionPlanResult;
    }

    // It can work with custom context.
    {
        const result = nonDivisibleSequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, transactionA, { customData: 'A' }),
            successfulSingleTransactionPlanResult(messageB, transactionB, { customData: 'B' }),
        ]);
        result satisfies SequentialTransactionPlanResult<CustomContext> & { divisible: false };
        result satisfies TransactionPlanResult;
    }

    // It can nest other result plans.
    {
        const result = nonDivisibleSequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, transactionA),
            nonDivisibleSequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(messageB, transactionB),
                canceledSingleTransactionPlanResult(messageC),
            ]),
        ]);
        result satisfies SequentialTransactionPlanResult & { divisible: false };
        result satisfies TransactionPlanResult;
    }
}

// [DESCRIBE] successfulSingleTransactionPlanResult
{
    // It satisfies SingleTransactionPlanResult with a successful status.
    {
        const result = successfulSingleTransactionPlanResult(messageA, transactionA);
        result satisfies SingleTransactionPlanResult<TransactionPlanResultContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }

    // It can include a custom context.
    {
        const result = successfulSingleTransactionPlanResult(messageA, transactionA, { customData: 'test' });
        result satisfies SingleTransactionPlanResult<CustomContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }
}

// [DESCRIBE] failedSingleTransactionPlanResult
{
    // It satisfies SingleTransactionPlanResult with a failed status.
    {
        const result = failedSingleTransactionPlanResult(messageA, error);
        result satisfies SingleTransactionPlanResult<TransactionPlanResultContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }
}

// [DESCRIBE] canceledSingleTransactionPlanResult
{
    // It satisfies SingleTransactionPlanResult with a canceled status.
    {
        const result = canceledSingleTransactionPlanResult(messageA);
        result satisfies SingleTransactionPlanResult<TransactionPlanResultContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }
}
