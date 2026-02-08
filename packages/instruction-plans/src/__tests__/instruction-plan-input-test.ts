import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { Instruction } from '@solana/instructions';

import {
    parallelInstructionPlan,
    parallelTransactionPlan,
    parseInstructionOrTransactionPlanInput,
    parseInstructionPlanInput,
    parseTransactionPlanInput,
    sequentialInstructionPlan,
    sequentialTransactionPlan,
    singleInstructionPlan,
    singleTransactionPlan,
} from '../index';
import { createMessage } from './__setup__';

function createInstruction<TId extends string>(id: TId): Instruction & { id: TId } {
    return { id, programAddress: '11111111111111111111111111111111' as Address };
}

describe('parseInstructionPlanInput', () => {
    it('returns an InstructionPlan from a single instruction', () => {
        const plan = parseInstructionPlanInput(createInstruction('A'));
        expect(plan).toStrictEqual(singleInstructionPlan(createInstruction('A')));
    });
    it('returns a provided InstructionPlan as-is', () => {
        const input = sequentialInstructionPlan([
            createInstruction('A'),
            parallelInstructionPlan([createInstruction('B'), createInstruction('C')]),
        ]);
        const plan = parseInstructionPlanInput(input);
        expect(plan).toBe(input);
    });
    it('returns an empty SequentialInstructionPlan from an empty array', () => {
        const plan = parseInstructionPlanInput([]);
        expect(plan).toStrictEqual(sequentialInstructionPlan([]));
    });
    it('returns a SingleInstructionPlan from an array of only one Instruction', () => {
        const plan = parseInstructionPlanInput([createInstruction('A')]);
        expect(plan).toStrictEqual(singleInstructionPlan(createInstruction('A')));
    });
    it('returns a provided InstructionPlan as-is when it is the only item in the provided array', () => {
        const input = sequentialInstructionPlan([
            createInstruction('A'),
            parallelInstructionPlan([createInstruction('B'), createInstruction('C')]),
        ]);
        const plan = parseInstructionPlanInput([input]);
        expect(plan).toBe(input);
    });
    it('returns a SequentialInstructionPlan from an array of instructions', () => {
        const plan = parseInstructionPlanInput([createInstruction('A'), createInstruction('B')]);
        expect(plan).toStrictEqual(sequentialInstructionPlan([createInstruction('A'), createInstruction('B')]));
    });
    it('returns a SequentialInstructionPlan from an array of InstructionPlans', () => {
        const plan = parseInstructionPlanInput([
            sequentialInstructionPlan([createInstruction('A'), createInstruction('B')]),
            parallelInstructionPlan([createInstruction('C'), createInstruction('D')]),
        ]);
        expect(plan).toStrictEqual(
            sequentialInstructionPlan([
                sequentialInstructionPlan([createInstruction('A'), createInstruction('B')]),
                parallelInstructionPlan([createInstruction('C'), createInstruction('D')]),
            ]),
        );
    });
    it('returns a SequentialInstructionPlan from a mixed array of InstructionPlans and Instructions', () => {
        const plan = parseInstructionPlanInput([
            createInstruction('A'),
            sequentialInstructionPlan([createInstruction('B'), createInstruction('C')]),
            createInstruction('D'),
            parallelInstructionPlan([createInstruction('E'), createInstruction('F')]),
        ]);
        expect(plan).toStrictEqual(
            sequentialInstructionPlan([
                createInstruction('A'),
                sequentialInstructionPlan([createInstruction('B'), createInstruction('C')]),
                createInstruction('D'),
                parallelInstructionPlan([createInstruction('E'), createInstruction('F')]),
            ]),
        );
    });
    it('returns frozen objects', () => {
        expect(parseInstructionPlanInput(createInstruction('A'))).toBeFrozenObject();
        expect(parseInstructionPlanInput(sequentialInstructionPlan([createInstruction('A')]))).toBeFrozenObject();
        expect(parseInstructionPlanInput([])).toBeFrozenObject();
        expect(parseInstructionPlanInput([createInstruction('A')])).toBeFrozenObject();
        expect(parseInstructionPlanInput([sequentialInstructionPlan([createInstruction('B')])])).toBeFrozenObject();
        expect(
            parseInstructionPlanInput([createInstruction('A'), sequentialInstructionPlan([createInstruction('B')])]),
        ).toBeFrozenObject();
    });
});

