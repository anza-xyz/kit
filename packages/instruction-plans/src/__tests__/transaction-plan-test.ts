import '@solana/test-matchers/toBeFrozenObject';

import {
    everyTransactionPlan,
    findTransactionPlan,
    getAllSingleTransactionPlans,
    nonDivisibleSequentialTransactionPlan,
    parallelTransactionPlan,
    sequentialTransactionPlan,
    singleTransactionPlan,
    transformTransactionPlan,
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

describe('everyTransactionPlan', () => {
    it('returns true when all plans match the predicate', () => {
        const plan = sequentialTransactionPlan([sequentialTransactionPlan([]), sequentialTransactionPlan([])]);
        const result = everyTransactionPlan(plan, p => p.kind === 'sequential');
        expect(result).toBe(true);
    });
    it('returns false when at least one plan does not match the predicate', () => {
        const plan = sequentialTransactionPlan([parallelTransactionPlan([]), sequentialTransactionPlan([])]);
        const result = everyTransactionPlan(plan, p => p.kind === 'sequential');
        expect(result).toBe(false);
    });
    it('matches single transaction plans', () => {
        const plan = singleTransactionPlan(createMessage('A'));
        const result = everyTransactionPlan(plan, p => p.kind === 'single');
        expect(result).toBe(true);
    });
    it('matches sequential transaction plans', () => {
        const plan = sequentialTransactionPlan([]);
        const result = everyTransactionPlan(plan, p => p.kind === 'sequential');
        expect(result).toBe(true);
    });
    it('matches non-divisible sequential transaction plans', () => {
        const plan = nonDivisibleSequentialTransactionPlan([]);
        // eslint-disable-next-line jest/no-conditional-in-test
        const result = everyTransactionPlan(plan, p => p.kind === 'sequential' && !p.divisible);
        expect(result).toBe(true);
    });
    it('matches parallel transaction plans', () => {
        const plan = parallelTransactionPlan([]);
        const result = everyTransactionPlan(plan, p => p.kind === 'parallel');
        expect(result).toBe(true);
    });
    it('matches complex transaction plans', () => {
        const plan = sequentialTransactionPlan([
            parallelTransactionPlan([createMessage('A'), createMessage('B')]),
            nonDivisibleSequentialTransactionPlan([createMessage('A'), createMessage('C')]),
        ]);
        const result = everyTransactionPlan(plan, p => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind !== 'single') return true;
            const message = p.message as ReturnType<typeof createMessage>;
            return ['A', 'B', 'C'].includes(message.id);
        });
        expect(result).toBe(true);
    });
    it('returns false on complex transaction plans', () => {
        const plan = sequentialTransactionPlan([
            parallelTransactionPlan([createMessage('A'), createMessage('B')]),
            nonDivisibleSequentialTransactionPlan([createMessage('A'), createMessage('C')]),
        ]);
        const result = everyTransactionPlan(plan, p => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind !== 'single') return true;
            const message = p.message as ReturnType<typeof createMessage>;
            return message.id === 'A';
        });
        expect(result).toBe(false);
    });
    it('fails fast before evaluating children', () => {
        const predicate = jest.fn().mockReturnValueOnce(false);
        const messageA = singleTransactionPlan(createMessage('A'));
        const messageB = singleTransactionPlan(createMessage('B'));
        const plan = sequentialTransactionPlan([messageA, messageB]);
        const result = everyTransactionPlan(plan, predicate);
        expect(result).toBe(false);
        expect(predicate).toHaveBeenCalledTimes(1);
        expect(predicate).toHaveBeenNthCalledWith(1, plan);
        expect(predicate).not.toHaveBeenCalledWith(messageA);
        expect(predicate).not.toHaveBeenCalledWith(messageB);
    });
    it('fails fast before evaluating siblings', () => {
        const predicate = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
        const messageA = singleTransactionPlan(createMessage('A'));
        const messageB = singleTransactionPlan(createMessage('B'));
        const plan = sequentialTransactionPlan([messageA, messageB]);
        const result = everyTransactionPlan(plan, predicate);
        expect(result).toBe(false);
        expect(predicate).toHaveBeenCalledTimes(2);
        expect(predicate).toHaveBeenNthCalledWith(1, plan);
        expect(predicate).toHaveBeenNthCalledWith(2, messageA);
        expect(predicate).not.toHaveBeenCalledWith(messageB);
    });
});

