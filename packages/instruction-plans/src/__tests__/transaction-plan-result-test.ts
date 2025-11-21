import '@solana/test-matchers/toBeFrozenObject';

import { SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE, SolanaError } from '@solana/errors';
import { Signature } from '@solana/keys';

import {
    canceledSingleTransactionPlanResult,
    failedSingleTransactionPlanResult,
    nonDivisibleSequentialTransactionPlanResult,
    parallelTransactionPlanResult,
    sequentialTransactionPlanResult,
    successfulSingleTransactionPlanResult,
    summarizeTransactionPlanResult,
} from '../transaction-plan-result';
import { createMessage, createTransaction, createTransactionWithSignature } from './__setup__';

describe('successfulSingleTransactionPlanResult', () => {
    it('creates SingleTransactionPlanResult objects with successful status', () => {
        const messageA = createMessage('A');
        const transactionA = createTransaction('A');
        const result = successfulSingleTransactionPlanResult(messageA, transactionA);
        expect(result).toEqual({
            kind: 'single',
            message: messageA,
            status: { context: {}, kind: 'successful', transaction: transactionA },
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
            status: { context, kind: 'successful', transaction: transactionA },
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

describe('summarizeTransactionPlanResult', () => {
    it('produces a summary for a successful single transaction', () => {
        const signature = 'abc' as Signature;
        const context = { foo: 'bar' };
        const result = successfulSingleTransactionPlanResult(
            createMessage('A'),
            createTransactionWithSignature(signature),
            context,
        );
        const summary = summarizeTransactionPlanResult(result);
        expect(summary).toEqual([
            {
                context,
                signature,
                status: 'successful',
            },
        ]);
    });

    it('produces a summary for a failed single transaction', () => {
        const error = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);
        const result = failedSingleTransactionPlanResult(createMessage('A'), error);
        const summary = summarizeTransactionPlanResult(result);
        expect(summary).toEqual([
            {
                error,
                status: 'failed',
            },
        ]);
    });

    it('produces a summary for a canceled single transaction', () => {
        const result = canceledSingleTransactionPlanResult(createMessage('A'));
        const summary = summarizeTransactionPlanResult(result);
        expect(summary).toEqual([
            {
                status: 'canceled',
            },
        ]);
    });

    it('produces a summary for a parallel transaction plan with multiple successful transactions', () => {
        const signatureA = 'sigA' as Signature;
        const signatureB = 'sigB' as Signature;
        const signatureC = 'sigC' as Signature;

        const result = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransactionWithSignature(signatureA)),
            successfulSingleTransactionPlanResult(createMessage('B'), createTransactionWithSignature(signatureB)),
            successfulSingleTransactionPlanResult(createMessage('C'), createTransactionWithSignature(signatureC)),
        ]);
        const summary = summarizeTransactionPlanResult(result);
        expect(summary).toEqual([
            {
                context: {},
                signature: signatureA,
                status: 'successful',
            },
            {
                context: {},
                signature: signatureB,
                status: 'successful',
            },
            {
                context: {},
                signature: signatureC,
                status: 'successful',
            },
        ]);
    });

    it('produces a summary for a parallel transaction plan with mixed results', () => {
        const signatureA = 'sigA' as Signature;
        const errorB = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);

        const result = parallelTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransactionWithSignature(signatureA)),
            failedSingleTransactionPlanResult(createMessage('B'), errorB),
            canceledSingleTransactionPlanResult(createMessage('C')),
        ]);
        const summary = summarizeTransactionPlanResult(result);
        expect(summary).toEqual([
            {
                context: {},
                signature: signatureA,
                status: 'successful',
            },
            {
                error: errorB,
                status: 'failed',
            },
            {
                status: 'canceled',
            },
        ]);
    });

    it('produces a summary for a sequential transaction plan with multiple successful transactions', () => {
        const signatureA = 'sigA' as Signature;
        const signatureB = 'sigB' as Signature;
        const signatureC = 'sigC' as Signature;

        const result = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransactionWithSignature(signatureA)),
            successfulSingleTransactionPlanResult(createMessage('B'), createTransactionWithSignature(signatureB)),
            successfulSingleTransactionPlanResult(createMessage('C'), createTransactionWithSignature(signatureC)),
        ]);
        const summary = summarizeTransactionPlanResult(result);
        expect(summary).toEqual([
            {
                context: {},
                signature: signatureA,
                status: 'successful',
            },
            {
                context: {},
                signature: signatureB,
                status: 'successful',
            },
            {
                context: {},
                signature: signatureC,
                status: 'successful',
            },
        ]);
    });

    it('produces a summary for a sequential transaction plan with mixed results', () => {
        const signatureA = 'sigA' as Signature;
        const errorB = new SolanaError(SOLANA_ERROR__TRANSACTION_ERROR__INSUFFICIENT_FUNDS_FOR_FEE);

        const result = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransactionWithSignature(signatureA)),
            failedSingleTransactionPlanResult(createMessage('B'), errorB),
            canceledSingleTransactionPlanResult(createMessage('C')),
        ]);
        const summary = summarizeTransactionPlanResult(result);
        expect(summary).toEqual([
            {
                context: {},
                signature: signatureA,
                status: 'successful',
            },
            {
                error: errorB,
                status: 'failed',
            },
            {
                status: 'canceled',
            },
        ]);
    });

    it('produces a flat summary for a nested transaction plan', () => {
        const signatureA = 'sigA' as Signature;
        const signatureB = 'sigB' as Signature;
        const signatureC = 'sigC' as Signature;
        const signatureD = 'sigD' as Signature;

        const result = sequentialTransactionPlanResult([
            successfulSingleTransactionPlanResult(createMessage('A'), createTransactionWithSignature(signatureA)),
            parallelTransactionPlanResult([
                successfulSingleTransactionPlanResult(createMessage('B'), createTransactionWithSignature(signatureB)),
                successfulSingleTransactionPlanResult(createMessage('C'), createTransactionWithSignature(signatureC)),
            ]),
            successfulSingleTransactionPlanResult(createMessage('D'), createTransactionWithSignature(signatureD)),
        ]);
        const summary = summarizeTransactionPlanResult(result);
        expect(summary).toEqual([
            {
                context: {},
                signature: signatureA,
                status: 'successful',
            },
            {
                context: {},
                signature: signatureB,
                status: 'successful',
            },
            {
                context: {},
                signature: signatureC,
                status: 'successful',
            },
            {
                context: {},
                signature: signatureD,
                status: 'successful',
            },
        ]);
    });
});