describe('parseTransactionPlanInput', () => {
    it('returns an TransactionPlan from a single message', () => {
        const plan = parseTransactionPlanInput(createMessage('A'));
        expect(plan).toStrictEqual(singleTransactionPlan(createMessage('A')));
    });
    it('returns a provided TransactionPlan as-is', () => {
        const input = sequentialTransactionPlan([
            createMessage('A'),
            parallelTransactionPlan([createMessage('B'), createMessage('C')]),
        ]);
        const plan = parseTransactionPlanInput(input);
        expect(plan).toBe(input);
    });
    it('returns an empty SequentialTransactionPlan from an empty array', () => {
        const plan = parseTransactionPlanInput([]);
        expect(plan).toStrictEqual(sequentialTransactionPlan([]));
    });
    it('returns a SingleTransactionPlan from an array of only one TransactionMessage', () => {
        const plan = parseTransactionPlanInput([createMessage('A')]);
        expect(plan).toStrictEqual(singleTransactionPlan(createMessage('A')));
    });
    it('returns a provided TransactionPlan as-is when it is the only item in the provided array', () => {
        const input = sequentialTransactionPlan([
            createMessage('A'),
            parallelTransactionPlan([createMessage('B'), createMessage('C')]),
        ]);
        const plan = parseTransactionPlanInput([input]);
        expect(plan).toBe(input);
    });
    it('returns a SequentialTransactionPlan from an array of messages', () => {
        const plan = parseTransactionPlanInput([createMessage('A'), createMessage('B')]);
        expect(plan).toStrictEqual(sequentialTransactionPlan([createMessage('A'), createMessage('B')]));
    });
    it('returns a SequentialTransactionPlan from an array of TransactionPlans', () => {
        const plan = parseTransactionPlanInput([
            sequentialTransactionPlan([createMessage('A'), createMessage('B')]),
            parallelTransactionPlan([createMessage('C'), createMessage('D')]),
        ]);
        expect(plan).toStrictEqual(
            sequentialTransactionPlan([
                sequentialTransactionPlan([createMessage('A'), createMessage('B')]),
                parallelTransactionPlan([createMessage('C'), createMessage('D')]),
            ]),
        );
    });
    it('returns a SequentialTransactionPlan from a mixed array of TransactionPlans and TransactionMessages', () => {
        const plan = parseTransactionPlanInput([
            createMessage('A'),
            sequentialTransactionPlan([createMessage('B'), createMessage('C')]),
            createMessage('D'),
            parallelTransactionPlan([createMessage('E'), createMessage('F')]),
        ]);
        expect(plan).toStrictEqual(
            sequentialTransactionPlan([
                createMessage('A'),
                sequentialTransactionPlan([createMessage('B'), createMessage('C')]),
                createMessage('D'),
                parallelTransactionPlan([createMessage('E'), createMessage('F')]),
            ]),
        );
    });
    it('returns frozen objects', () => {
        expect(parseTransactionPlanInput(createMessage('A'))).toBeFrozenObject();
        expect(parseTransactionPlanInput(sequentialTransactionPlan([createMessage('A')]))).toBeFrozenObject();
        expect(parseTransactionPlanInput([])).toBeFrozenObject();
        expect(parseTransactionPlanInput([createMessage('A')])).toBeFrozenObject();
        expect(parseTransactionPlanInput([sequentialTransactionPlan([createMessage('B')])])).toBeFrozenObject();
        expect(
            parseTransactionPlanInput([createMessage('A'), sequentialTransactionPlan([createMessage('B')])]),
        ).toBeFrozenObject();
    });
});