describe('transformTransactionPlan', () => {
    it('transforms single transaction plans', () => {
        const plan = singleTransactionPlan(createMessage('A'));
        const transformedPlan = transformTransactionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'single' ? { ...p, message: { ...p.message, id: 'New A' } } : p,
        );
        expect(transformedPlan).toStrictEqual(singleTransactionPlan(createMessage('New A')));
    });
    it('transforms sequential transaction plans', () => {
        const plan = sequentialTransactionPlan([createMessage('A'), createMessage('B')]);
        const transformedPlan = transformTransactionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'sequential' ? { ...p, plans: p.plans.reverse() } : p,
        );
        expect(transformedPlan).toStrictEqual(sequentialTransactionPlan([createMessage('B'), createMessage('A')]));
    });
    it('transforms non-divisible sequential transaction plans', () => {
        const plan = nonDivisibleSequentialTransactionPlan([createMessage('A'), createMessage('B')]);
        const transformedPlan = transformTransactionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'sequential' ? { ...p, plans: p.plans.reverse() } : p,
        );
        expect(transformedPlan).toStrictEqual(
            nonDivisibleSequentialTransactionPlan([createMessage('B'), createMessage('A')]),
        );
    });
    it('transforms parallel transaction plans', () => {
        const plan = parallelTransactionPlan([createMessage('A'), createMessage('B')]);
        const transformedPlan = transformTransactionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'parallel' ? { ...p, plans: p.plans.reverse() } : p,
        );
        expect(transformedPlan).toStrictEqual(parallelTransactionPlan([createMessage('B'), createMessage('A')]));
    });
    it('transforms using a bottom-up approach', () => {
        // Given the following nested plans.
        const plan = sequentialTransactionPlan([
            createMessage('A'),
            sequentialTransactionPlan([createMessage('B'), createMessage('C')]),
        ]);

        // And given an array of message IDs that were seen by sequential plans during transformation.
        const seenTransactionMessageIds: string[] = [];

        // When transforming by prepending "New " to single transaction plan IDs
        // And recording the seen transaction message IDs in sequential plans.
        transformTransactionPlan(plan, p => {
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
    it('can be used to duplicate transactions', () => {
        const plan = sequentialTransactionPlan([createMessage('A'), createMessage('B')]);
        const transformedPlan = transformTransactionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'single' ? sequentialTransactionPlan([p.message, p.message]) : p,
        );
        expect(transformedPlan).toStrictEqual(
            sequentialTransactionPlan([
                sequentialTransactionPlan([createMessage('A'), createMessage('A')]),
                sequentialTransactionPlan([createMessage('B'), createMessage('B')]),
            ]),
        );
    });
    it('can be used to remove parallelism', () => {
        const plan = parallelTransactionPlan([createMessage('A'), createMessage('B')]);
        const transformedPlan = transformTransactionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'parallel' ? sequentialTransactionPlan(p.plans) : p,
        );
        expect(transformedPlan).toStrictEqual(sequentialTransactionPlan([createMessage('A'), createMessage('B')]));
    });
    it('can be used to flatten nested transaction plans', () => {
        const plan = sequentialTransactionPlan([
            sequentialTransactionPlan([createMessage('A'), createMessage('B')]),
            sequentialTransactionPlan([
                createMessage('C'),
                sequentialTransactionPlan([createMessage('D'), createMessage('E')]),
            ]),
        ]);
        const transformedPlan = transformTransactionPlan(plan, p => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind !== 'sequential') return p;
            const subPlans = p.plans.flatMap(subPlan =>
                // eslint-disable-next-line jest/no-conditional-in-test
                subPlan.kind === 'sequential' && p.divisible === subPlan.divisible ? subPlan.plans : [subPlan],
            );
            return { ...p, plans: subPlans };
        });
        expect(transformedPlan).toStrictEqual(
            sequentialTransactionPlan([
                createMessage('A'),
                createMessage('B'),
                createMessage('C'),
                createMessage('D'),
                createMessage('E'),
            ]),
        );
    });
    it('keeps transformed single transaction plans frozen', () => {
        const plan = singleTransactionPlan(createMessage('A'));
        const transformedPlan = transformTransactionPlan(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
    });
    it('keeps transformed sequential transaction plans frozen', () => {
        const plan = sequentialTransactionPlan([createMessage('A')]);
        const transformedPlan = transformTransactionPlan(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
    });
    it('keeps transformed parallel transaction plans frozen', () => {
        const plan = parallelTransactionPlan([createMessage('A')]);
        const transformedPlan = transformTransactionPlan(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
    });
});
