import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { pipe } from '@solana/functional';
import { Instruction } from '@solana/instructions';
import {
    BaseTransactionMessage,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import { getTransactionMessageSize, TRANSACTION_SIZE_LIMIT } from '@solana/transactions';

import {
    getLinearMessagePackerInstructionPlan,
    getMessagePackerInstructionPlanFromInstructions,
    getReallocMessagePackerInstructionPlan,
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
        expect(() => messagePacker.packMessageToCapacity(message)).toThrow();
    });
    it('freezes created MessagePackerInstructionPlan objects', () => {
        const plan = getLinearMessagePackerInstructionPlan({
            getInstruction: (offset: number, length: number) => createInstruction(`[${offset},${offset + length})`),
            totalLength: 2000,
        });
        expect(plan).toBeFrozenObject();
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
        expect(() => messagePacker.packMessageToCapacity(message)).toThrow();
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
        expect(() => messagePacker.packMessageToCapacity(message)).toThrow();
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
