/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/rules-of-hooks */

import type { ClientWithTransactionPlanning, InstructionPlanInput, TransactionPlan } from '@solana/kit';

import type { ActionResult } from '../useAction';
import { usePlanTransactions } from '../usePlanTransactions';

// [DESCRIBE] usePlanTransactions
{
    const client = {} as ClientWithTransactionPlanning;
    const input = {} as InstructionPlanInput;

    // It returns an ActionResult over the input and the transaction plan
    {
        const result = usePlanTransactions(client);
        result satisfies ActionResult<[input: InstructionPlanInput], TransactionPlan>;
        result.dispatch(input) satisfies void;
        result.dispatchAsync(input) satisfies Promise<TransactionPlan>;
        result.data satisfies TransactionPlan | undefined;
    }

    // dispatch rejects a non-InstructionPlanInput argument
    {
        const { dispatch } = usePlanTransactions(client);
        // @ts-expect-error - argument must be an InstructionPlanInput
        dispatch(123);
    }
}
