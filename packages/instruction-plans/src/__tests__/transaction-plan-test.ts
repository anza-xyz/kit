import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { pipe } from '@solana/functional';
import { BaseTransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';
import { createTransactionMessage, setTransactionMessageFeePayer } from '@solana/transaction-messages';

import {
    getAllSingleTransactionPlans,
    nonDivisibleSequentialTransactionPlan,
    parallelTransactionPlan,
    sequentialTransactionPlan,
    singleTransactionPlan,
} from '../transaction-plan';

function createMessage<TId extends string>(
    id: TId,
): BaseTransactionMessage & TransactionMessageWithFeePayer & { id: TId } {
    return pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayer('E9Nykp3rSdza2moQutaJ3K3RSC8E5iFERX2SqLTsQfjJ' as Address, m),
        m => Object.freeze({ ...m, id }),
    );
}

describe('singleTransactionPlan', () => {
    it('creates SingleTransactionPlan objects', () => {
        const messageA = createMessage('A');
        const plan = singleTransactionPlan(messageA);
        expect(plan).toEqual({ kind: 'single', message: messageA });
    });
    it('freezes created SingleTransactionPlan objects', () => {
        const messageA = createMessage('A');
        const plan = singleTransactionPlan(messageA);
        expect(plan).toBeFrozenObject();
    });
});

describe('parallelTransactionPlan', () => {
    it('creates ParallelTransactionPlan objects from other plans', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const plan = parallelTransactionPlan([singleTransactionPlan(messageA), singleTransactionPlan(messageB)]);
        expect(plan).toEqual({
            kind: 'parallel',
            plans: [singleTransactionPlan(messageA), singleTransactionPlan(messageB)],
        });
    });
    it('accepts transaction messages directly and wrap them in single plans', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const plan = parallelTransactionPlan([messageA, messageB]);
        expect(plan).toEqual({
            kind: 'parallel',
            plans: [singleTransactionPlan(messageA), singleTransactionPlan(messageB)],
        });
    });
    it('can nest other parallel plans', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const messageC = createMessage('C');
        const plan = parallelTransactionPlan([messageA, parallelTransactionPlan([messageB, messageC])]);
        expect(plan).toEqual({
            kind: 'parallel',
            plans: [
                singleTransactionPlan(messageA),
                { kind: 'parallel', plans: [singleTransactionPlan(messageB), singleTransactionPlan(messageC)] },
            ],
        });
    });
    it('freezes created ParallelTransactionPlan objects', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const plan = parallelTransactionPlan([messageA, messageB]);
        expect(plan).toBeFrozenObject();
    });
});

describe('sequentialTransactionPlan', () => {
    it('creates divisible SequentialTransactionPlan objects from other plans', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const plan = sequentialTransactionPlan([singleTransactionPlan(messageA), singleTransactionPlan(messageB)]);
        expect(plan).toEqual({
            divisible: true,
            kind: 'sequential',
            plans: [singleTransactionPlan(messageA), singleTransactionPlan(messageB)],
        });
    });
    it('accepts transaction messages directly and wrap them in single plans', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const plan = sequentialTransactionPlan([messageA, messageB]);
        expect(plan).toEqual({
            divisible: true,
            kind: 'sequential',
            plans: [singleTransactionPlan(messageA), singleTransactionPlan(messageB)],
        });
    });
    it('can nest other sequential plans', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const messageC = createMessage('C');
        const plan = sequentialTransactionPlan([messageA, sequentialTransactionPlan([messageB, messageC])]);
        expect(plan).toEqual({
            divisible: true,
            kind: 'sequential',
            plans: [
                singleTransactionPlan(messageA),
                {
                    divisible: true,
                    kind: 'sequential',
                    plans: [singleTransactionPlan(messageB), singleTransactionPlan(messageC)],
                },
            ],
        });
    });
    it('freezes created SequentialTransactionPlan objects', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const plan = sequentialTransactionPlan([messageA, messageB]);
        expect(plan).toBeFrozenObject();
    });
});

describe('nonDivisibleSequentialTransactionPlan', () => {
    it('creates non-divisible SequentialTransactionPlan objects from other plans', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const plan = nonDivisibleSequentialTransactionPlan([
            singleTransactionPlan(messageA),
            singleTransactionPlan(messageB),
        ]);
        expect(plan).toEqual({
            divisible: false,
            kind: 'sequential',
            plans: [singleTransactionPlan(messageA), singleTransactionPlan(messageB)],
        });
    });
    it('accepts transaction messages directly and wrap them in single plans', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const plan = nonDivisibleSequentialTransactionPlan([messageA, messageB]);
        expect(plan).toEqual({
            divisible: false,
            kind: 'sequential',
            plans: [singleTransactionPlan(messageA), singleTransactionPlan(messageB)],
        });
    });
    it('can nest other non-divisible sequential plans', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const messageC = createMessage('C');
        const plan = nonDivisibleSequentialTransactionPlan([
            messageA,
            nonDivisibleSequentialTransactionPlan([messageB, messageC]),
        ]);
        expect(plan).toEqual({
            divisible: false,
            kind: 'sequential',
            plans: [
                singleTransactionPlan(messageA),
                {
                    divisible: false,
                    kind: 'sequential',
                    plans: [singleTransactionPlan(messageB), singleTransactionPlan(messageC)],
                },
            ],
        });
    });
    it('freezes created SequentialTransactionPlan objects', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const plan = nonDivisibleSequentialTransactionPlan([messageA, messageB]);
        expect(plan).toBeFrozenObject();
    });
});

describe('getAllSingleTransactionPlans', () => {
    it('returns the single transaction plan when given a SingleTransactionPlan', () => {
        const messageA = createMessage('A');
        const plan = singleTransactionPlan(messageA);
        const result = getAllSingleTransactionPlans(plan);
        expect(result).toEqual([plan]);
    });
    it('returns all single transaction plans from a ParallelTransactionPlan', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const plan = parallelTransactionPlan([messageA, messageB]);
        const result = getAllSingleTransactionPlans(plan);
        expect(result).toEqual([singleTransactionPlan(messageA), singleTransactionPlan(messageB)]);
    });
    it('returns all single transaction plans from a SequentialTransactionPlan', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const plan = sequentialTransactionPlan([messageA, messageB]);
        const result = getAllSingleTransactionPlans(plan);
        expect(result).toEqual([singleTransactionPlan(messageA), singleTransactionPlan(messageB)]);
    });
    it('returns all single transaction plans from a complex nested structure', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const messageC = createMessage('C');
        const messageD = createMessage('D');
        const messageE = createMessage('E');
        const plan = parallelTransactionPlan([
            sequentialTransactionPlan([messageA, messageB]),
            nonDivisibleSequentialTransactionPlan([messageC, messageD]),
            messageE,
        ]);
        const result = getAllSingleTransactionPlans(plan);
        expect(result).toEqual([
            singleTransactionPlan(messageA),
            singleTransactionPlan(messageB),
            singleTransactionPlan(messageC),
            singleTransactionPlan(messageD),
            singleTransactionPlan(messageE),
        ]);
    });
});
