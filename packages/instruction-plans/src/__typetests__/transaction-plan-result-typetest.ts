import { Signature } from '@solana/keys';
import type { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';
import type { Transaction } from '@solana/transactions';

import {
    assertIsCanceledSingleTransactionPlanResult,
    assertIsFailedSingleTransactionPlanResult,
    assertIsNonDivisibleSequentialTransactionPlanResult,
    assertIsParallelTransactionPlanResult,
    assertIsSequentialTransactionPlanResult,
    assertIsSingleTransactionPlanResult,
    assertIsSuccessfulSingleTransactionPlanResult,
    assertIsSuccessfulTransactionPlanResult,
    CanceledSingleTransactionPlanResult,
    canceledSingleTransactionPlanResult,
    FailedSingleTransactionPlanResult,
    failedSingleTransactionPlanResult,
    flattenTransactionPlanResult,
    isCanceledSingleTransactionPlanResult,
    isFailedSingleTransactionPlanResult,
    isNonDivisibleSequentialTransactionPlanResult,
    isParallelTransactionPlanResult,
    isSequentialTransactionPlanResult,
    isSingleTransactionPlanResult,
    isSuccessfulSingleTransactionPlanResult,
    isSuccessfulTransactionPlanResult,
    nonDivisibleSequentialTransactionPlanResult,
    ParallelTransactionPlanResult,
    parallelTransactionPlanResult,
    SequentialTransactionPlanResult,
    sequentialTransactionPlanResult,
    SingleTransactionPlanResult,
    SuccessfulSingleTransactionPlanResult,
    successfulSingleTransactionPlanResult,
    successfulSingleTransactionPlanResultFromTransaction,
    SuccessfulTransactionPlanResult,
    TransactionPlanResult,
    TransactionPlanResultContext,
} from '../index';

const messageA = null as unknown as TransactionMessage & TransactionMessageWithFeePayer & { id: 'A' };
const messageB = null as unknown as TransactionMessage & TransactionMessageWithFeePayer & { id: 'B' };
const messageC = null as unknown as TransactionMessage & TransactionMessageWithFeePayer & { id: 'C' };
const transactionA = null as unknown as Transaction & { id: 'A' };
const transactionB = null as unknown as Transaction & { id: 'B' };
const error = null as unknown as Error;

type CustomContext = { customData: string };

// [DESCRIBE] parallelTransactionPlanResult
{
    // It satisfies ParallelTransactionPlanResult.
    {
        const result = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
            successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB),
        ]);
        result satisfies ParallelTransactionPlanResult;
        result satisfies TransactionPlanResult;
    }

    // It can work with custom context.
    {
        const result = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA, { customData: 'A' }),
            successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB, { customData: 'B' }),
        ]);
        result satisfies ParallelTransactionPlanResult<CustomContext>;
        result satisfies TransactionPlanResult;
    }

    // It can nest other result plans.
    {
        const result = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
            parallelTransactionPlanResult([
                successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB),
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
            successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
            successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB),
        ]);
        result satisfies SequentialTransactionPlanResult & { divisible: true };
        result satisfies TransactionPlanResult;
    }

    // It can work with custom context.
    {
        const result = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA, { customData: 'A' }),
            successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB, { customData: 'B' }),
        ]);
        result satisfies SequentialTransactionPlanResult<CustomContext> & { divisible: true };
        result satisfies TransactionPlanResult;
    }

    // It can nest other result plans.
    {
        const result = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
            sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB),
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
            successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
            successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB),
        ]);
        result satisfies SequentialTransactionPlanResult & { divisible: false };
        result satisfies TransactionPlanResult;
    }

    // It can work with custom context.
    {
        const result = nonDivisibleSequentialTransactionPlanResult([
            successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA, { customData: 'A' }),
            successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB, { customData: 'B' }),
        ]);
        result satisfies SequentialTransactionPlanResult<CustomContext> & { divisible: false };
        result satisfies TransactionPlanResult;
    }

    // It can nest other result plans.
    {
        const result = nonDivisibleSequentialTransactionPlanResult([
            successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
            nonDivisibleSequentialTransactionPlanResult([
                successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB),
                canceledSingleTransactionPlanResult(messageC),
            ]),
        ]);
        result satisfies SequentialTransactionPlanResult & { divisible: false };
        result satisfies TransactionPlanResult;
    }
}

// [DESCRIBE] successfulSingleTransactionPlanResultFromTransaction
{
    // It satisfies SingleTransactionPlanResult with a successful status.
    {
        const result = successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA);
        result satisfies SuccessfulSingleTransactionPlanResult<TransactionPlanResultContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }

    // It can include a custom context.
    {
        const result = successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA, {
            customData: 'test',
        });
        result satisfies SuccessfulSingleTransactionPlanResult<CustomContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }
}

// [DESCRIBE] successfulSingleTransactionPlanResult
{
    // It satisfies SingleTransactionPlanResult with a successful status.
    {
        const result = successfulSingleTransactionPlanResult(messageA, { signature: 'A' as Signature });
        result satisfies SuccessfulSingleTransactionPlanResult<TransactionPlanResultContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }

    // It can include a custom context.
    {
        const result = successfulSingleTransactionPlanResult(messageA, {
            customData: 'test',
            signature: 'A' as Signature,
        });
        result satisfies SuccessfulSingleTransactionPlanResult<CustomContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }
}

