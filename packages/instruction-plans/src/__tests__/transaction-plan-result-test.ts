import '@solana/test-matchers/toBeFrozenObject';

import { SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE, SolanaError } from '@solana/errors';
import { Signature } from '@solana/keys';

import {
    canceledSingleTransactionPlanResult,
    everyTransactionPlanResult,
    failedSingleTransactionPlanResult,
    findTransactionPlanResult,
    flattenTransactionPlanResult,
    nonDivisibleSequentialTransactionPlanResult,
    parallelTransactionPlanResult,
    sequentialTransactionPlanResult,
    successfulSingleTransactionPlanResult,
    successfulSingleTransactionPlanResultFromSignature,
    summarizeTransactionPlanResult,
} from '../transaction-plan-result';
import { createMessage, createTransaction } from './__setup__';

describe('successfulSingleTransactionPlanResult', () => {
    it('creates SingleTransactionPlanResult objects with successful status', () => {
        const messageA = createMessage('A');
        const transactionA = createTransaction('A');
        const result = successfulSingleTransactionPlanResult(messageA, transactionA);
        expect(result).toEqual({
            kind: 'single',
            message: messageA,
            status: { context: {}, kind: 'successful', signature: 'A', transaction: transactionA },
        });
    });
    it('accepts an optional context object', () => {
        const messageA = createMessage('A');
        const transactionA = createTransaction('A');
        const context = { foo: 'bar' };
        const result = successfulSingleTransactionPlanResult(messageA, transactionA, context);
        expect(result).toEqual({
            kind: 'single',
            message: messageA,
            status: { context, kind: 'successful', signature: 'A', transaction: transactionA },
        });
    });
    it('freezes created SingleTransactionPlanResult objects', () => {
        const messageA = createMessage('A');
        const transactionA = createTransaction('A');
        const result = successfulSingleTransactionPlanResult(messageA, transactionA);
        expect(result).toBeFrozenObject();
    });
    it('freezes the status object of created SingleTransactionPlanResult objects', () => {
        const messageA = createMessage('A');
        const transactionA = createTransaction('A');
        const result = successfulSingleTransactionPlanResult(messageA, transactionA);
        expect(result.status).toBeFrozenObject();
    });
});

describe('successfulSingleTransactionPlanResultFromSignature', () => {
    it('creates SingleTransactionPlanResult objects with successful status', () => {
        const messageA = createMessage('A');
        const signature = 'A' as Signature;
        const result = successfulSingleTransactionPlanResultFromSignature(messageA, signature);
        expect(result).toEqual({
            kind: 'single',
            message: messageA,
            status: { context: {}, kind: 'successful', signature: 'A' },
        });
    });
    it('accepts an optional context object', () => {
        const messageA = createMessage('A');
        const signature = 'A' as Signature;
        const context = { foo: 'bar' };
        const result = successfulSingleTransactionPlanResultFromSignature(messageA, signature, context);
        expect(result).toEqual({
            kind: 'single',
            message: messageA,
            status: { context, kind: 'successful', signature: 'A' },
        });
    });
    it('freezes created SingleTransactionPlanResult objects', () => {
        const messageA = createMessage('A');
        const signature = 'A' as Signature;
        const result = successfulSingleTransactionPlanResultFromSignature(messageA, signature);
        expect(result).toBeFrozenObject();
    });
    it('freezes the status object of created SingleTransactionPlanResult objects', () => {
        const messageA = createMessage('A');
        const signature = 'A' as Signature;
        const result = successfulSingleTransactionPlanResultFromSignature(messageA, signature);
        expect(result.status).toBeFrozenObject();
    });
});

describe('failedSingleTransactionPlanResult', () => {
    it('creates SingleTransactionPlanResult objects with failed status', () => {
        const messageA = createMessage('A');
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const result = failedSingleTransactionPlanResult(messageA, error);
        expect(result).toEqual({
            kind: 'single',
            message: messageA,
            status: { error, kind: 'failed' },
        });
    });
    it('freezes created SingleTransactionPlanResult objects', () => {
        const messageA = createMessage('A');
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const result = failedSingleTransactionPlanResult(messageA, error);
        expect(result).toBeFrozenObject();
    });
    it('freezes the status object of created SingleTransactionPlanResult objects', () => {
        const messageA = createMessage('A');
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const result = failedSingleTransactionPlanResult(messageA, error);
        expect(result.status).toBeFrozenObject();
    });
});

