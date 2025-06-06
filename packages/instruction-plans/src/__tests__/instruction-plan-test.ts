import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { pipe } from '@solana/functional';
import { Instruction } from '@solana/instructions';
import {
    CompilableTransactionMessage,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/transaction-messages';
import { getTransactionMessageSize, TRANSACTION_SIZE_LIMIT } from '@solana/transactions';

import {
    getIterableInstructionPlanFromInstructions,
    getLinearIterableInstructionPlan,
    getReallocIterableInstructionPlan,
    nonDivisibleSequentialInstructionPlan,
    parallelInstructionPlan,
    sequentialInstructionPlan,
    singleInstructionPlan,
} from '../instruction-plan';

jest.mock('@solana/transactions', () => ({
    ...jest.requireActual('@solana/transactions'),
    getTransactionMessageSize: jest.fn(),
}));

function createInstruction<TId extends string>(id: TId): Instruction & { id: TId } {
    return { id, programAddress: '11111111111111111111111111111111' as Address };
}

describe('singleInstructionPlan', () => {
    it('creates SingleInstructionPlan objects', () => {
        const instruction = createInstruction('A');
        const plan = singleInstructionPlan(instruction);
        expect(plan).toEqual({ instruction, kind: 'single' });
    });
    it('freezes created SingleInstructionPlan objects', () => {
        const instruction = createInstruction('A');
        const plan = singleInstructionPlan(instruction);
        expect(plan).toBeFrozenObject();
    });
});

describe('parallelInstructionPlan', () => {
    it('creates ParallelInstructionPlan objects from other plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = parallelInstructionPlan([
            singleInstructionPlan(instructionA),
            singleInstructionPlan(instructionB),
        ]);
        expect(plan).toEqual({
            kind: 'parallel',
            plans: [singleInstructionPlan(instructionA), singleInstructionPlan(instructionB)],
        });
    });
    it('accepts instructions directly and wrap them in single plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = parallelInstructionPlan([instructionA, instructionB]);
        expect(plan).toEqual({
            kind: 'parallel',
            plans: [singleInstructionPlan(instructionA), singleInstructionPlan(instructionB)],
        });
    });
    it('can nest other parallel plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const instructionC = createInstruction('C');
        const plan = parallelInstructionPlan([instructionA, parallelInstructionPlan([instructionB, instructionC])]);
        expect(plan).toEqual({
            kind: 'parallel',
            plans: [
                singleInstructionPlan(instructionA),
                { kind: 'parallel', plans: [singleInstructionPlan(instructionB), singleInstructionPlan(instructionC)] },
            ],
        });
    });
    it('freezes created ParallelInstructionPlan objects', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = parallelInstructionPlan([instructionA, instructionB]);
        expect(plan).toBeFrozenObject();
    });
});

describe('sequentialInstructionPlan', () => {
    it('creates divisible SequentialInstructionPlan objects from other plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = sequentialInstructionPlan([
            singleInstructionPlan(instructionA),
            singleInstructionPlan(instructionB),
        ]);
        expect(plan).toEqual({
            divisible: true,
            kind: 'sequential',
            plans: [singleInstructionPlan(instructionA), singleInstructionPlan(instructionB)],
        });
    });
    it('accepts instructions directly and wrap them in single plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = sequentialInstructionPlan([instructionA, instructionB]);
        expect(plan).toEqual({
            divisible: true,
            kind: 'sequential',
            plans: [singleInstructionPlan(instructionA), singleInstructionPlan(instructionB)],
        });
    });
    it('can nest other sequential plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const instructionC = createInstruction('C');
        const plan = sequentialInstructionPlan([instructionA, sequentialInstructionPlan([instructionB, instructionC])]);
        expect(plan).toEqual({
            divisible: true,
            kind: 'sequential',
            plans: [
                singleInstructionPlan(instructionA),
                {
                    divisible: true,
                    kind: 'sequential',
                    plans: [singleInstructionPlan(instructionB), singleInstructionPlan(instructionC)],
                },
            ],
        });
    });
    it('freezes created SequentialInstructionPlan objects', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = sequentialInstructionPlan([instructionA, instructionB]);
        expect(plan).toBeFrozenObject();
    });
});

