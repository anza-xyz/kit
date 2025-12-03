import type { BaseTransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';

import {
    getAllSingleTransactionPlans,
    nonDivisibleSequentialTransactionPlan,
    ParallelTransactionPlan,
    parallelTransactionPlan,
    SequentialTransactionPlan,
    sequentialTransactionPlan,
    SingleTransactionPlan,
    singleTransactionPlan,
} from '../transaction-plan';

const messageA = null as unknown as BaseTransactionMessage & TransactionMessageWithFeePayer & { id: 'A' };
const messageB = null as unknown as BaseTransactionMessage & TransactionMessageWithFeePayer & { id: 'B' };
const messageC = null as unknown as BaseTransactionMessage & TransactionMessageWithFeePayer & { id: 'C' };

// [DESCRIBE] parallelTransactionPlan
{
    // It satisfies ParallelTransactionPlan.
    {
        const plan = parallelTransactionPlan([messageA, messageB]);
        plan satisfies ParallelTransactionPlan;
    }

    // It can nest other plans.
    {
        const plan = parallelTransactionPlan([messageA, parallelTransactionPlan([messageB, messageC])]);
        plan satisfies ParallelTransactionPlan;
    }
}

// [DESCRIBE] sequentialTransactionPlan
{
    // It satisfies a divisible SequentialTransactionPlan.
    {
        const plan = sequentialTransactionPlan([messageA, messageB]);
        plan satisfies SequentialTransactionPlan & { divisible: true };
    }

    // It can nest other plans.
    {
        const plan = sequentialTransactionPlan([messageA, sequentialTransactionPlan([messageB, messageC])]);
        plan satisfies SequentialTransactionPlan & { divisible: true };
    }
}

// [DESCRIBE] nonDivisibleSequentialTransactionPlan
{
    // It satisfies a non-divisible SequentialTransactionPlan.
    {
        const plan = nonDivisibleSequentialTransactionPlan([messageA, messageB]);
        plan satisfies SequentialTransactionPlan & { divisible: false };
    }

    // It can nest other plans.
    {
        const plan = nonDivisibleSequentialTransactionPlan([
            messageA,
            nonDivisibleSequentialTransactionPlan([messageB, messageC]),
        ]);
        plan satisfies SequentialTransactionPlan & { divisible: false };
    }
}

// [DESCRIBE] singleTransactionPlan
{
    // It satisfies SingleTransactionPlan.
    {
        const plan = singleTransactionPlan(messageA);
        plan satisfies SingleTransactionPlan;
    }
}

// [DESCRIBE] getAllSingleTransactionPlans
{
    // It extracts single transaction plans from a simple plan.
    {
        const plan = singleTransactionPlan(messageA);
        const singlePlans = getAllSingleTransactionPlans(plan);
        singlePlans satisfies SingleTransactionPlan[];
    }

    // It extracts single transaction plans from a nested plan.
    {
        const plan = parallelTransactionPlan([
            sequentialTransactionPlan([messageA, messageB]),
            nonDivisibleSequentialTransactionPlan([messageC]),
        ]);
        const singlePlans = getAllSingleTransactionPlans(plan);
        singlePlans satisfies SingleTransactionPlan[];
    }
}
