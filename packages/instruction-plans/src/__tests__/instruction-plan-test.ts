import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN,
    SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE,
    SolanaError,
} from '@solana/errors';
import { pipe } from '@solana/functional';
import { Instruction } from '@solana/instructions';
import {
    appendTransactionMessageInstruction,
    BaseTransactionMessage,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import { getTransactionMessageSize, TRANSACTION_SIZE_LIMIT } from '@solana/transactions';

import {
    everyInstructionPlan,
    findInstructionPlan,
    getLinearMessagePackerInstructionPlan,
    getMessagePackerInstructionPlanFromInstructions,
    getReallocMessagePackerInstructionPlan,
    MessagePackerInstructionPlan,
    nonDivisibleSequentialInstructionPlan,
    parallelInstructionPlan,
    sequentialInstructionPlan,
    singleInstructionPlan,
    transformInstructionPlan,
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
        expect(plan).toStrictEqual({ instruction, kind: 'single' });
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
        expect(plan).toStrictEqual({
            kind: 'parallel',
            plans: [singleInstructionPlan(instructionA), singleInstructionPlan(instructionB)],
        });
    });
    it('accepts instructions directly and wrap them in single plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = parallelInstructionPlan([instructionA, instructionB]);
        expect(plan).toStrictEqual({
            kind: 'parallel',
            plans: [singleInstructionPlan(instructionA), singleInstructionPlan(instructionB)],
        });
    });
    it('can nest other parallel plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const instructionC = createInstruction('C');
        const plan = parallelInstructionPlan([instructionA, parallelInstructionPlan([instructionB, instructionC])]);
        expect(plan).toStrictEqual({
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
        expect(plan).toStrictEqual({
            divisible: true,
            kind: 'sequential',
            plans: [singleInstructionPlan(instructionA), singleInstructionPlan(instructionB)],
        });
    });
    it('accepts instructions directly and wrap them in single plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = sequentialInstructionPlan([instructionA, instructionB]);
        expect(plan).toStrictEqual({
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
        expect(plan).toStrictEqual({
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
        expect(plan).toStrictEqual({
            divisible: false,
            kind: 'sequential',
            plans: [singleInstructionPlan(instructionA), singleInstructionPlan(instructionB)],
        });
    });
    it('accepts instructions directly and wrap them in single plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = nonDivisibleSequentialInstructionPlan([instructionA, instructionB]);
        expect(plan).toStrictEqual({
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
        expect(plan).toStrictEqual({
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

describe('getLinearMessagePackerInstructionPlan', () => {
    let message: BaseTransactionMessage & TransactionMessageWithFeePayer;
    beforeEach(() => {
        message = pipe(createTransactionMessage({ version: 0 }), m =>
            setTransactionMessageFeePayer('E9Nykp3rSdza2moQutaJ3K3RSC8E5iFERX2SqLTsQfjJ' as Address, m),
        );
    });
    it('creates MessagePackerInstructionPlan objects by splitting instructions until we reach the total bytes required', () => {
        jest.mocked(getTransactionMessageSize).mockReturnValue(100);
        const expectedLength = TRANSACTION_SIZE_LIMIT - 100 - 1;

        const plan = getLinearMessagePackerInstructionPlan({
            getInstruction: (offset: number, length: number) => createInstruction(`[${offset},${offset + length})`),
            totalLength: 2000,
        });

        const messagePacker = plan.getMessagePacker();
        expect(messagePacker.done()).toBe(false);
        expect(messagePacker.packMessageToCapacity(message).instructions[0]).toStrictEqual(
            createInstruction(`[0,${expectedLength})`),
        );
        expect(messagePacker.done()).toBe(false);
        expect(messagePacker.packMessageToCapacity(message).instructions[0]).toStrictEqual(
            createInstruction(`[${expectedLength},2000)`),
        );
        expect(messagePacker.done()).toBe(true);
        expect(() => messagePacker.packMessageToCapacity(message)).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE),
        );
    });
    it('freezes created MessagePackerInstructionPlan objects', () => {
        const plan = getLinearMessagePackerInstructionPlan({
            getInstruction: (offset: number, length: number) => createInstruction(`[${offset},${offset + length})`),
            totalLength: 2000,
        });
        expect(plan).toBeFrozenObject();
    });
    it("throws if there isn't enough space on the provided message", () => {
        jest.mocked(getTransactionMessageSize).mockReturnValueOnce(TRANSACTION_SIZE_LIMIT + 50);
        jest.mocked(getTransactionMessageSize).mockReturnValueOnce(TRANSACTION_SIZE_LIMIT - 50);
        const plan = getLinearMessagePackerInstructionPlan({
            getInstruction: () => createInstruction('ignored'),
            totalLength: 2000,
        });

        const messagePacker = plan.getMessagePacker();
        expect(() => messagePacker.packMessageToCapacity(message)).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, {
                numBytesRequired: 101,
                numFreeBytes: 49,
            }),
        );
    });
    it('freezes the messagePacker returned by getMessagePacker', () => {
        const plan = getLinearMessagePackerInstructionPlan({
            getInstruction: (offset: number, length: number) => createInstruction(`[${offset},${offset + length})`),
            totalLength: 2000,
        });
        expect(plan.getMessagePacker()).toBeFrozenObject();
    });
});

describe('getMessagePackerInstructionPlanFromInstructions', () => {
    let message: BaseTransactionMessage & TransactionMessageWithFeePayer;
    beforeEach(() => {
        message = pipe(createTransactionMessage({ version: 0 }), m =>
            setTransactionMessageFeePayer('E9Nykp3rSdza2moQutaJ3K3RSC8E5iFERX2SqLTsQfjJ' as Address, m),
        );
    });
    it('creates MessagePackerInstructionPlan objects by providing the iterated instruction in advance', () => {
        const plan = getMessagePackerInstructionPlanFromInstructions([createInstruction('A'), createInstruction('B')]);

        const messagePacker = plan.getMessagePacker();
        expect(messagePacker.done()).toBe(false);
        expect(messagePacker.packMessageToCapacity(message).instructions).toStrictEqual([
            createInstruction('A'),
            createInstruction('B'),
        ]);
        expect(messagePacker.done()).toBe(true);
        expect(() => messagePacker.packMessageToCapacity(message)).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE),
        );
    });
    it("throws if there isn't enough space on the provided message", () => {
        jest.mocked(getTransactionMessageSize).mockReturnValueOnce(TRANSACTION_SIZE_LIMIT - 100);
        jest.mocked(getTransactionMessageSize).mockReturnValueOnce(TRANSACTION_SIZE_LIMIT + 50);
        const plan = getMessagePackerInstructionPlanFromInstructions([createInstruction('A'), createInstruction('B')]);

        const messagePacker = plan.getMessagePacker();
        expect(() => messagePacker.packMessageToCapacity(message)).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, {
                numBytesRequired: 150,
                numFreeBytes: 100,
            }),
        );
    });
    it('freezes created MessagePackerInstructionPlan objects', () => {
        const plan = getMessagePackerInstructionPlanFromInstructions([createInstruction('A'), createInstruction('B')]);
        expect(plan).toBeFrozenObject();
    });
    it('freezes the messagePacker returned by getMessagePacker', () => {
        const plan = getMessagePackerInstructionPlanFromInstructions([createInstruction('A'), createInstruction('B')]);
        expect(plan.getMessagePacker()).toBeFrozenObject();
    });
});

describe('getReallocMessagePackerInstructionPlan', () => {
    let message: BaseTransactionMessage & TransactionMessageWithFeePayer;
    beforeEach(() => {
        message = pipe(createTransactionMessage({ version: 0 }), m =>
            setTransactionMessageFeePayer('E9Nykp3rSdza2moQutaJ3K3RSC8E5iFERX2SqLTsQfjJ' as Address, m),
        );
    });
    it('creates MessagePackerInstructionPlan objects by chunking instruction using the `REALLOC_LIMIT`', () => {
        const plan = getReallocMessagePackerInstructionPlan({
            getInstruction: (size: number) => createInstruction(`Size: ${size}`),
            totalSize: 15_000,
        });

        const messagePacker = plan.getMessagePacker();
        expect(messagePacker.done()).toBe(false);
        expect(messagePacker.packMessageToCapacity(message).instructions).toStrictEqual([
            createInstruction('Size: 10240'), // REALLOC_LIMIT
            createInstruction('Size: 4760'), // 15000 - REALLOC_LIMIT
        ]);
        expect(messagePacker.done()).toBe(true);
        expect(() => messagePacker.packMessageToCapacity(message)).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_PACKER_ALREADY_COMPLETE),
        );
    });
    it("throws if there isn't enough space on the provided message", () => {
        jest.mocked(getTransactionMessageSize).mockReturnValueOnce(TRANSACTION_SIZE_LIMIT - 100);
        jest.mocked(getTransactionMessageSize).mockReturnValueOnce(TRANSACTION_SIZE_LIMIT + 50);
        const plan = getReallocMessagePackerInstructionPlan({
            getInstruction: () => createInstruction('ignored'),
            totalSize: 15_000,
        });

        const messagePacker = plan.getMessagePacker();
        expect(() => messagePacker.packMessageToCapacity(message)).toThrow(
            new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, {
                numBytesRequired: 150,
                numFreeBytes: 100,
            }),
        );
    });
    it('freezes created MessagePackerInstructionPlan objects', () => {
        const plan = getReallocMessagePackerInstructionPlan({
            getInstruction: (size: number) => createInstruction(`Size: ${size}`),
            totalSize: 15_000,
        });
        expect(plan).toBeFrozenObject();
    });
    it('freezes the messagePacker returned by getMessagePacker', () => {
        const plan = getReallocMessagePackerInstructionPlan({
            getInstruction: (size: number) => createInstruction(`Size: ${size}`),
            totalSize: 15_000,
        });
        expect(plan.getMessagePacker()).toBeFrozenObject();
    });
});

