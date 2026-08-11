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
    isTransactionPlanResult,
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
    TransactionPlanResultContextWithSignature,
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

    // The result's context claims exactly what was passed — custom properties stay required —
    // plus the signature and transaction derived from the transaction argument, both required.
    {
        const result = successfulSingleTransactionPlanResultFromTransaction(messageA, transactionA, {
            customData: 'test',
        });
        result.context.customData satisfies string;
        result.context.signature satisfies Signature;
        result.context.transaction satisfies Transaction;
    }

    // It does not add the optional `message` property of the default context.
    {
        const result = successfulSingleTransactionPlanResultFromTransaction<CustomContext>(messageA, transactionA, {
            customData: 'test',
        });
        // @ts-expect-error The context claims nothing but `customData`, `signature` and `transaction`.
        void result.context.message;
    }

    // With an explicit type argument, a passed context must supply the declared properties;
    // nothing but the derived `signature` and `transaction` is asserted on the caller's behalf.
    {
        successfulSingleTransactionPlanResultFromTransaction<CustomContext>(
            messageA,
            transactionA,
            // @ts-expect-error The declared `customData` property is missing.
            {},
        );
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

// [DESCRIBE] isTransactionPlanResult
{
    // It narrows to any TransactionPlanResult.
    {
        const plan = null as unknown;
        if (isTransactionPlanResult(plan)) {
            plan satisfies TransactionPlanResult;
        }
    }
}

// [DESCRIBE] TransactionPlanResultContextWithSignature
{
    // It requires a signature and leaves the other base fields optional.
    {
        const context = null as unknown as TransactionPlanResultContextWithSignature;
        context.signature satisfies Signature;
        context.message satisfies (TransactionMessage & TransactionMessageWithFeePayer) | undefined;
        context.transaction satisfies Transaction | undefined;
    }

    // It satisfies the loose context constraint, so it is usable as a default.
    {
        const context = null as unknown as TransactionPlanResultContextWithSignature;
        context satisfies TransactionPlanResultContext;
    }

    // It carries an index signature, so unknown custom properties can still be read.
    {
        const context = null as unknown as TransactionPlanResultContextWithSignature;
        context.anythingElse satisfies unknown;
    }
}

// Mutual-assignability equality. `Eq<A, B>` is `true` only when A and B accept each other.
type Eq<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// [DESCRIBE] Zero-argument result shapes
//
// These spell out, structurally, the exact context you get when you name no context type at all.
// Written this way rather than in terms of the context aliases, they would fail if a future change
// to those aliases altered what the unparameterised result types deliver.
{
    // A successful context requires a signature and leaves the other base fields optional.
    {
        type Expected = Readonly<{
            [key: number | string | symbol]: unknown;
            message?: TransactionMessage & TransactionMessageWithFeePayer;
            signature: Signature;
            transaction?: Transaction;
        }>;
        type Actual = SuccessfulSingleTransactionPlanResult['context'];
        true satisfies Eq<Expected, Actual>;
    }

    // A failed context guarantees nothing; every base field is optional.
    {
        type Expected = Readonly<{
            [key: number | string | symbol]: unknown;
            message?: TransactionMessage & TransactionMessageWithFeePayer;
            signature?: Signature;
            transaction?: Transaction;
        }>;
        type Actual = FailedSingleTransactionPlanResult['context'];
        true satisfies Eq<Expected, Actual>;
    }

    // A canceled context guarantees nothing either.
    {
        type Expected = Readonly<{
            [key: number | string | symbol]: unknown;
            message?: TransactionMessage & TransactionMessageWithFeePayer;
            signature?: Signature;
            transaction?: Transaction;
        }>;
        type Actual = CanceledSingleTransactionPlanResult['context'];
        true satisfies Eq<Expected, Actual>;
    }

    // A successful result guarantees a signature.
    {
        const result = null as unknown as SuccessfulSingleTransactionPlanResult;
        result.context.signature satisfies Signature;
    }

    // A failed result does not.
    {
        const result = null as unknown as FailedSingleTransactionPlanResult;
        result.context.signature satisfies Signature | undefined;
        // @ts-expect-error A failed result guarantees no signature.
        result.context.signature satisfies Signature;
    }

    // The index signature means custom properties can be read off an unparameterised result.
    {
        const result = null as unknown as SingleTransactionPlanResult;
        result.context.startedAt satisfies unknown;
    }
}

// [DESCRIBE] Explicitly parameterised result contexts
{
    // A bare custom context is exactly itself on the successful branch — no base fields are forced on it.
    {
        const result = null as unknown as SuccessfulSingleTransactionPlanResult<{ startedAt: number }>;
        result.context.startedAt satisfies number;
        // @ts-expect-error This context makes no promise about the signature.
        result.context.signature satisfies Signature;
    }

    // Intersecting the default context back in restores the signature guarantee alongside it.
    {
        const result = null as unknown as SuccessfulSingleTransactionPlanResult<
            TransactionPlanResultContextWithSignature & { startedAt: number }
        >;
        result.context.startedAt satisfies number;
        result.context.signature satisfies Signature;
    }

    // Custom properties survive `Partial` on the failed branch as optionals, not as `unknown`.
    {
        const result = null as unknown as FailedSingleTransactionPlanResult<{ startedAt: number }>;
        result.context.startedAt satisfies number | undefined;
        // @ts-expect-error A failed result guarantees nothing about the context.
        result.context.startedAt satisfies number;
    }

    // A context that guarantees a transaction rather than a signature narrows both branches as
    // expected, which is what lets a result describe a transaction that was never submitted.
    {
        const result = null as unknown as SingleTransactionPlanResult<{ transaction: Transaction }>;
        if (isSuccessfulSingleTransactionPlanResult(result)) {
            result.context.transaction satisfies Transaction;
            // @ts-expect-error This context declares no signature, so none is reported.
            void result.context.signature;
        }
        if (isFailedSingleTransactionPlanResult(result)) {
            result.context.transaction satisfies Transaction | undefined;
            // @ts-expect-error A failed result's context makes every field optional, including transaction.
            result.context.transaction satisfies Transaction;
        }
    }
}
