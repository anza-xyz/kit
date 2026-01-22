import '@solana/test-matchers/toBeFrozenObject';

import {
    findTransactionPlan,
    getAllSingleTransactionPlans,
    nonDivisibleSequentialTransactionPlan,
    parallelTransactionPlan,
    sequentialTransactionPlan,
    singleTransactionPlan,
} from '../transaction-plan';
import { createMessage } from './__setup__';

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

describe('findTransactionPlan', () => {
    it('returns the plan itself when it matches the predicate', () => {
        const messageA = createMessage('A');
        const plan = singleTransactionPlan(messageA);
        const result = findTransactionPlan(plan, p => p.kind === 'single');
        expect(result).toBe(plan);
    });
    it('returns undefined when no plan matches the predicate', () => {
        const messageA = createMessage('A');
        const plan = singleTransactionPlan(messageA);
        const result = findTransactionPlan(plan, p => p.kind === 'parallel');
        expect(result).toBeUndefined();
    });
    it('finds a nested plan in a parallel structure', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const nestedSequential = sequentialTransactionPlan([messageA, messageB]);
        const plan = parallelTransactionPlan([nestedSequential]);
        const result = findTransactionPlan(plan, p => p.kind === 'sequential');
        expect(result).toBe(nestedSequential);
    });
    it('finds a nested plan in a sequential structure', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const nestedParallel = parallelTransactionPlan([messageA, messageB]);
        const plan = sequentialTransactionPlan([nestedParallel]);
        const result = findTransactionPlan(plan, p => p.kind === 'parallel');
        expect(result).toBe(nestedParallel);
    });
    it('returns the first matching plan in top-down order', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const innerSequential = sequentialTransactionPlan([messageA]);
        const outerSequential = sequentialTransactionPlan([innerSequential, messageB]);
        const result = findTransactionPlan(outerSequential, p => p.kind === 'sequential');
        expect(result).toBe(outerSequential);
    });
    it('finds a deeply nested plan', () => {
        const messageA = createMessage('A');
        const deepSingle = singleTransactionPlan(messageA);
        const plan = parallelTransactionPlan([sequentialTransactionPlan([parallelTransactionPlan([deepSingle])])]);
        const result = findTransactionPlan(plan, p => p.kind === 'single');
        expect(result).toBe(deepSingle);
    });
    it('supports complex predicates that inspect nested properties', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const messageC = createMessage('C');
        const targetPlan = sequentialTransactionPlan([messageA, messageB]);
        const plan = parallelTransactionPlan([singleTransactionPlan(messageC), targetPlan]);
        const result = findTransactionPlan(
            plan,
            // eslint-disable-next-line jest/no-conditional-in-test
            p => p.kind === 'sequential' && p.plans.length === 2,
        );
        expect(result).toBe(targetPlan);
    });
    it('returns undefined when searching an empty parallel plan', () => {
        const plan = parallelTransactionPlan([]);
        const result = findTransactionPlan(plan, p => p.kind === 'single');
        expect(result).toBeUndefined();
    });
    it('finds non-divisible sequential plans', () => {
        const messageA = createMessage('A');
        const messageB = createMessage('B');
        const nonDivisible = nonDivisibleSequentialTransactionPlan([messageA, messageB]);
        const plan = parallelTransactionPlan([sequentialTransactionPlan([createMessage('C')]), nonDivisible]);
        const result = findTransactionPlan(
            plan,
            // eslint-disable-next-line jest/no-conditional-in-test
            p => p.kind === 'sequential' && !p.divisible,
        );
        expect(result).toBe(nonDivisible);
    });
});