// [DESCRIBE] failedSingleTransactionPlanResult
{
    // It satisfies SingleTransactionPlanResult with a failed status.
    {
        const result = failedSingleTransactionPlanResult(messageA, error);
        result satisfies FailedSingleTransactionPlanResult<TransactionPlanResultContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }

    // It can include a custom context.
    {
        const result = failedSingleTransactionPlanResult(messageA, error, { customData: 'test' });
        result satisfies FailedSingleTransactionPlanResult<CustomContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }
}

// [DESCRIBE] canceledSingleTransactionPlanResult
{
    // It satisfies SingleTransactionPlanResult with a canceled status.
    {
        const result = canceledSingleTransactionPlanResult(messageA);
        result satisfies CanceledSingleTransactionPlanResult<TransactionPlanResultContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }

    // It can include a custom context.
    {
        const result = canceledSingleTransactionPlanResult(messageA, { customData: 'test' });
        result satisfies CanceledSingleTransactionPlanResult<CustomContext, typeof messageA>;
        result satisfies TransactionPlanResult;
    }
}

// [DESCRIBE] flattenTransactionPlanResult
{
    // It extracts single plan results from a simple plan result.
    {
        const result = successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA);
        const results = flattenTransactionPlanResult(result);
        results satisfies SingleTransactionPlanResult[];
    }

    // It extracts single plan results from a nested plan result.
    {
        const result = parallelTransactionPlanResult([
            sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA),
                successfulSingleTransactionPlanResultFromTransaction(messageB, transactionB),
            ]),
        ]);
        const results = flattenTransactionPlanResult(result);
        results satisfies SingleTransactionPlanResult[];
    }
}

// [DESCRIBE] isSingleTransactionPlanResult
{
    // It narrows SingleTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        if (isSingleTransactionPlanResult(plan)) {
            plan satisfies SingleTransactionPlanResult;
        }
    }

    // It keeps TSingle information.
    {
        const plan = null as unknown as SuccessfulTransactionPlanResult;
        if (isSingleTransactionPlanResult(plan)) {
            plan satisfies SingleTransactionPlanResult;
            plan satisfies SuccessfulSingleTransactionPlanResult;
        }
    }
}

// [DESCRIBE] assertIsSingleTransactionPlanResult
{
    // It narrows SingleTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        assertIsSingleTransactionPlanResult(plan);
        plan satisfies SingleTransactionPlanResult;
    }

    // It keeps TSingle information.
    {
        const plan = null as unknown as SuccessfulTransactionPlanResult;
        assertIsSingleTransactionPlanResult(plan);
        plan satisfies SingleTransactionPlanResult;
        plan satisfies SuccessfulSingleTransactionPlanResult;
    }
}

// [DESCRIBE] isSuccessfulSingleTransactionPlanResult
{
    // It narrows SuccessfulSingleTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        if (isSuccessfulSingleTransactionPlanResult(plan)) {
            plan satisfies SuccessfulSingleTransactionPlanResult;
        }
    }
}

// [DESCRIBE] assertIsSuccessfulSingleTransactionPlanResult
{
    // It narrows SuccessfulSingleTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        assertIsSuccessfulSingleTransactionPlanResult(plan);
        plan satisfies SuccessfulSingleTransactionPlanResult;
    }
}

// [DESCRIBE] isFailedSingleTransactionPlanResult
{
    // It narrows FailedSingleTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        if (isFailedSingleTransactionPlanResult(plan)) {
            plan satisfies FailedSingleTransactionPlanResult;
        }
    }
}

// [DESCRIBE] assertIsFailedSingleTransactionPlanResult
{
    // It narrows FailedSingleTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        assertIsFailedSingleTransactionPlanResult(plan);
        plan satisfies FailedSingleTransactionPlanResult;
    }
}

// [DESCRIBE] isCanceledSingleTransactionPlanResult
{
    // It narrows CanceledSingleTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        if (isCanceledSingleTransactionPlanResult(plan)) {
            plan satisfies CanceledSingleTransactionPlanResult;
        }
    }
}

// [DESCRIBE] assertIsCanceledSingleTransactionPlanResult
{
    // It narrows CanceledSingleTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        assertIsCanceledSingleTransactionPlanResult(plan);
        plan satisfies CanceledSingleTransactionPlanResult;
    }
}

// [DESCRIBE] isSequentialTransactionPlanResult
{
    // It narrows SequentialTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        if (isSequentialTransactionPlanResult(plan)) {
            plan satisfies SequentialTransactionPlanResult;
        }
    }

    // It keeps TSingle information.
    {
        const plan = null as unknown as SuccessfulTransactionPlanResult;
        if (isSequentialTransactionPlanResult(plan)) {
            plan satisfies SequentialTransactionPlanResult;
            plan satisfies SequentialTransactionPlanResult<
                TransactionPlanResultContext,
                TransactionMessage & TransactionMessageWithFeePayer,
                SuccessfulSingleTransactionPlanResult
            >;
        }
    }
}