describe('findInstructionPlan', () => {
    it('returns the plan itself when it matches the predicate', () => {
        const instructionA = createInstruction('A');
        const plan = singleInstructionPlan(instructionA);
        const result = findInstructionPlan(plan, p => p.kind === 'single');
        expect(result).toBe(plan);
    });
    it('returns undefined when no plan matches the predicate', () => {
        const instructionA = createInstruction('A');
        const plan = singleInstructionPlan(instructionA);
        const result = findInstructionPlan(plan, p => p.kind === 'parallel');
        expect(result).toBeUndefined();
    });
    it('finds a nested plan in a parallel structure', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const nestedSequential = sequentialInstructionPlan([instructionA, instructionB]);
        const plan = parallelInstructionPlan([nestedSequential]);
        const result = findInstructionPlan(plan, p => p.kind === 'sequential');
        expect(result).toBe(nestedSequential);
    });
    it('finds a nested plan in a sequential structure', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const nestedParallel = parallelInstructionPlan([instructionA, instructionB]);
        const plan = sequentialInstructionPlan([nestedParallel]);
        const result = findInstructionPlan(plan, p => p.kind === 'parallel');
        expect(result).toBe(nestedParallel);
    });
    it('returns the first matching plan in top-down order', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const innerSequential = sequentialInstructionPlan([instructionA]);
        const outerSequential = sequentialInstructionPlan([innerSequential, instructionB]);
        const result = findInstructionPlan(outerSequential, p => p.kind === 'sequential');
        expect(result).toBe(outerSequential);
    });
    it('finds a deeply nested plan', () => {
        const instructionA = createInstruction('A');
        const deepSingle = singleInstructionPlan(instructionA);
        const plan = parallelInstructionPlan([sequentialInstructionPlan([parallelInstructionPlan([deepSingle])])]);
        const result = findInstructionPlan(plan, p => p.kind === 'single');
        expect(result).toBe(deepSingle);
    });
    it('supports complex predicates that inspect nested properties', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const instructionC = createInstruction('C');
        const targetPlan = sequentialInstructionPlan([instructionA, instructionB]);
        const plan = parallelInstructionPlan([singleInstructionPlan(instructionC), targetPlan]);
        const result = findInstructionPlan(
            plan,
            // eslint-disable-next-line jest/no-conditional-in-test
            p => p.kind === 'sequential' && p.plans.length === 2,
        );
        expect(result).toBe(targetPlan);
    });
    it('returns undefined when searching an empty parallel plan', () => {
        const plan = parallelInstructionPlan([]);
        const result = findInstructionPlan(plan, p => p.kind === 'single');
        expect(result).toBeUndefined();
    });
    it('finds non-divisible sequential plans', () => {
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const nonDivisible = nonDivisibleSequentialInstructionPlan([instructionA, instructionB]);
        const plan = parallelInstructionPlan([sequentialInstructionPlan([createInstruction('C')]), nonDivisible]);
        const result = findInstructionPlan(
            plan,
            // eslint-disable-next-line jest/no-conditional-in-test
            p => p.kind === 'sequential' && !p.divisible,
        );
        expect(result).toBe(nonDivisible);
    });
    it('returns undefined when searching a messagePacker plan that does not match', () => {
        const messagePackerPlan = getMessagePackerInstructionPlanFromInstructions([createInstruction('A')]);
        const result = findInstructionPlan(messagePackerPlan, p => p.kind === 'single');
        expect(result).toBeUndefined();
    });
    it('finds a messagePacker plan when it matches the predicate', () => {
        const messagePackerPlan = getMessagePackerInstructionPlanFromInstructions([createInstruction('A')]);
        const plan = parallelInstructionPlan([singleInstructionPlan(createInstruction('B')), messagePackerPlan]);
        const result = findInstructionPlan(plan, p => p.kind === 'messagePacker');
        expect(result).toBe(messagePackerPlan);
    });
});

