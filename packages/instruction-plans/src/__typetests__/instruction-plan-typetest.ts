import type { Instruction } from '@solana/instructions';

import {
    getIterableInstructionPlanFromInstructions,
    getLinearIterableInstructionPlan,
    getReallocIterableInstructionPlan,
    IterableInstructionPlan,
    nonDivisibleSequentialInstructionPlan,
    ParallelInstructionPlan,
    parallelInstructionPlan,
    SequentialInstructionPlan,
    sequentialInstructionPlan,
    SingleInstructionPlan,
    singleInstructionPlan,
} from '../instruction-plan';

const instructionA = null as unknown as Instruction & { id: 'A' };
const instructionB = null as unknown as Instruction & { id: 'B' };
const instructionC = null as unknown as Instruction & { id: 'C' };

// [DESCRIBE] parallelInstructionPlan
{
    // It satisfies ParallelInstructionPlan.
    {
        const plan = parallelInstructionPlan([instructionA, instructionB]);
        plan satisfies ParallelInstructionPlan;
    }

    // It can nest other plans.
    {
        const plan = parallelInstructionPlan([instructionA, parallelInstructionPlan([instructionB, instructionC])]);
        plan satisfies ParallelInstructionPlan;
    }
}

// [DESCRIBE] sequentialInstructionPlan
{
    // It satisfies a divisible SequentialInstructionPlan.
    {
        const plan = sequentialInstructionPlan([instructionA, instructionB]);
        plan satisfies SequentialInstructionPlan & { divisible: true };
    }

    // It can nest other plans.
    {
        const plan = sequentialInstructionPlan([instructionA, sequentialInstructionPlan([instructionB, instructionC])]);
        plan satisfies SequentialInstructionPlan & { divisible: true };
    }
}

// [DESCRIBE] nonDivisibleSequentialInstructionPlan
{
    // It satisfies a non-divisible SequentialInstructionPlan.
    {
        const plan = nonDivisibleSequentialInstructionPlan([instructionA, instructionB]);
        plan satisfies SequentialInstructionPlan & { divisible: false };
    }

    // It can nest other plans.
    {
        const plan = nonDivisibleSequentialInstructionPlan([
            instructionA,
            nonDivisibleSequentialInstructionPlan([instructionB, instructionC]),
        ]);
        plan satisfies SequentialInstructionPlan & { divisible: false };
    }
}

// [DESCRIBE] singleInstructionPlan
{
    // It satisfies SequentialInstructionPlan.
    {
        const plan = singleInstructionPlan(instructionA);
        plan satisfies SingleInstructionPlan;
    }
}

// [DESCRIBE] getLinearIterableInstructionPlan
{
    // It satisfies IterableInstructionPlan.
    {
        const plan = getLinearIterableInstructionPlan({
            getInstruction: () => instructionA,
            totalLength: 42,
        });
        plan satisfies IterableInstructionPlan;
    }
}

// [DESCRIBE] getIterableInstructionPlanFromInstructions
{
    // It satisfies IterableInstructionPlan.
    {
        const plan = getIterableInstructionPlanFromInstructions([instructionA, instructionB, instructionC]);
        plan satisfies IterableInstructionPlan;
    }
}

// [DESCRIBE] getReallocIterableInstructionPlan
{
    // It satisfies IterableInstructionPlan.
    {
        const plan = getReallocIterableInstructionPlan({
            getInstruction: () => instructionA,
            totalSize: 42,
        });
        plan satisfies IterableInstructionPlan;
    }
}