describe('nonDivisibleSequentialInstructionPlan', () => {
    it('creates non-divisible SequentialInstructionPlan objects from other plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = nonDivisibleSequentialInstructionPlan([
            singleInstructionPlan(instructionA),
            singleInstructionPlan(instructionB),
        ]);
        expect(plan).toEqual({
            divisible: false,
            kind: 'sequential',
            plans: [singleInstructionPlan(instructionA), singleInstructionPlan(instructionB)],
        });
    });
    it('accepts instructions directly and wrap them in single plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = nonDivisibleSequentialInstructionPlan([instructionA, instructionB]);
        expect(plan).toEqual({
            divisible: false,
            kind: 'sequential',
            plans: [singleInstructionPlan(instructionA), singleInstructionPlan(instructionB)],
        });
    });
    it('can nest other non-divisible sequential plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const instructionC = createInstruction('C');
        const plan = nonDivisibleSequentialInstructionPlan([
            instructionA,
            nonDivisibleSequentialInstructionPlan([instructionB, instructionC]),
        ]);
        expect(plan).toEqual({
            divisible: false,
            kind: 'sequential',
            plans: [
                singleInstructionPlan(instructionA),
                {
                    divisible: false,
                    kind: 'sequential',
                    plans: [singleInstructionPlan(instructionB), singleInstructionPlan(instructionC)],
                },
            ],
        });
    });
    it('freezes created SequentialInstructionPlan objects', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = nonDivisibleSequentialInstructionPlan([instructionA, instructionB]);
        expect(plan).toBeFrozenObject();
    });
});

describe('getLinearIterableInstructionPlan', () => {
    let message: CompilableTransactionMessage;
    beforeEach(() => {
        message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer('E9Nykp3rSdza2moQutaJ3K3RSC8E5iFERX2SqLTsQfjJ' as Address, m),
            // TODO(loris): Either remove lifetime constraint or use the new
            // `fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash`
            // function from https://github.com/anza-xyz/kit/pull/519.
            m =>
                setTransactionMessageLifetimeUsingBlockhash(
                    {} as Parameters<typeof setTransactionMessageLifetimeUsingBlockhash>[0],
                    m,
                ),
        );
    });
    it('creates IterableInstructionPlan objects by splitting instructions until we reach the total bytes required', () => {
        jest.mocked(getTransactionMessageSize).mockReturnValue(100);
        const expectedLength = TRANSACTION_SIZE_LIMIT - 100 - 1;

        const plan = getLinearIterableInstructionPlan({
            getInstruction: (offset: number, length: number) => createInstruction(`[${offset},${offset + length})`),
            totalLength: 2000,
        });

        const iterator = plan.getIterator();
        expect(iterator.hasNext()).toBe(true);
        expect(iterator.next(message)).toEqual(createInstruction(`[0,${expectedLength})`));
        expect(iterator.hasNext()).toBe(true);
        expect(iterator.next(message)).toEqual(createInstruction(`[${expectedLength},2000)`));
        expect(iterator.hasNext()).toBe(false);
        expect(iterator.next(message)).toBeNull();
    });
    it('offers a `getAll` method that packs everything into a single instruction', () => {
        const plan = getLinearIterableInstructionPlan({
            getInstruction: (offset: number, length: number) => createInstruction(`[${offset},${offset + length})`),
            totalLength: 2000,
        });
        expect(plan.getAll()).toEqual([createInstruction(`[0,2000)`)]);
    });
    it('freezes created IterableInstructionPlan objects', () => {
        const plan = getLinearIterableInstructionPlan({
            getInstruction: (offset: number, length: number) => createInstruction(`[${offset},${offset + length})`),
            totalLength: 2000,
        });
        expect(plan).toBeFrozenObject();
    });
    it('freezes the iterator returned by getIterator', () => {
        const plan = getLinearIterableInstructionPlan({
            getInstruction: (offset: number, length: number) => createInstruction(`[${offset},${offset + length})`),
            totalLength: 2000,
        });
        expect(plan.getIterator()).toBeFrozenObject();
    });
});