describe('parseInstructionOrTransactionPlanInput', () => {
    it('returns an empty SequentialTransactionPlan from an empty array', () => {
        // Because if we're trying to parse nothing, might as well avoid the planning phase.
        const plan = parseInstructionOrTransactionPlanInput([]);
        expect(plan).toStrictEqual(sequentialTransactionPlan([]));
    });
    it('returns an InstructionPlan from a single instruction', () => {
        const plan = parseInstructionOrTransactionPlanInput(createInstruction('A'));
        expect(plan).toStrictEqual(singleInstructionPlan(createInstruction('A')));
    });
    it('returns a provided InstructionPlan as-is', () => {
        const input = sequentialInstructionPlan([
            createInstruction('A'),
            parallelInstructionPlan([createInstruction('B'), createInstruction('C')]),
        ]);
        const plan = parseInstructionOrTransactionPlanInput(input);
        expect(plan).toBe(input);
    });
    it('returns a SingleInstructionPlan from an array of only one Instruction', () => {
        const plan = parseInstructionOrTransactionPlanInput([createInstruction('A')]);
        expect(plan).toStrictEqual(singleInstructionPlan(createInstruction('A')));
    });
    it('returns a provided InstructionPlan as-is when it is the only item in the provided array', () => {
        const input = sequentialInstructionPlan([
            createInstruction('A'),
            parallelInstructionPlan([createInstruction('B'), createInstruction('C')]),
        ]);
        const plan = parseInstructionOrTransactionPlanInput([input]);
        expect(plan).toBe(input);
    });
    it('returns a SequentialInstructionPlan from an array of instructions', () => {
        const plan = parseInstructionOrTransactionPlanInput([createInstruction('A'), createInstruction('B')]);
        expect(plan).toStrictEqual(sequentialInstructionPlan([createInstruction('A'), createInstruction('B')]));
    });
    it('returns a SequentialInstructionPlan from an array of InstructionPlans', () => {
        const plan = parseInstructionOrTransactionPlanInput([
            sequentialInstructionPlan([createInstruction('A'), createInstruction('B')]),
            parallelInstructionPlan([createInstruction('C'), createInstruction('D')]),
        ]);
        expect(plan).toStrictEqual(
            sequentialInstructionPlan([
                sequentialInstructionPlan([createInstruction('A'), createInstruction('B')]),
                parallelInstructionPlan([createInstruction('C'), createInstruction('D')]),
            ]),
        );
    });
    it('returns a SequentialInstructionPlan from a mixed array of InstructionPlans and Instructions', () => {
        const plan = parseInstructionOrTransactionPlanInput([
            createInstruction('A'),
            sequentialInstructionPlan([createInstruction('B'), createInstruction('C')]),
            createInstruction('D'),
            parallelInstructionPlan([createInstruction('E'), createInstruction('F')]),
        ]);
        expect(plan).toStrictEqual(
            sequentialInstructionPlan([
                createInstruction('A'),
                sequentialInstructionPlan([createInstruction('B'), createInstruction('C')]),
                createInstruction('D'),
                parallelInstructionPlan([createInstruction('E'), createInstruction('F')]),
            ]),
        );
    });
    it('returns an TransactionPlan from a single message', () => {
        const plan = parseInstructionOrTransactionPlanInput(createMessage('A'));
        expect(plan).toStrictEqual(singleTransactionPlan(createMessage('A')));
    });
    it('returns a provided TransactionPlan as-is', () => {
        const input = sequentialTransactionPlan([
            createMessage('A'),
            parallelTransactionPlan([createMessage('B'), createMessage('C')]),
        ]);
        const plan = parseInstructionOrTransactionPlanInput(input);
        expect(plan).toBe(input);
    });
    it('returns a SingleTransactionPlan from an array of only one TransactionMessage', () => {
        const plan = parseInstructionOrTransactionPlanInput([createMessage('A')]);
        expect(plan).toStrictEqual(singleTransactionPlan(createMessage('A')));
    });
    it('returns a provided TransactionPlan as-is when it is the only item in the provided array', () => {
        const input = sequentialTransactionPlan([
            createMessage('A'),
            parallelTransactionPlan([createMessage('B'), createMessage('C')]),
        ]);
        const plan = parseInstructionOrTransactionPlanInput([input]);
        expect(plan).toBe(input);
    });
    it('returns a SequentialTransactionPlan from an array of messages', () => {
        const plan = parseInstructionOrTransactionPlanInput([createMessage('A'), createMessage('B')]);
        expect(plan).toStrictEqual(sequentialTransactionPlan([createMessage('A'), createMessage('B')]));
    });
    it('returns a SequentialTransactionPlan from an array of TransactionPlans', () => {
        const plan = parseInstructionOrTransactionPlanInput([
            sequentialTransactionPlan([createMessage('A'), createMessage('B')]),
            parallelTransactionPlan([createMessage('C'), createMessage('D')]),
        ]);
        expect(plan).toStrictEqual(
            sequentialTransactionPlan([
                sequentialTransactionPlan([createMessage('A'), createMessage('B')]),
                parallelTransactionPlan([createMessage('C'), createMessage('D')]),
            ]),
        );
    });
    it('returns a SequentialTransactionPlan from a mixed array of TransactionPlans and TransactionMessages', () => {
        const plan = parseInstructionOrTransactionPlanInput([
            createMessage('A'),
            sequentialTransactionPlan([createMessage('B'), createMessage('C')]),
            createMessage('D'),
            parallelTransactionPlan([createMessage('E'), createMessage('F')]),
        ]);
        expect(plan).toStrictEqual(
            sequentialTransactionPlan([
                createMessage('A'),
                sequentialTransactionPlan([createMessage('B'), createMessage('C')]),
                createMessage('D'),
                parallelTransactionPlan([createMessage('E'), createMessage('F')]),
            ]),
        );
    });
    it('returns frozen objects', () => {
        expect(parseInstructionOrTransactionPlanInput([])).toBeFrozenObject();
        expect(parseInstructionOrTransactionPlanInput(createInstruction('A'))).toBeFrozenObject();
        expect(
            parseInstructionOrTransactionPlanInput(sequentialInstructionPlan([createInstruction('A')])),
        ).toBeFrozenObject();
        expect(parseInstructionOrTransactionPlanInput(createMessage('A'))).toBeFrozenObject();
        expect(
            parseInstructionOrTransactionPlanInput(sequentialTransactionPlan([createMessage('A')])),
        ).toBeFrozenObject();
        expect(parseInstructionOrTransactionPlanInput([createInstruction('A')])).toBeFrozenObject();
        expect(parseInstructionOrTransactionPlanInput([createMessage('A')])).toBeFrozenObject();
        expect(
            parseInstructionOrTransactionPlanInput([
                createInstruction('A'),
                sequentialInstructionPlan([createInstruction('B')]),
            ]),
        ).toBeFrozenObject();
        expect(
            parseInstructionOrTransactionPlanInput([
                createMessage('A'),
                sequentialTransactionPlan([createMessage('B')]),
            ]),
        ).toBeFrozenObject();
    });
});