describe('everyInstructionPlan', () => {
    it('returns true when all plans match the predicate', () => {
        const plan = sequentialInstructionPlan([sequentialInstructionPlan([]), sequentialInstructionPlan([])]);
        const result = everyInstructionPlan(plan, p => p.kind === 'sequential');
        expect(result).toBe(true);
    });
    it('returns false when at least one plan does not match the predicate', () => {
        const plan = sequentialInstructionPlan([parallelInstructionPlan([]), sequentialInstructionPlan([])]);
        const result = everyInstructionPlan(plan, p => p.kind === 'sequential');
        expect(result).toBe(false);
    });
    it('matches single instruction plans', () => {
        const plan = singleInstructionPlan(createInstruction('A'));
        const result = everyInstructionPlan(plan, p => p.kind === 'single');
        expect(result).toBe(true);
    });
    it('matches sequential instruction plans', () => {
        const plan = sequentialInstructionPlan([]);
        const result = everyInstructionPlan(plan, p => p.kind === 'sequential');
        expect(result).toBe(true);
    });
    it('matches non-divisible sequential instruction plans', () => {
        const plan = nonDivisibleSequentialInstructionPlan([]);
        // eslint-disable-next-line jest/no-conditional-in-test
        const result = everyInstructionPlan(plan, p => p.kind === 'sequential' && !p.divisible);
        expect(result).toBe(true);
    });
    it('matches parallel instruction plans', () => {
        const plan = parallelInstructionPlan([]);
        const result = everyInstructionPlan(plan, p => p.kind === 'parallel');
        expect(result).toBe(true);
    });
    it('matches message packer instruction plans', () => {
        const plan = getMessagePackerInstructionPlanFromInstructions([createInstruction('A')]);
        const result = everyInstructionPlan(plan, p => p.kind === 'messagePacker');
        expect(result).toBe(true);
    });
    it('matches complex instruction plans', () => {
        const plan = sequentialInstructionPlan([
            parallelInstructionPlan([createInstruction('A'), createInstruction('B')]),
            nonDivisibleSequentialInstructionPlan([createInstruction('A'), createInstruction('C')]),
        ]);
        const result = everyInstructionPlan(plan, p => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind !== 'single') return true;
            const instruction = p.instruction as ReturnType<typeof createInstruction>;
            return ['A', 'B', 'C'].includes(instruction.id);
        });
        expect(result).toBe(true);
    });
    it('returns false on complex instruction plans', () => {
        const plan = sequentialInstructionPlan([
            parallelInstructionPlan([createInstruction('A'), createInstruction('B')]),
            nonDivisibleSequentialInstructionPlan([createInstruction('A'), createInstruction('C')]),
        ]);
        const result = everyInstructionPlan(plan, p => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind !== 'single') return true;
            const instruction = p.instruction as ReturnType<typeof createInstruction>;
            return instruction.id === 'A';
        });
        expect(result).toBe(false);
    });
    it('fails fast before evaluating children', () => {
        const predicate = jest.fn().mockReturnValueOnce(false);
        const instructionA = singleInstructionPlan(createInstruction('A'));
        const instructionB = singleInstructionPlan(createInstruction('B'));
        const plan = sequentialInstructionPlan([instructionA, instructionB]);
        const result = everyInstructionPlan(plan, predicate);
        expect(result).toBe(false);
        expect(predicate).toHaveBeenCalledTimes(1);
        expect(predicate).toHaveBeenNthCalledWith(1, plan);
        expect(predicate).not.toHaveBeenCalledWith(instructionA);
        expect(predicate).not.toHaveBeenCalledWith(instructionB);
    });
    it('fails fast before evaluating siblings', () => {
        const predicate = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
        const instructionA = singleInstructionPlan(createInstruction('A'));
        const instructionB = singleInstructionPlan(createInstruction('B'));
        const plan = sequentialInstructionPlan([instructionA, instructionB]);
        const result = everyInstructionPlan(plan, predicate);
        expect(result).toBe(false);
        expect(predicate).toHaveBeenCalledTimes(2);
        expect(predicate).toHaveBeenNthCalledWith(1, plan);
        expect(predicate).toHaveBeenNthCalledWith(2, instructionA);
        expect(predicate).not.toHaveBeenCalledWith(instructionB);
    });
});