describe('getIterableInstructionPlanFromInstructions', () => {
    let message: CompilableTransactionMessage;
    beforeEach(() => {
        message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer('E9Nykp3rSdza2moQutaJ3K3RSC8E5iFERX2SqLTsQfjJ' as Address, m),
            // TODO(loris): Either remove lifetime constraint or use the new
            // `fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash`
            // function from https://github.com/anza-xyz/kit/pull/519.
            m =>
                setTransactionMessageLifetimeUsingBlockhash(
                    {} as Parameters<typeof setTransactionMessageLifetimeUsingBlockhash>[0],
                    m,
                ),
        );
    });
    it('creates IterableInstructionPlan objects by providing the iterated instruction in advance', () => {
        const plan = getIterableInstructionPlanFromInstructions([createInstruction('A'), createInstruction('B')]);

        const iterator = plan.getIterator();
        expect(iterator.hasNext()).toBe(true);
        expect(iterator.next(message)).toEqual(createInstruction('A'));
        expect(iterator.hasNext()).toBe(true);
        expect(iterator.next(message)).toEqual(createInstruction('B'));
        expect(iterator.hasNext()).toBe(false);
        expect(iterator.next(message)).toBeNull();
    });
    it('offers a `getAll` method that returns all instructions at once', () => {
        const plan = getIterableInstructionPlanFromInstructions([createInstruction('A'), createInstruction('B')]);
        expect(plan.getAll()).toEqual([createInstruction('A'), createInstruction('B')]);
    });
    it('freezes created IterableInstructionPlan objects', () => {
        const plan = getIterableInstructionPlanFromInstructions([createInstruction('A'), createInstruction('B')]);
        expect(plan).toBeFrozenObject();
    });
    it('freezes the iterator returned by getIterator', () => {
        const plan = getIterableInstructionPlanFromInstructions([createInstruction('A'), createInstruction('B')]);
        expect(plan.getIterator()).toBeFrozenObject();
    });
});

describe('getReallocIterableInstructionPlan', () => {
    let message: CompilableTransactionMessage;
    beforeEach(() => {
        message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer('E9Nykp3rSdza2moQutaJ3K3RSC8E5iFERX2SqLTsQfjJ' as Address, m),
            // TODO(loris): Either remove lifetime constraint or use the new
            // `fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash`
            // function from https://github.com/anza-xyz/kit/pull/519.
            m =>
                setTransactionMessageLifetimeUsingBlockhash(
                    {} as Parameters<typeof setTransactionMessageLifetimeUsingBlockhash>[0],
                    m,
                ),
        );
    });
    it('creates IterableInstructionPlan objects by chunking instruction using the `REALLOC_LIMIT`', () => {
        const plan = getReallocIterableInstructionPlan({
            getInstruction: (size: number) => createInstruction(`Size: ${size}`),
            totalSize: 15_000,
        });

        const iterator = plan.getIterator();
        expect(iterator.hasNext()).toBe(true);
        expect(iterator.next(message)).toEqual(createInstruction('Size: 10240')); // REALLOC_LIMIT
        expect(iterator.hasNext()).toBe(true);
        expect(iterator.next(message)).toEqual(createInstruction('Size: 4760')); // 15000 - REALLOC_LIMIT
        expect(iterator.hasNext()).toBe(false);
        expect(iterator.next(message)).toBeNull();
    });
    it('offers a `getAll` method that returns all realloc instructions at once', () => {
        const plan = getReallocIterableInstructionPlan({
            getInstruction: (size: number) => createInstruction(`Size: ${size}`),
            totalSize: 15_000,
        });
        expect(plan.getAll()).toEqual([createInstruction('Size: 10240'), createInstruction('Size: 4760')]);
    });
    it('freezes created IterableInstructionPlan objects', () => {
        const plan = getReallocIterableInstructionPlan({
            getInstruction: (size: number) => createInstruction(`Size: ${size}`),
            totalSize: 15_000,
        });
        expect(plan).toBeFrozenObject();
    });
    it('freezes the iterator returned by getIterator', () => {
        const plan = getReallocIterableInstructionPlan({
            getInstruction: (size: number) => createInstruction(`Size: ${size}`),
            totalSize: 15_000,
        });
        expect(plan.getIterator()).toBeFrozenObject();
    });
});