describe('canceledSingleTransactionPlanResult', () => {
    it('creates SingleTransactionPlanResult objects with canceled status', () => {
        const messageA = createMessage('A');
        const result = canceledSingleTransactionPlanResult(messageA);
        expect(result).toEqual({
            kind: 'single',
            message: messageA,
            status: { kind: 'canceled' },
        });
    });
    it('freezes created SingleTransactionPlanResult objects', () => {
        const messageA = createMessage('A');
        const result = canceledSingleTransactionPlanResult(messageA);
        expect(result).toBeFrozenObject();
    });
    it('freezes the status object of created SingleTransactionPlanResult objects', () => {
        const messageA = createMessage('A');
        const result = canceledSingleTransactionPlanResult(messageA);
        expect(result.status).toBeFrozenObject();
    });
});

describe('parallelTransactionPlanResult', () => {
    it('creates ParallelTransactionPlanResult objects from other results', () => {
        const planA = canceledSingleTransactionPlanResult(createMessage('A'));
        const planB = canceledSingleTransactionPlanResult(createMessage('B'));
        const result = parallelTransactionPlanResult([planA, planB]);
        expect(result).toEqual({
            kind: 'parallel',
            plans: [planA, planB],
        });
    });
    it('can nest other result types', () => {
        const planA = canceledSingleTransactionPlanResult(createMessage('A'));
        const planB = canceledSingleTransactionPlanResult(createMessage('B'));
        const planC = canceledSingleTransactionPlanResult(createMessage('C'));
        const result = parallelTransactionPlanResult([planA, parallelTransactionPlanResult([planB, planC])]);
        expect(result).toEqual({
            kind: 'parallel',
            plans: [planA, { kind: 'parallel', plans: [planB, planC] }],
        });
    });
    it('freezes created ParallelTransactionPlanResult objects', () => {
        const planA = canceledSingleTransactionPlanResult(createMessage('A'));
        const planB = canceledSingleTransactionPlanResult(createMessage('B'));
        const result = parallelTransactionPlanResult([planA, planB]);
        expect(result).toBeFrozenObject();
    });
});

describe('sequentialTransactionPlanResult', () => {
    it('creates divisible SequentialTransactionPlanResult objects from other results', () => {
        const planA = canceledSingleTransactionPlanResult(createMessage('A'));
        const planB = canceledSingleTransactionPlanResult(createMessage('B'));
        const result = sequentialTransactionPlanResult([planA, planB]);
        expect(result).toEqual({
            divisible: true,
            kind: 'sequential',
            plans: [planA, planB],
        });
    });
    it('can nest other result types', () => {
        const planA = canceledSingleTransactionPlanResult(createMessage('A'));
        const planB = canceledSingleTransactionPlanResult(createMessage('B'));
        const planC = canceledSingleTransactionPlanResult(createMessage('C'));
        const result = sequentialTransactionPlanResult([planA, sequentialTransactionPlanResult([planB, planC])]);
        expect(result).toEqual({
            divisible: true,
            kind: 'sequential',
            plans: [planA, { divisible: true, kind: 'sequential', plans: [planB, planC] }],
        });
    });
    it('freezes created SequentialTransactionPlanResult objects', () => {
        const planA = canceledSingleTransactionPlanResult(createMessage('A'));
        const planB = canceledSingleTransactionPlanResult(createMessage('B'));
        const result = sequentialTransactionPlanResult([planA, planB]);
        expect(result).toBeFrozenObject();
    });
});