// [DESCRIBE] assertIsSequentialTransactionPlanResult
{
    // It narrows SequentialTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        assertIsSequentialTransactionPlanResult(plan);
        plan satisfies SequentialTransactionPlanResult;
    }

    // It keeps TSingle information.
    {
        const plan = null as unknown as SuccessfulTransactionPlanResult;
        assertIsSequentialTransactionPlanResult(plan);
        plan satisfies SequentialTransactionPlanResult;
        plan satisfies SequentialTransactionPlanResult<
            TransactionPlanResultContext,
            TransactionMessage & TransactionMessageWithFeePayer,
            SuccessfulSingleTransactionPlanResult
        >;
    }
}

// [DESCRIBE] isNonDivisibleTransactionPlanResult
{
    // It narrows non-divisible SequentialTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        if (isNonDivisibleSequentialTransactionPlanResult(plan)) {
            plan satisfies SequentialTransactionPlanResult & { divisible: false };
        }
    }

    // It keeps TSingle information.
    {
        const plan = null as unknown as SuccessfulTransactionPlanResult;
        if (isNonDivisibleSequentialTransactionPlanResult(plan)) {
            plan satisfies SequentialTransactionPlanResult & { divisible: false };
            plan satisfies SequentialTransactionPlanResult<
                TransactionPlanResultContext,
                TransactionMessage & TransactionMessageWithFeePayer,
                SuccessfulSingleTransactionPlanResult
            > & { divisible: false };
        }
    }
}

// [DESCRIBE] assertIsNonDivisibleSequentialTransactionPlanResult
{
    // It narrows non-divisible SequentialTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        assertIsNonDivisibleSequentialTransactionPlanResult(plan);
        plan satisfies SequentialTransactionPlanResult & { divisible: false };
    }

    // It keeps TSingle information.
    {
        const plan = null as unknown as SuccessfulTransactionPlanResult;
        assertIsNonDivisibleSequentialTransactionPlanResult(plan);
        plan satisfies SequentialTransactionPlanResult & { divisible: false };
        plan satisfies SequentialTransactionPlanResult<
            TransactionPlanResultContext,
            TransactionMessage & TransactionMessageWithFeePayer,
            SuccessfulSingleTransactionPlanResult
        > & { divisible: false };
    }
}

// [DESCRIBE] isParallelTransactionPlanResult
{
    // It narrows ParallelTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        if (isParallelTransactionPlanResult(plan)) {
            plan satisfies ParallelTransactionPlanResult;
        }
    }

    // It keeps TSingle information.
    {
        const plan = null as unknown as SuccessfulTransactionPlanResult;
        if (isParallelTransactionPlanResult(plan)) {
            plan satisfies ParallelTransactionPlanResult;
            plan satisfies ParallelTransactionPlanResult<
                TransactionPlanResultContext,
                TransactionMessage & TransactionMessageWithFeePayer,
                SuccessfulSingleTransactionPlanResult
            >;
        }
    }
}

// [DESCRIBE] assertIsParallelTransactionPlanResult
{
    // It narrows ParallelTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        assertIsParallelTransactionPlanResult(plan);
        plan satisfies ParallelTransactionPlanResult;
    }

    // It keeps TSingle information.
    {
        const plan = null as unknown as SuccessfulTransactionPlanResult;
        assertIsParallelTransactionPlanResult(plan);
        plan satisfies ParallelTransactionPlanResult;
        plan satisfies ParallelTransactionPlanResult<
            TransactionPlanResultContext,
            TransactionMessage & TransactionMessageWithFeePayer,
            SuccessfulSingleTransactionPlanResult
        >;
    }
}

// [DESCRIBE] isSuccessfulTransactionPlanResult
{
    // It narrows SuccessfulTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        if (isSuccessfulTransactionPlanResult(plan)) {
            plan satisfies SuccessfulTransactionPlanResult;
        }
    }
    // It narrows a single plan to SuccessfulSingleTransactionPlanResult.
    {
        const plan = null as unknown as SingleTransactionPlanResult;
        if (isSuccessfulTransactionPlanResult(plan)) {
            plan satisfies SuccessfulSingleTransactionPlanResult;
            plan satisfies SuccessfulTransactionPlanResult;
        }
    }
}

// [DESCRIBE] assertIsSuccessfulTransactionPlanResult
{
    // It narrows SuccessfulTransactionPlanResult.
    {
        const plan = null as unknown as TransactionPlanResult;
        assertIsSuccessfulTransactionPlanResult(plan);
        plan satisfies SuccessfulTransactionPlanResult;
    }
    // It narrows a single plan to SuccessfulSingleTransactionPlanResult.
    {
        const plan = null as unknown as SingleTransactionPlanResult;
        assertIsSuccessfulTransactionPlanResult(plan);
        plan satisfies SuccessfulSingleTransactionPlanResult;
        plan satisfies SuccessfulTransactionPlanResult;
    }
}
