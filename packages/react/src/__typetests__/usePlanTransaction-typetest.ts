/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/rules-of-hooks */

import type { ClientWithTransactionPlanning, InstructionPlanInput, SingleTransactionPlan } from '@solana/kit';

import type { ActionResult } from '../useAction';
import { usePlanTransaction } from '../usePlanTransaction';

// [DESCRIBE] usePlanTransaction
{
    const client = {} as ClientWithTransactionPlanning;
    const input = {} as InstructionPlanInput;

    // It returns an ActionResult over the input and the planned message
    {
        const result = usePlanTransaction(client);
        result satisfies ActionResult<[input: InstructionPlanInput], SingleTransactionPlan['message']>;
        result.dispatch(input) satisfies void;
        result.dispatchAsync(input) satisfies Promise<SingleTransactionPlan['message']>;
        result.data satisfies SingleTransactionPlan['message'] | undefined;
    }

    // dispatch rejects a non-InstructionPlanInput argument
    {
        const { dispatch } = usePlanTransaction(client);
        // @ts-expect-error - argument must be an InstructionPlanInput
        dispatch(123);
    }
}
