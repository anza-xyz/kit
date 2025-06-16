/* eslint-disable @typescript-eslint/no-floating-promises */

import type { InstructionPlan } from '../instruction-plan';
import type { TransactionPlan } from '../transaction-plan';
import type { TransactionPlanner } from '../transaction-planner';

// [DESCRIBE] TransactionPlanner
{
    // Its return type satisfies TransactionPlan.
    {
        const instructionPlan = null as unknown as InstructionPlan;
        const planner = null as unknown as TransactionPlanner;
        const transactionPlan = planner(instructionPlan);
        transactionPlan satisfies Promise<TransactionPlan>;
    }
}
