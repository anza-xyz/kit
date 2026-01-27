import '@solana/test-matchers/toBeFrozenObject';

import {
    SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND,
    SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE,
    SolanaError,
} from '@solana/errors';
import { Signature } from '@solana/keys';

import {
    assertIsCanceledSingleTransactionPlanResult,
    assertIsFailedSingleTransactionPlanResult,
    assertIsNonDivisibleSequentialTransactionPlanResult,
    assertIsParallelTransactionPlanResult,
    assertIsSequentialTransactionPlanResult,
    assertIsSingleTransactionPlanResult,
    assertIsSuccessfulSingleTransactionPlanResult,
    canceledSingleTransactionPlanResult,
    everyTransactionPlanResult,
    failedSingleTransactionPlanResult,
    findTransactionPlanResult,
    flattenTransactionPlanResult,
    getFirstFailedSingleTransactionPlanResult,
    isCanceledSingleTransactionPlanResult,
    isFailedSingleTransactionPlanResult,
    isNonDivisibleSequentialTransactionPlanResult,
    isParallelTransactionPlanResult,
    isSequentialTransactionPlanResult,
    isSingleTransactionPlanResult,
    isSuccessfulSingleTransactionPlanResult,
    nonDivisibleSequentialTransactionPlanResult,
    parallelTransactionPlanResult,
    sequentialTransactionPlanResult,
    successfulSingleTransactionPlanResult,
    successfulSingleTransactionPlanResultFromSignature,
    summarizeTransactionPlanResult,
    transformTransactionPlanResult,
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

describe('isSingleTransactionPlanResult', () => {
    it('returns true for any SingleTransactionPlanResult', () => {
        expect(
            isSingleTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toBe(true);
        expect(
            isSingleTransactionPlanResult(
                successfulSingleTransactionPlanResultFromSignature(createMessage('A'), 'A' as Signature),
            ),
        ).toBe(true);
        expect(
            isSingleTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toBe(true);
        expect(isSingleTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A')))).toBe(true);
    });
    it('returns false for other plans', () => {
        expect(isSingleTransactionPlanResult(sequentialTransactionPlanResult([]))).toBe(false);
        expect(isSingleTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([]))).toBe(false);
        expect(isSingleTransactionPlanResult(parallelTransactionPlanResult([]))).toBe(false);
    });
});

describe('assertIsSingleTransactionPlanResult', () => {
    it('does nothing for any SingleTransactionPlanResult', () => {
        expect(() =>
            assertIsSingleTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).not.toThrow();
        expect(() =>
            assertIsSingleTransactionPlanResult(
                successfulSingleTransactionPlanResultFromSignature(createMessage('A'), 'A' as Signature),
            ),
        ).not.toThrow();
        expect(() =>
            assertIsSingleTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).not.toThrow();
        expect(() =>
            assertIsSingleTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A'))),
        ).not.toThrow();
    });
    it('throws for other plans', () => {
        expect(() => assertIsSingleTransactionPlanResult(sequentialTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected single plan, got sequential plan.',
        );
        expect(() => assertIsSingleTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected single plan, got sequential plan.',
        );
        expect(() => assertIsSingleTransactionPlanResult(parallelTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected single plan, got parallel plan.',
        );
    });
});

describe('isSuccessfulSingleTransactionPlanResult', () => {
    it('returns true for successful SingleTransactionPlanResult', () => {
        expect(
            isSuccessfulSingleTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toBe(true);
        expect(
            isSuccessfulSingleTransactionPlanResult(
                successfulSingleTransactionPlanResultFromSignature(createMessage('A'), 'A' as Signature),
            ),
        ).toBe(true);
    });
    it('returns false for other plans', () => {
        expect(
            isSuccessfulSingleTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toBe(false);
        expect(isSuccessfulSingleTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A')))).toBe(
            false,
        );
        expect(isSuccessfulSingleTransactionPlanResult(sequentialTransactionPlanResult([]))).toBe(false);
        expect(isSuccessfulSingleTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([]))).toBe(false);
        expect(isSuccessfulSingleTransactionPlanResult(parallelTransactionPlanResult([]))).toBe(false);
    });
});

describe('assertIsSuccessfulSingleTransactionPlanResult', () => {
    it('does nothing for successful SingleTransactionPlanResult', () => {
        expect(() =>
            assertIsSuccessfulSingleTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).not.toThrow();
        expect(() =>
            assertIsSuccessfulSingleTransactionPlanResult(
                successfulSingleTransactionPlanResultFromSignature(createMessage('A'), 'A' as Signature),
            ),
        ).not.toThrow();
    });
    it('throws for other plans', () => {
        expect(() =>
            assertIsSuccessfulSingleTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toThrow('Unexpected transaction plan result. Expected successful single plan, got failed single plan.');
        expect(() =>
            assertIsSuccessfulSingleTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A'))),
        ).toThrow('Unexpected transaction plan result. Expected successful single plan, got canceled single plan.');
        expect(() => assertIsSuccessfulSingleTransactionPlanResult(sequentialTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected successful single plan, got sequential plan.',
        );
        expect(() =>
            assertIsSuccessfulSingleTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([])),
        ).toThrow('Unexpected transaction plan result. Expected successful single plan, got sequential plan.');
        expect(() => assertIsSuccessfulSingleTransactionPlanResult(parallelTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected successful single plan, got parallel plan.',
        );
    });
});

describe('isFailedSingleTransactionPlanResult', () => {
    it('returns true for failed SingleTransactionPlanResult', () => {
        expect(
            isFailedSingleTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toBe(true);
    });
    it('returns false for other plans', () => {
        expect(
            isFailedSingleTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toBe(false);
        expect(isFailedSingleTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A')))).toBe(
            false,
        );
        expect(isFailedSingleTransactionPlanResult(sequentialTransactionPlanResult([]))).toBe(false);
        expect(isFailedSingleTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([]))).toBe(false);
        expect(isFailedSingleTransactionPlanResult(parallelTransactionPlanResult([]))).toBe(false);
    });
});

describe('assertIsFailedSingleTransactionPlanResult', () => {
    it('does nothing for failed SingleTransactionPlanResult', () => {
        expect(() =>
            assertIsFailedSingleTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).not.toThrow();
    });
    it('throws for other plans', () => {
        expect(() =>
            assertIsFailedSingleTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toThrow('Unexpected transaction plan result. Expected failed single plan, got successful single plan.');
        expect(() =>
            assertIsFailedSingleTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A'))),
        ).toThrow('Unexpected transaction plan result. Expected failed single plan, got canceled single plan.');
        expect(() => assertIsFailedSingleTransactionPlanResult(sequentialTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected failed single plan, got sequential plan.',
        );
        expect(() =>
            assertIsFailedSingleTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([])),
        ).toThrow('Unexpected transaction plan result. Expected failed single plan, got sequential plan.');
        expect(() => assertIsFailedSingleTransactionPlanResult(parallelTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected failed single plan, got parallel plan.',
        );
    });
});

describe('isCanceledSingleTransactionPlanResult', () => {
    it('returns true for canceled SingleTransactionPlanResult', () => {
        expect(isCanceledSingleTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A')))).toBe(
            true,
        );
    });
    it('returns false for other plans', () => {
        expect(
            isCanceledSingleTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toBe(false);
        expect(
            isCanceledSingleTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toBe(false);
        expect(isCanceledSingleTransactionPlanResult(sequentialTransactionPlanResult([]))).toBe(false);
        expect(isCanceledSingleTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([]))).toBe(false);
        expect(isCanceledSingleTransactionPlanResult(parallelTransactionPlanResult([]))).toBe(false);
    });
});

describe('assertIsCanceledSingleTransactionPlanResult', () => {
    it('does nothing for canceled SingleTransactionPlanResult', () => {
        expect(() =>
            assertIsCanceledSingleTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A'))),
        ).not.toThrow();
    });
    it('throws for other plans', () => {
        expect(() =>
            assertIsCanceledSingleTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toThrow('Unexpected transaction plan result. Expected canceled single plan, got successful single plan.');
        expect(() =>
            assertIsCanceledSingleTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toThrow('Unexpected transaction plan result. Expected canceled single plan, got failed single plan.');
        expect(() => assertIsCanceledSingleTransactionPlanResult(sequentialTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected canceled single plan, got sequential plan.',
        );
        expect(() =>
            assertIsCanceledSingleTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([])),
        ).toThrow('Unexpected transaction plan result. Expected canceled single plan, got sequential plan.');
        expect(() => assertIsCanceledSingleTransactionPlanResult(parallelTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected canceled single plan, got parallel plan.',
        );
    });
});

describe('isSequentialTransactionPlanResult', () => {
    it('returns true for SequentialTransactionPlanResult (divisible or not)', () => {
        expect(isSequentialTransactionPlanResult(sequentialTransactionPlanResult([]))).toBe(true);
        expect(isSequentialTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([]))).toBe(true);
    });
    it('returns false for other plans', () => {
        expect(
            isSequentialTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toBe(false);
        expect(
            isSequentialTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toBe(false);
        expect(isSequentialTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A')))).toBe(false);
        expect(isSequentialTransactionPlanResult(parallelTransactionPlanResult([]))).toBe(false);
    });
});

describe('assertIsSequentialTransactionPlanResult', () => {
    it('does nothing for SequentialTransactionPlanResult', () => {
        expect(() => assertIsSequentialTransactionPlanResult(sequentialTransactionPlanResult([]))).not.toThrow();
        expect(() =>
            assertIsSequentialTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([])),
        ).not.toThrow();
    });
    it('throws for other plans', () => {
        expect(() =>
            assertIsSequentialTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toThrow('Unexpected transaction plan result. Expected sequential plan, got single plan.');
        expect(() =>
            assertIsSequentialTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toThrow('Unexpected transaction plan result. Expected sequential plan, got single plan.');
        expect(() =>
            assertIsSequentialTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A'))),
        ).toThrow('Unexpected transaction plan result. Expected sequential plan, got single plan.');
        expect(() => assertIsSequentialTransactionPlanResult(parallelTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected sequential plan, got parallel plan.',
        );
    });
});

describe('isNonDivisibleSequentialTransactionPlanResult', () => {
    it('returns true for non-divisible SequentialTransactionPlanResult', () => {
        expect(isNonDivisibleSequentialTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([]))).toBe(
            true,
        );
    });
    it('returns false for other plans', () => {
        expect(
            isNonDivisibleSequentialTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toBe(false);
        expect(
            isNonDivisibleSequentialTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toBe(false);
        expect(
            isNonDivisibleSequentialTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A'))),
        ).toBe(false);
        expect(isNonDivisibleSequentialTransactionPlanResult(sequentialTransactionPlanResult([]))).toBe(false);
        expect(isNonDivisibleSequentialTransactionPlanResult(parallelTransactionPlanResult([]))).toBe(false);
    });
});

describe('assertIsNonDivisibleSequentialTransactionPlanResult', () => {
    it('does nothing for non-divisible SequentialTransactionPlanResult', () => {
        expect(() =>
            assertIsNonDivisibleSequentialTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([])),
        ).not.toThrow();
    });
    it('throws for other plans', () => {
        expect(() =>
            assertIsNonDivisibleSequentialTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toThrow('Unexpected transaction plan result. Expected non-divisible sequential plan, got single plan.');
        expect(() =>
            assertIsNonDivisibleSequentialTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toThrow('Unexpected transaction plan result. Expected non-divisible sequential plan, got single plan.');
        expect(() =>
            assertIsNonDivisibleSequentialTransactionPlanResult(
                canceledSingleTransactionPlanResult(createMessage('A')),
            ),
        ).toThrow('Unexpected transaction plan result. Expected non-divisible sequential plan, got single plan.');
        expect(() => assertIsNonDivisibleSequentialTransactionPlanResult(sequentialTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected non-divisible sequential plan, got divisible sequential plan.',
        );
        expect(() => assertIsNonDivisibleSequentialTransactionPlanResult(parallelTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected non-divisible sequential plan, got parallel plan.',
        );
    });
});

describe('isParallelTransactionPlanResult', () => {
    it('returns true for ParallelTransactionPlanResult', () => {
        expect(isParallelTransactionPlanResult(parallelTransactionPlanResult([]))).toBe(true);
    });
    it('returns false for other plans', () => {
        expect(
            isParallelTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toBe(false);
        expect(
            isParallelTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toBe(false);
        expect(isParallelTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A')))).toBe(false);
        expect(isParallelTransactionPlanResult(sequentialTransactionPlanResult([]))).toBe(false);
        expect(isParallelTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([]))).toBe(false);
    });
});

describe('assertIsParallelTransactionPlanResult', () => {
    it('does nothing for ParallelTransactionPlanResult', () => {
        expect(() => assertIsParallelTransactionPlanResult(parallelTransactionPlanResult([]))).not.toThrow();
    });
    it('throws for other plans', () => {
        expect(() =>
            assertIsParallelTransactionPlanResult(
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ),
        ).toThrow('Unexpected transaction plan result. Expected parallel plan, got single plan.');
        expect(() =>
            assertIsParallelTransactionPlanResult(
                failedSingleTransactionPlanResult(
                    createMessage('A'),
                    new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
                ),
            ),
        ).toThrow('Unexpected transaction plan result. Expected parallel plan, got single plan.');
        expect(() =>
            assertIsParallelTransactionPlanResult(canceledSingleTransactionPlanResult(createMessage('A'))),
        ).toThrow('Unexpected transaction plan result. Expected parallel plan, got single plan.');
        expect(() => assertIsParallelTransactionPlanResult(sequentialTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected parallel plan, got sequential plan.',
        );
        expect(() => assertIsParallelTransactionPlanResult(nonDivisibleSequentialTransactionPlanResult([]))).toThrow(
            'Unexpected transaction plan result. Expected parallel plan, got sequential plan.',
        );
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

describe('transformTransactionPlanResult', () => {
    it('transforms successful single transaction plan results', () => {
        const plan = successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A'));
        const transformedPlan = transformTransactionPlanResult(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'single' ? { ...p, message: { ...p.message, id: 'New A' } } : p,
        );
        expect(transformedPlan).toStrictEqual(
            successfulSingleTransactionPlanResult(createMessage('New A'), createTransaction('A')),
        );
    });
    it('transforms failed single transaction plan results', () => {
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const plan = failedSingleTransactionPlanResult(createMessage('A'), error);
        const transformedPlan = transformTransactionPlanResult(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'single' ? { ...p, message: { ...p.message, id: 'New A' } } : p,
        );
        expect(transformedPlan).toStrictEqual(failedSingleTransactionPlanResult(createMessage('New A'), error));
    });
    it('transforms canceled single transaction plan results', () => {
        const plan = canceledSingleTransactionPlanResult(createMessage('A'));
        const transformedPlan = transformTransactionPlanResult(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'single' ? { ...p, message: { ...p.message, id: 'New A' } } : p,
        );
        expect(transformedPlan).toStrictEqual(canceledSingleTransactionPlanResult(createMessage('New A')));
    });
    it('transforms sequential transaction plan results', () => {
        const plan = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
        ]);
        const transformedPlan = transformTransactionPlanResult(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'sequential' ? { ...p, plans: p.plans.reverse() } : p,
        );
        expect(transformedPlan).toStrictEqual(
            sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ]),
        );
    });
    it('transforms non-divisible sequential transaction plan results', () => {
        const plan = nonDivisibleSequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
        ]);
        const transformedPlan = transformTransactionPlanResult(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'sequential' ? { ...p, plans: p.plans.reverse() } : p,
        );
        expect(transformedPlan).toStrictEqual(
            nonDivisibleSequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ]),
        );
    });
    it('transforms parallel transaction plan results', () => {
        const plan = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
        ]);
        const transformedPlan = transformTransactionPlanResult(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'parallel' ? { ...p, plans: p.plans.reverse() } : p,
        );
        expect(transformedPlan).toStrictEqual(
            parallelTransactionPlanResult([
                successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            ]),
        );
    });
    it('transforms using a bottom-up approach', () => {
        // Given the following nested plans.
        const plan = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
                successfulSingleTransactionPlanResult(createMessage('C'), createTransaction('C')),
            ]),
        ]);

        // And given an array of message IDs that were seen by sequential plans during transformation.
        const seenTransactionMessageIds: string[] = [];

        // When transforming by prepending "New " to single transaction plan result IDs
        // And recording the seen transaction message IDs in sequential plans.
        transformTransactionPlanResult(plan, p => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind === 'single') {
                const message = p.message as ReturnType<typeof createMessage>;
                return { ...p, message: { ...message, id: `New ${message.id}` } };
            }
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind === 'sequential') {
                const seenMessages = p.plans
                    .filter(subPlan => subPlan.kind === 'single')
                    .map(subPlan => subPlan.message as ReturnType<typeof createMessage>);
                seenTransactionMessageIds.push(...seenMessages.map(message => message.id));
            }
            return p;
        });

        // Then we expect the seen message IDs to have already been transformed
        // using a bottom-up approach.
        expect(seenTransactionMessageIds).toStrictEqual(['New B', 'New C', 'New A']);
    });
    it('can be used to duplicate transaction results', () => {
        const plan = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
        ]);
        const transformedPlan = transformTransactionPlanResult(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'single' ? sequentialTransactionPlanResult([p, p]) : p,
        );
        expect(transformedPlan).toStrictEqual(
            sequentialTransactionPlanResult([
                sequentialTransactionPlanResult([
                    successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
                    successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
                ]),
                sequentialTransactionPlanResult([
                    successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
                    successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
                ]),
            ]),
        );
    });
    it('can be used to remove parallelism', () => {
        const plan = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
            successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
        ]);
        const transformedPlan = transformTransactionPlanResult(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'parallel' ? sequentialTransactionPlanResult(p.plans) : p,
        );
        expect(transformedPlan).toStrictEqual(
            sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
                successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
            ]),
        );
    });
    it('can be used to flatten nested transaction plan results', () => {
        const plan = sequentialTransactionPlanResult([
            sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
                successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
            ]),
            sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(createMessage('C'), createTransaction('C')),
                sequentialTransactionPlanResult([
                    successfulSingleTransactionPlanResult(createMessage('D'), createTransaction('D')),
                    successfulSingleTransactionPlanResult(createMessage('E'), createTransaction('E')),
                ]),
            ]),
        ]);
        const transformedPlan = transformTransactionPlanResult(plan, p => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind !== 'sequential') return p;
            const subPlans = p.plans.flatMap(subPlan =>
                // eslint-disable-next-line jest/no-conditional-in-test
                subPlan.kind === 'sequential' && p.divisible === subPlan.divisible ? subPlan.plans : [subPlan],
            );
            return { ...p, plans: subPlans };
        });
        expect(transformedPlan).toStrictEqual(
            sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
                successfulSingleTransactionPlanResult(createMessage('B'), createTransaction('B')),
                successfulSingleTransactionPlanResult(createMessage('C'), createTransaction('C')),
                successfulSingleTransactionPlanResult(createMessage('D'), createTransaction('D')),
                successfulSingleTransactionPlanResult(createMessage('E'), createTransaction('E')),
            ]),
        );
    });
    it('keeps transformed successful single transaction plan results frozen', () => {
        const plan = successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A'));
        const transformedPlan = transformTransactionPlanResult(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
    });
    it('keeps transformed failed single transaction plan results frozen', () => {
        const plan = failedSingleTransactionPlanResult(
            createMessage('A'),
            new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE),
        );
        const transformedPlan = transformTransactionPlanResult(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
    });
    it('keeps transformed canceled single transaction plan results frozen', () => {
        const plan = canceledSingleTransactionPlanResult(createMessage('A'));
        const transformedPlan = transformTransactionPlanResult(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
    });
    it('keeps transformed sequential transaction plan results frozen', () => {
        const plan = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
        ]);
        const transformedPlan = transformTransactionPlanResult(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
    });
    it('keeps transformed parallel transaction plan results frozen', () => {
        const plan = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransaction('A')),
        ]);
        const transformedPlan = transformTransactionPlanResult(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
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

describe('getFirstFailedSingleTransactionPlanResult', () => {
    it('returns the failed result from a single failed transaction', () => {
        const messageA = createMessage('A');
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const failedResult = failedSingleTransactionPlanResult(messageA, error);

        const result = getFirstFailedSingleTransactionPlanResult(failedResult);
        expect(result).toBe(failedResult);
    });

    it('returns the first failed result from a parallel structure', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const failedResult = failedSingleTransactionPlanResult(messageB, error);
        const parallelResult = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
            failedResult,
        ]);

        const result = getFirstFailedSingleTransactionPlanResult(parallelResult);
        expect(result).toBe(failedResult);
    });

    it('returns the first failed result from a sequential structure', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const failedResult = failedSingleTransactionPlanResult(messageB, error);
        const sequentialResult = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
            failedResult,
        ]);

        const result = getFirstFailedSingleTransactionPlanResult(sequentialResult);
        expect(result).toBe(failedResult);
    });

    it('returns the first failed result from a deeply nested structure', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const messageC = createMessage('C');
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const failedResult = failedSingleTransactionPlanResult(messageC, error);
        const nestedResult = parallelTransactionPlanResult([
            sequentialTransactionPlanResult([
                successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
                parallelTransactionPlanResult([
                    successfulSingleTransactionPlanResult(messageB, createTransaction('B')),
                    failedResult,
                ]),
            ]),
        ]);

        const result = getFirstFailedSingleTransactionPlanResult(nestedResult);
        expect(result).toBe(failedResult);
    });

    it('returns the first failed result when multiple failures exist', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const firstFailedResult = failedSingleTransactionPlanResult(messageA, error);
        const secondFailedResult = failedSingleTransactionPlanResult(messageB, error);
        const parallelResult = parallelTransactionPlanResult([firstFailedResult, secondFailedResult]);

        const result = getFirstFailedSingleTransactionPlanResult(parallelResult);
        expect(result).toBe(firstFailedResult);
    });

    it('throws SolanaError when no failed result exists (all successful)', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const successfulResult = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
            successfulSingleTransactionPlanResult(messageB, createTransaction('B')),
        ]);

        expect(() => getFirstFailedSingleTransactionPlanResult(successfulResult)).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND, {
                context: expect.any(Object),
            }),
        );
    });

    it('throws SolanaError when no failed result exists (all canceled)', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const canceledResult = parallelTransactionPlanResult([
            canceledSingleTransactionPlanResult(messageA),
            canceledSingleTransactionPlanResult(messageB),
        ]);

        expect(() => getFirstFailedSingleTransactionPlanResult(canceledResult)).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND, {
                context: {
                    transactionPlanResult: canceledResult,
                },
            }),
        );
    });

    it('throws SolanaError when no failed result exists (mixed successful/canceled)', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const mixedResult = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(messageA, createTransaction('A')),
            canceledSingleTransactionPlanResult(messageB),
        ]);

        expect(() => getFirstFailedSingleTransactionPlanResult(mixedResult)).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND, {
                context: {
                    transactionPlanResult: mixedResult,
                },
            }),
        );
    });

    it('throws an error where context contains transactionPlanResult as non-enumerable', () => {
        const messageA = createMessage('A');
        const successfulResult = successfulSingleTransactionPlanResult(messageA, createTransaction('A'));

        let caughtError:
            | SolanaError<typeof SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND>
            | undefined;
        try {
            getFirstFailedSingleTransactionPlanResult(successfulResult);
        } catch (error) {
            caughtError = error as SolanaError<
                typeof SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_SINGLE_TRANSACTION_PLAN_RESULT_NOT_FOUND
            >;
        }

        expect(caughtError).toBeInstanceOf(SolanaError);

        // The transactionPlanResult should be accessible directly on the context
        expect(caughtError!.context.transactionPlanResult).toBe(successfulResult);

        // But it should not be enumerable (won't appear in Object.keys or JSON.stringify)
        expect(Object.keys(caughtError!.context)).not.toContain('transactionPlanResult');
        expect(Object.prototype.propertyIsEnumerable.call(caughtError!.context, 'transactionPlanResult')).toBe(false);
    });
});
