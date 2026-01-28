import type { Instruction } from '@solana/instructions';

import {
    assertIsMessagePackerInstructionPlan,
    assertIsNonDivisibleSequentialInstructionPlan,
    assertIsParallelInstructionPlan,
    assertIsSequentialInstructionPlan,
    assertIsSingleInstructionPlan,
    flattenInstructionPlan,
    getLinearMessagePackerInstructionPlan,
    getMessagePackerInstructionPlanFromInstructions,
    getReallocMessagePackerInstructionPlan,
    InstructionPlan,
    isMessagePackerInstructionPlan,
    isNonDivisibleSequentialInstructionPlan,
    isParallelInstructionPlan,
    isSequentialInstructionPlan,
    isSingleInstructionPlan,
    MessagePackerInstructionPlan,
    nonDivisibleSequentialInstructionPlan,
    ParallelInstructionPlan,
    parallelInstructionPlan,
    SequentialInstructionPlan,
    sequentialInstructionPlan,
    SingleInstructionPlan,
    singleInstructionPlan,
} from '../index';

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

// [DESCRIBE] getLinearMessagePackerInstructionPlan
{
    // It satisfies MessagePackerInstructionPlan.
    {
        const plan = getLinearMessagePackerInstructionPlan({
            getInstruction: () => instructionA,
            totalLength: 42,
        });
        plan satisfies MessagePackerInstructionPlan;
    }
}

// [DESCRIBE] getMessagePackerInstructionPlanFromInstructions
{
    // It satisfies MessagePackerInstructionPlan.
    {
        const plan = getMessagePackerInstructionPlanFromInstructions([instructionA, instructionB, instructionC]);
        plan satisfies MessagePackerInstructionPlan;
    }
}

// [DESCRIBE] getReallocMessagePackerInstructionPlan
{
    // It satisfies MessagePackerInstructionPlan.
    {
        const plan = getReallocMessagePackerInstructionPlan({
            getInstruction: () => instructionA,
            totalSize: 42,
        });
        plan satisfies MessagePackerInstructionPlan;
    }
}

// [DESCRIBE] flattenInstructionPlan
{
    // It extracts leaf plans from a simple plan.
    {
        const plan = singleInstructionPlan(instructionA);
        const leafPlans = flattenInstructionPlan(plan);
        leafPlans satisfies (MessagePackerInstructionPlan | SingleInstructionPlan)[];
    }

    // It extracts leaf plans from a nested plan.
    {
        const messagePackerPlan = getMessagePackerInstructionPlanFromInstructions([instructionA]);
        const plan = parallelInstructionPlan([
            sequentialInstructionPlan([instructionA, instructionB]),
            nonDivisibleSequentialInstructionPlan([instructionC]),
            messagePackerPlan,
        ]);
        const leafPlans = flattenInstructionPlan(plan);
        leafPlans satisfies (MessagePackerInstructionPlan | SingleInstructionPlan)[];
    }
}

// [DESCRIBE] isSingleInstructionPlan
{
    // It narrows SingleInstructionPlan.
    {
        const plan = null as unknown as InstructionPlan;
        if (isSingleInstructionPlan(plan)) {
            plan satisfies SingleInstructionPlan;
        }
    }
}

// [DESCRIBE] assertIsSingleInstructionPlan
{
    // It narrows SingleInstructionPlan.
    {
        const plan = null as unknown as InstructionPlan;
        assertIsSingleInstructionPlan(plan);
        plan satisfies SingleInstructionPlan;
    }
}

// [DESCRIBE] isMessagePackerInstructionPlan
{
    // It narrows MessagePackerInstructionPlan.
    {
        const plan = null as unknown as InstructionPlan;
        if (isMessagePackerInstructionPlan(plan)) {
            plan satisfies MessagePackerInstructionPlan;
        }
    }
}

// [DESCRIBE] assertIsMessagePackerInstructionPlan
{
    // It narrows MessagePackerInstructionPlan.
    {
        const plan = null as unknown as InstructionPlan;
        assertIsMessagePackerInstructionPlan(plan);
        plan satisfies MessagePackerInstructionPlan;
    }
}

// [DESCRIBE] isSequentialInstructionPlan
{
    // It narrows SequentialInstructionPlan.
    {
        const plan = null as unknown as InstructionPlan;
        if (isSequentialInstructionPlan(plan)) {
            plan satisfies SequentialInstructionPlan;
        }
    }
}

// [DESCRIBE] assertIsSequentialInstructionPlan
{
    // It narrows SequentialInstructionPlan.
    {
        const plan = null as unknown as InstructionPlan;
        assertIsSequentialInstructionPlan(plan);
        plan satisfies SequentialInstructionPlan;
    }
}

// [DESCRIBE] isNonDivisibleInstructionPlan
{
    // It narrows non-divisible SequentialInstructionPlan.
    {
        const plan = null as unknown as InstructionPlan;
        if (isNonDivisibleSequentialInstructionPlan(plan)) {
            plan satisfies SequentialInstructionPlan & { divisible: false };
        }
    }
}

// [DESCRIBE] assertIsNonDivisibleSequentialInstructionPlan
{
    // It narrows non-divisible SequentialInstructionPlan.
    {
        const plan = null as unknown as InstructionPlan;
        assertIsNonDivisibleSequentialInstructionPlan(plan);
        plan satisfies SequentialInstructionPlan & { divisible: false };
    }
}

// [DESCRIBE] isParallelInstructionPlan
{
    // It narrows ParallelInstructionPlan.
    {
        const plan = null as unknown as InstructionPlan;
        if (isParallelInstructionPlan(plan)) {
            plan satisfies ParallelInstructionPlan;
        }
    }
}

// [DESCRIBE] assertIsParallelInstructionPlan
{
    // It narrows ParallelInstructionPlan.
    {
        const plan = null as unknown as InstructionPlan;
        assertIsParallelInstructionPlan(plan);
        plan satisfies ParallelInstructionPlan;
    }
}