describe('nonDivisibleSequentialTransactionPlanResult', () => {
    it('creates non-divisible SequentialTransactionPlanResult objects from other results', () => {
        const planA = canceledSingleTransactionPlanResult(createMessage('A'));
        const planB = canceledSingleTransactionPlanResult(createMessage('B'));
        const result = nonDivisibleSequentialTransactionPlanResult([planA, planB]);
        expect(result).toEqual({
            divisible: false,
            kind: 'sequential',
            plans: [planA, planB],
        });
    });
    it('can nest other result types', () => {
        const planA = canceledSingleTransactionPlanResult(createMessage('A'));
        const planB = canceledSingleTransactionPlanResult(createMessage('B'));
        const planC = canceledSingleTransactionPlanResult(createMessage('C'));
        const result = nonDivisibleSequentialTransactionPlanResult([
            planA,
            nonDivisibleSequentialTransactionPlanResult([planB, planC]),
        ]);
        expect(result).toEqual({
            divisible: false,
            kind: 'sequential',
            plans: [planA, { divisible: false, kind: 'sequential', plans: [planB, planC] }],
        });
    });
    it('freezes created SequentialTransactionPlanResult objects', () => {
        const planA = canceledSingleTransactionPlanResult(createMessage('A'));
        const planB = canceledSingleTransactionPlanResult(createMessage('B'));
        const result = nonDivisibleSequentialTransactionPlanResult([planA, planB]);
        expect(result).toBeFrozenObject();
    });
});

describe('findTransactionPlanResult', () => {
    it('returns the result itself when it matches the predicate', () => {
        const messageA = createMessage('A');
        const result = canceledSingleTransactionPlanResult(messageA);
        const found = findTransactionPlanResult(result, r => r.kind === 'single');
        expect(found).toBe(result);
    });
    it('returns undefined when no result matches the predicate', () => {
        const messageA = createMessage('A');
        const result = canceledSingleTransactionPlanResult(messageA);
        const found = findTransactionPlanResult(result, r => r.kind === 'parallel');
        expect(found).toBeUndefined();
    });
    it('finds a nested result in a parallel structure', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const nestedSequential = sequentialTransactionPlanResult([
            canceledSingleTransactionPlanResult(messageA),
            canceledSingleTransactionPlanResult(messageB),
        ]);
        const result = parallelTransactionPlanResult([nestedSequential]);
        const found = findTransactionPlanResult(result, r => r.kind === 'sequential');
        expect(found).toBe(nestedSequential);
    });
    it('finds a nested result in a sequential structure', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const nestedParallel = parallelTransactionPlanResult([
            canceledSingleTransactionPlanResult(messageA),
            canceledSingleTransactionPlanResult(messageB),
        ]);
        const result = sequentialTransactionPlanResult([nestedParallel]);
        const found = findTransactionPlanResult(result, r => r.kind === 'parallel');
        expect(found).toBe(nestedParallel);
    });
    it('returns the first matching result in top-down order', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const innerSequential = sequentialTransactionPlanResult([canceledSingleTransactionPlanResult(messageA)]);
        const outerSequential = sequentialTransactionPlanResult([
            innerSequential,
            canceledSingleTransactionPlanResult(messageB),
        ]);
        const found = findTransactionPlanResult(outerSequential, r => r.kind === 'sequential');
        expect(found).toBe(outerSequential);
    });
    it('finds a deeply nested result', () => {
        const messageA = createMessage('A');
        const deepSingle = canceledSingleTransactionPlanResult(messageA);
        const result = parallelTransactionPlanResult([
            sequentialTransactionPlanResult([parallelTransactionPlanResult([deepSingle])]),
        ]);
        const found = findTransactionPlanResult(result, r => r.kind === 'single');
        expect(found).toBe(deepSingle);
    });
    it('supports complex predicates that inspect nested properties', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const messageC = createMessage('C');
        const targetResult = sequentialTransactionPlanResult([
            canceledSingleTransactionPlanResult(messageA),
            canceledSingleTransactionPlanResult(messageB),
        ]);
        const result = parallelTransactionPlanResult([canceledSingleTransactionPlanResult(messageC), targetResult]);
        const found = findTransactionPlanResult(
            result,
            // eslint-disable-next-line jest/no-conditional-in-test
            r => r.kind === 'sequential' && r.plans.length === 2,
        );
        expect(found).toBe(targetResult);
    });
    it('returns undefined when searching an empty parallel result', () => {
        const result = parallelTransactionPlanResult([]);
        const found = findTransactionPlanResult(result, r => r.kind === 'single');
        expect(found).toBeUndefined();
    });
    it('finds non-divisible sequential results', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const nonDivisible = nonDivisibleSequentialTransactionPlanResult([
            canceledSingleTransactionPlanResult(messageA),
            canceledSingleTransactionPlanResult(messageB),
        ]);
        const result = parallelTransactionPlanResult([
            sequentialTransactionPlanResult([canceledSingleTransactionPlanResult(createMessage('C'))]),
            nonDivisible,
        ]);
        const found = findTransactionPlanResult(
            result,
            // eslint-disable-next-line jest/no-conditional-in-test
            r => r.kind === 'sequential' && !r.divisible,
        );
        expect(found).toBe(nonDivisible);
    });
    it('finds a failed single transaction result', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const failedResult = failedSingleTransactionPlanResult(messageB, error);
        const result = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
            failedResult,
        ]);
        const found = findTransactionPlanResult(
            result,
            // eslint-disable-next-line jest/no-conditional-in-test
            r => r.kind === 'single' && r.status.kind === 'failed',
        );
        expect(found).toBe(failedResult);
    });
    it('finds a successful single transaction result', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const successfulResult = successfulSingleTransactionPlanResult(messageA, createTransaction('A'));
        const result = sequentialTransactionPlanResult([
            successfulResult,
            canceledSingleTransactionPlanResult(messageB),
        ]);
        const found = findTransactionPlanResult(
            result,
            // eslint-disable-next-line jest/no-conditional-in-test
            r => r.kind === 'single' && r.status.kind === 'successful',
        );
        expect(found).toBe(successfulResult);
    });
});

