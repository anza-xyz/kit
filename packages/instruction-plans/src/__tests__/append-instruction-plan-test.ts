import { Address } from '@solana/addresses';
import { isSolanaError, SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN } from '@solana/errors';
import { pipe } from '@solana/functional';
import { Instruction } from '@solana/instructions';
import {
    appendTransactionMessageInstruction,
    createTransactionMessage,
    setTransactionMessageFeePayer,
} from '@solana/transaction-messages';

import {
    appendTransactionMessageInstructionPlan,
    getMessagePackerInstructionPlanFromInstructions,
    parallelInstructionPlan,
    sequentialInstructionPlan,
    singleInstructionPlan,
} from '../index';

function createInstruction<TId extends string>(id: TId): Instruction & { id: TId } {
    return { id, programAddress: '1'.repeat(32) as Address };
}

const feePayer = '2'.repeat(44) as Address;

describe('appendTransactionMessageInstructionPlan', () => {
    it('appends a single instruction plan to a transaction message', () => {
        const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayer(feePayer, m));
        const instructionA = createInstruction('A');
        const plan = singleInstructionPlan(instructionA);

        const result = appendTransactionMessageInstructionPlan(plan, message);

        expect(result.instructions).toStrictEqual([instructionA]);
    });

    it('appends instructions from a sequential instruction plan in order', () => {
        const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayer(feePayer, m));
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const instructionC = createInstruction('C');
        const plan = sequentialInstructionPlan([instructionA, instructionB, instructionC]);

        const result = appendTransactionMessageInstructionPlan(plan, message);

        expect(result.instructions).toStrictEqual([instructionA, instructionB, instructionC]);
    });

    it('appends instructions from a parallel instruction plan', () => {
        const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayer(feePayer, m));
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = parallelInstructionPlan([instructionA, instructionB]);

        const result = appendTransactionMessageInstructionPlan(plan, message);

        expect(result.instructions).toStrictEqual([instructionA, instructionB]);
    });

    it('appends instructions from nested plans', () => {
        const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayer(feePayer, m));
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const instructionC = createInstruction('C');
        const instructionD = createInstruction('D');
        const plan = sequentialInstructionPlan([
            parallelInstructionPlan([instructionA, instructionB]),
            parallelInstructionPlan([instructionC, instructionD]),
        ]);

        const result = appendTransactionMessageInstructionPlan(plan, message);

        expect(result.instructions).toStrictEqual([instructionA, instructionB, instructionC, instructionD]);
    });

    it('returns the original message for an empty sequential plan', () => {
        const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayer(feePayer, m));
        const plan = sequentialInstructionPlan([]);

        const result = appendTransactionMessageInstructionPlan(plan, message);

        expect(result.instructions).toStrictEqual([]);
    });

    it('returns the original message for an empty parallel plan', () => {
        const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayer(feePayer, m));
        const plan = parallelInstructionPlan([]);

        const result = appendTransactionMessageInstructionPlan(plan, message);

        expect(result.instructions).toStrictEqual([]);
    });

    it('preserves existing instructions when appending', () => {
        const existingInstruction = createInstruction('existing');
        const message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer(feePayer, m),
            m => appendTransactionMessageInstruction(existingInstruction, m),
        );
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = sequentialInstructionPlan([instructionA, instructionB]);

        const result = appendTransactionMessageInstructionPlan(plan, message);

        expect(result.instructions).toStrictEqual([existingInstruction, instructionA, instructionB]);
    });

    it('appends instructions from a message packer instruction plan', () => {
        const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayer(feePayer, m));
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = getMessagePackerInstructionPlanFromInstructions([instructionA, instructionB]);

        const result = appendTransactionMessageInstructionPlan(plan, message);

        expect(result.instructions).toStrictEqual([instructionA, instructionB]);
    });

    it('appends instructions from a plan containing both single and message packer plans', () => {
        const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayer(feePayer, m));
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const instructionC = createInstruction('C');
        const plan = sequentialInstructionPlan([
            instructionA,
            getMessagePackerInstructionPlanFromInstructions([instructionB, instructionC]),
        ]);

        const result = appendTransactionMessageInstructionPlan(plan, message);

        expect(result.instructions).toStrictEqual([instructionA, instructionB, instructionC]);
    });

    it('preserves existing instructions when appending a message packer plan', () => {
        const existingInstruction = createInstruction('existing');
        const message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer(feePayer, m),
            m => appendTransactionMessageInstruction(existingInstruction, m),
        );
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const plan = getMessagePackerInstructionPlanFromInstructions([instructionA, instructionB]);

        const result = appendTransactionMessageInstructionPlan(plan, message);

        expect(result.instructions).toStrictEqual([existingInstruction, instructionA, instructionB]);
    });

    it('throws if the message packer plan cannot fit all instructions', () => {
        expect.assertions(1);
        const message = pipe(createTransactionMessage({ version: 0 }), m => setTransactionMessageFeePayer(feePayer, m));
        const instructionA = createInstruction('A');
        const instructionB = createInstruction('B');
        const largeInstruction = { ...createInstruction('C'), data: new Uint8Array(50_000) }; // Simulate a large instruction
        const plan = getMessagePackerInstructionPlanFromInstructions([instructionA, instructionB, largeInstruction]);

        try {
            appendTransactionMessageInstructionPlan(plan, message);
        } catch (error) {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(isSolanaError(error, SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN)).toBe(true);
        }
    });
});