describe('transformInstructionPlan', () => {
    it('transforms single instruction plans', () => {
        const plan = singleInstructionPlan(createInstruction('A'));
        const transformedPlan = transformInstructionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'single' ? { ...p, instruction: { ...p.instruction, id: 'New A' } } : p,
        );
        expect(transformedPlan).toStrictEqual(singleInstructionPlan(createInstruction('New A')));
    });
    it('transforms message packer instruction plans', () => {
        const plan = getMessagePackerInstructionPlanFromInstructions([createInstruction('A')]);
        const transformedPlan = transformInstructionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'messagePacker'
                ? getMessagePackerInstructionPlanFromInstructions([createInstruction('New A')])
                : p,
        );
        const messagePacker = (transformedPlan as MessagePackerInstructionPlan).getMessagePacker();
        const message = pipe(createTransactionMessage({ version: 0 }), m =>
            setTransactionMessageFeePayer('4BpnH9U3n8S4miGz4HYT8LPHrQfa9m3zTDeMaka1g6as' as Address, m),
        );
        const packedMessage = messagePacker.packMessageToCapacity(message);
        expect(messagePacker.done()).toBe(true);
        expect(packedMessage).toStrictEqual(appendTransactionMessageInstruction(createInstruction('New A'), message));
    });
    it('transforms sequential instruction plans', () => {
        const plan = sequentialInstructionPlan([createInstruction('A'), createInstruction('B')]);
        const transformedPlan = transformInstructionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'sequential' ? { ...p, plans: p.plans.reverse() } : p,
        );
        expect(transformedPlan).toStrictEqual(
            sequentialInstructionPlan([createInstruction('B'), createInstruction('A')]),
        );
    });
    it('transforms non-divisible sequential instruction plans', () => {
        const plan = nonDivisibleSequentialInstructionPlan([createInstruction('A'), createInstruction('B')]);
        const transformedPlan = transformInstructionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'sequential' ? { ...p, plans: p.plans.reverse() } : p,
        );
        expect(transformedPlan).toStrictEqual(
            nonDivisibleSequentialInstructionPlan([createInstruction('B'), createInstruction('A')]),
        );
    });
    it('transforms parallel instruction plans', () => {
        const plan = parallelInstructionPlan([createInstruction('A'), createInstruction('B')]);
        const transformedPlan = transformInstructionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'parallel' ? { ...p, plans: p.plans.reverse() } : p,
        );
        expect(transformedPlan).toStrictEqual(
            parallelInstructionPlan([createInstruction('B'), createInstruction('A')]),
        );
    });
    it('transforms using a bottom-up approach', () => {
        // Given the following nested plans.
        const plan = sequentialInstructionPlan([
            createInstruction('A'),
            sequentialInstructionPlan([createInstruction('B'), createInstruction('C')]),
        ]);

        // And given an array of instruction IDs that were seen by sequential plans during transformation.
        const seenInstructionIds: string[] = [];

        // When transforming by prepending "New " to single instruction plan IDs
        // And recording the seen instruction IDs in sequential plans.
        transformInstructionPlan(plan, p => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind === 'single') {
                const instruction = p.instruction as ReturnType<typeof createInstruction>;
                return { ...p, instruction: { ...instruction, id: `New ${instruction.id}` } };
            }
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind === 'sequential') {
                const seenInstructions = p.plans
                    .filter(subPlan => subPlan.kind === 'single')
                    .map(subPlan => subPlan.instruction as ReturnType<typeof createInstruction>);
                seenInstructionIds.push(...seenInstructions.map(instruction => instruction.id));
            }
            return p;
        });

        // Then we expect the seen instruction IDs to have already been transformed
        // using a bottom-up approach.
        expect(seenInstructionIds).toStrictEqual(['New B', 'New C', 'New A']);
    });
    it('can be used to duplicate instructions', () => {
        const plan = sequentialInstructionPlan([createInstruction('A'), createInstruction('B')]);
        const transformedPlan = transformInstructionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'single' ? sequentialInstructionPlan([p.instruction, p.instruction]) : p,
        );
        expect(transformedPlan).toStrictEqual(
            sequentialInstructionPlan([
                sequentialInstructionPlan([createInstruction('A'), createInstruction('A')]),
                sequentialInstructionPlan([createInstruction('B'), createInstruction('B')]),
            ]),
        );
    });
    it('can be used to remove parallelism', () => {
        const plan = parallelInstructionPlan([createInstruction('A'), createInstruction('B')]);
        const transformedPlan = transformInstructionPlan(plan, p =>
            // eslint-disable-next-line jest/no-conditional-in-test
            p.kind === 'parallel' ? sequentialInstructionPlan(p.plans) : p,
        );
        expect(transformedPlan).toStrictEqual(
            sequentialInstructionPlan([createInstruction('A'), createInstruction('B')]),
        );
    });
    it('can be used to flatten nested instruction plans', () => {
        const plan = sequentialInstructionPlan([
            sequentialInstructionPlan([createInstruction('A'), createInstruction('B')]),
            sequentialInstructionPlan([
                createInstruction('C'),
                sequentialInstructionPlan([createInstruction('D'), createInstruction('E')]),
            ]),
        ]);
        const transformedPlan = transformInstructionPlan(plan, p => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (p.kind !== 'sequential') return p;
            const subPlans = p.plans.flatMap(subPlan =>
                // eslint-disable-next-line jest/no-conditional-in-test
                subPlan.kind === 'sequential' && p.divisible === subPlan.divisible ? subPlan.plans : [subPlan],
            );
            return { ...p, plans: subPlans };
        });
        expect(transformedPlan).toStrictEqual(
            sequentialInstructionPlan([
                createInstruction('A'),
                createInstruction('B'),
                createInstruction('C'),
                createInstruction('D'),
                createInstruction('E'),
            ]),
        );
    });
    it('keeps transformed single instruction plans frozen', () => {
        const plan = singleInstructionPlan(createInstruction('A'));
        const transformedPlan = transformInstructionPlan(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
    });
    it('keeps transformed message packer instruction plans frozen', () => {
        const plan = getMessagePackerInstructionPlanFromInstructions([createInstruction('A')]);
        const transformedPlan = transformInstructionPlan(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
    });
    it('keeps transformed sequential instruction plans frozen', () => {
        const plan = sequentialInstructionPlan([createInstruction('A')]);
        const transformedPlan = transformInstructionPlan(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
    });
    it('keeps transformed parallel instruction plans frozen', () => {
        const plan = parallelInstructionPlan([createInstruction('A')]);
        const transformedPlan = transformInstructionPlan(plan, p => ({ ...p }));
        expect(transformedPlan).toBeFrozenObject();
    });
});
