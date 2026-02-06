import type { Instruction } from '@solana/instructions';

import { InstructionPlan, parseInstructionPlanInput } from '../index';

const instructionPlanA = null as unknown as InstructionPlan & { id: 'A' };
const instructionPlanB = null as unknown as InstructionPlan & { id: 'B' };
const instructionA = null as unknown as Instruction & { id: 'A' };
const instructionB = null as unknown as Instruction & { id: 'B' };

// [DESCRIBE] parseInstructionPlanInput
{
    // It parses a single Instruction.
    {
        const plan = parseInstructionPlanInput(instructionA);
        plan satisfies InstructionPlan;
    }

    // It parses an InstructionPlan.
    {
        const plan = parseInstructionPlanInput(instructionPlanA);
        plan satisfies InstructionPlan;
    }

    // It parses an array of Instructions.
    {
        const plan = parseInstructionPlanInput([instructionA, instructionB]);
        plan satisfies InstructionPlan;
    }

    // It parses an array of InstructionPlans.
    {
        const plan = parseInstructionPlanInput([instructionPlanA, instructionPlanB]);
        plan satisfies InstructionPlan;
    }

    // It parses an array of mixed Instructions and InstructionPlans.
    {
        const plan = parseInstructionPlanInput([instructionA, instructionPlanA, instructionB, instructionPlanB]);
        plan satisfies InstructionPlan;
    }

    // It parses an empty array.
    {
        const plan = parseInstructionPlanInput([]);
        plan satisfies InstructionPlan;
    }
}