describe('everyTransactionPlanResult', () => {
    it('returns true when all plans match the predicate', () => {
        const plan = sequentialTransactionPlanResult([
            sequentialTransactionPlanResult([]),
            sequentialTransactionPlanResult([]),
        ]);
        const result = everyTransactionPlanResult(plan, p => p.kind === 'sequential');
        expect(result).toBe(true);
    });
    it('returns false when at least one plan does not match the predicate', () => {
        const plan = sequentialTransactionPlanResult([
            parallelTransactionPlanResult([]),
            sequentialTransactionPlanResult([]),
        ]);
        const result = everyTransactionPlanResult(plan, p => p.kind === 'sequential');
        expect(result).toBe(false);
    });
    it('matches successful single transaction plans', () => {
        const plan = successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A'));
        // eslint-disable-next-line jest/no-conditional-in-test
        const result = everyTransactionPlanResult(plan, p => p.kind === 'single' && p.status.kind === 'successful');
        expect(result).toBe(true);
    });
    it('matches failed single transaction plans', () => {
        const plan = failedSingleTransactionPlanResult(
            createMessage('A'),
            new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
        );
        // eslint-disable-next-line jest/no-conditional-in-test
        const result = everyTransactionPlanResult(plan, p => p.kind === 'single' && p.status.kind === 'failed');
        expect(result).toBe(true);
    });
    it('matches canceled single transaction plans', () => {
        const plan = canceledSingleTransactionPlanResult(createMessage('A'));
        // eslint-disable-next-line jest/no-conditional-in-test
        const result = everyTransactionPlanResult(plan, p => p.kind === 'single' && p.status.kind === 'canceled');
        expect(result).toBe(true);
    });
    it('matches sequential transaction plans', () => {
        const plan = sequentialTransactionPlanResult([]);
        const result = everyTransactionPlanResult(plan, p => p.kind === 'sequential');
        expect(result).toBe(true);
    });
    it('matches non-divisible sequential transaction plans', () => {
        const plan = nonDivisibleSequentialTransactionPlanResult([]);
        // eslint-disable-next-line jest/no-conditional-in-test
        const result = everyTransactionPlanResult(plan, p => p.kind === 'sequential' && !p.divisible);
        expect(result).toBe(true);
    });
    it('matches parallel transaction plans', () => {
        const plan = parallelTransactionPlanResult([]);
        const result = everyTransactionPlanResult(plan, p => p.kind === 'parallel');
        expect(result).toBe(true);
    });
    it('matches complex transaction plans', () => {
        const resultA = successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A'));
        const resultB = failedSingleTransactionPlanResult(
            createMessage('B'),
            new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
        );
        const resultC = canceledSingleTransactionPlanResult(createMessage('C'));
        const plan = sequentialTransactionPlanResult([
            parallelTransactionPlanResult([resultA, resultB]),
            nonDivisibleSequentialTransactionPlanResult([resultA, resultC]),
        ]);
        const result = everyTransactionPlanResult(plan, p => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind !== 'single') return true;
            const message = p.message as ReturnType<typeof createMessage>;
            return ['A', 'B', 'C'].includes(message.id);
        });
        expect(result).toBe(true);
    });
    it('returns false on complex transaction plans', () => {
        const resultA = successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A'));
        const resultB = failedSingleTransactionPlanResult(
            createMessage('B'),
            new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
        );
        const resultC = canceledSingleTransactionPlanResult(createMessage('C'));
        const plan = sequentialTransactionPlanResult([
            parallelTransactionPlanResult([resultA, resultB]),
            nonDivisibleSequentialTransactionPlanResult([resultA, resultC]),
        ]);
        // eslint-disable-next-line jest/no-conditional-in-test
        const result = everyTransactionPlanResult(plan, p => p.kind !== 'single' || p.status.kind === 'successful');
        expect(result).toBe(false);
    });
    it('fails fast before evaluating children', () => {
        const predicate = jest.fn().mockReturnValueOnce(false);
        const messageA = successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A'));
        const messageB = successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B'));
        const plan = sequentialTransactionPlanResult([messageA, messageB]);
        const result = everyTransactionPlanResult(plan, predicate);
        expect(result).toBe(false);
        expect(predicate).toHaveBeenCalledTimes(1);
        expect(predicate).toHaveBeenNthCalledWith(1, plan);
        expect(predicate).not.toHaveBeenCalledWith(messageA);
        expect(predicate).not.toHaveBeenCalledWith(messageB);
    });
    it('fails fast before evaluating siblings', () => {
        const predicate = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
        const messageA = successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A'));
        const messageB = successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B'));
        const plan = sequentialTransactionPlanResult([messageA, messageB]);
        const result = everyTransactionPlanResult(plan, predicate);
        expect(result).toBe(false);
        expect(predicate).toHaveBeenCalledTimes(2);
        expect(predicate).toHaveBeenNthCalledWith(1, plan);
        expect(predicate).toHaveBeenNthCalledWith(2, messageA);
        expect(predicate).not.toHaveBeenCalledWith(messageB);
    });
});

