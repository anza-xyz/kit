import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { Instruction } from '@solana/instructions';

import {
    parallelInstructionPlan,
    parseInstructionPlanInput,
    sequentialInstructionPlan,
    singleInstructionPlan,
} from '../index';

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