describe('flattenTransactionPlanResult', () => {
    const plan1 = successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A'));
    const plan2 = successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B'));
    const plan3 = successfulSingleTransactionPlanResult(createMessage('C'), createTransaction('C'));

    it('flattens a parallel transaction plan result', () => {
        const result = parallelTransactionPlanResult([plan1, plan2, plan3]);

        const flattened = flattenTransactionPlanResult(result);
        expect(flattened).toEqual([plan1, plan2, plan3]);
    });

    it('flattens a sequential transaction plan result', () => {
        const result = sequentialTransactionPlanResult([plan1, plan2, plan3]);

        const flattened = flattenTransactionPlanResult(result);
        expect(flattened).toEqual([plan1, plan2, plan3]);
    });

    it('flattens a nested transaction plan result', () => {
        const nestedResult = sequentialTransactionPlanResult([parallelTransactionPlanResult([plan1, plan2]), plan3]);

        const flattened = flattenTransactionPlanResult(nestedResult);
        expect(flattened).toEqual([plan1, plan2, plan3]);
    });

    it('returns a single plan as-is', () => {
        const result = plan1;
        const flattened = flattenTransactionPlanResult(result);
        expect(flattened).toEqual([result]);
    });
});

describe('summarizeTransactionPlanResult', () => {
    it('summarizes a single successful transaction', () => {
        const result = successfulSingleTransactionPlanResultFromSignature(createMessage('A'), 'A' as Signature);
        const summary = summarizeTransactionPlanResult(result);
        expect(summary).toEqual({
            canceledTransactions: [],
            failedTransactions: [],
            successful: true,
            successfulTransactions: [result],
        });
    });

    it('summarizes a single failed transaction', () => {
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const result = failedSingleTransactionPlanResult(createMessage('A'), error);
        const summary = summarizeTransactionPlanResult(result);
        expect(summary).toEqual({
            canceledTransactions: [],
            failedTransactions: [result],
            successful: false,
            successfulTransactions: [],
        });
    });

    it('summarizes a single canceled transaction', () => {
        const result = canceledSingleTransactionPlanResult(createMessage('A'));
        const summary = summarizeTransactionPlanResult(result);
        expect(summary).toEqual({
            canceledTransactions: [result],
            failedTransactions: [],
            successful: false,
            successfulTransactions: [],
        });
    });

    it('summarizes nested successful transactions', () => {
        const planA = successfulSingleTransactionPlanResultFromSignature(createMessage('A'), 'A' as Signature);
        const planB = successfulSingleTransactionPlanResultFromSignature(createMessage('B'), 'B' as Signature);
        const planC = successfulSingleTransactionPlanResultFromSignature(createMessage('C'), 'C' as Signature);
        const nestedResult = sequentialTransactionPlanResult([parallelTransactionPlanResult([planA, planB]), planC]);

        const summary = summarizeTransactionPlanResult(nestedResult);
        expect(summary).toEqual({
            canceledTransactions: [],
            failedTransactions: [],
            successful: true,
            successfulTransactions: [planA, planB, planC],
        });
    });

    it('summarizes nested failed transactions', () => {
        const planA = failedSingleTransactionPlanResult(
            createMessage('A'),
            new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
        );
        const planB = failedSingleTransactionPlanResult(
            createMessage('B'),
            new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
        );
        const planC = failedSingleTransactionPlanResult(
            createMessage('C'),
            new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
        );
        const nestedResult = sequentialTransactionPlanResult([parallelTransactionPlanResult([planA, planB]), planC]);

        const summary = summarizeTransactionPlanResult(nestedResult);
        expect(summary).toEqual({
            canceledTransactions: [],
            failedTransactions: [planA, planB, planC],
            successful: false,
            successfulTransactions: [],
        });
    });

    it('summarizes nested canceled transactions', () => {
        const planA = canceledSingleTransactionPlanResult(createMessage('A'));
        const planB = canceledSingleTransactionPlanResult(createMessage('B'));
        const planC = canceledSingleTransactionPlanResult(createMessage('C'));
        const nestedResult = sequentialTransactionPlanResult([parallelTransactionPlanResult([planA, planB]), planC]);

        const summary = summarizeTransactionPlanResult(nestedResult);
        expect(summary).toEqual({
            canceledTransactions: [planA, planB, planC],
            failedTransactions: [],
            successful: false,
            successfulTransactions: [],
        });
    });

    it('summarizes a mix of successful, failed, and canceled transactions', () => {
        const planA = successfulSingleTransactionPlanResultFromSignature(createMessage('A'), 'A' as Signature);
        const planB = failedSingleTransactionPlanResult(
            createMessage('B'),
            new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
        );
        const planC = canceledSingleTransactionPlanResult(createMessage('C'));
        const mixedResult = sequentialTransactionPlanResult([planA, planB, planC]);

        const summary = summarizeTransactionPlanResult(mixedResult);
        expect(summary).toEqual({
            canceledTransactions: [planC],
            failedTransactions: [planB],
            successful: false,
            successfulTransactions: [planA],
        });
    });
});
