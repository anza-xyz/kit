/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/rules-of-hooks */

import type {
    ClientWithTransactionSending,
    InstructionPlanInput,
    SingleTransactionPlan,
    SuccessfulSingleTransactionPlanResult,
} from '@solana/kit';

import type { ActionResult } from '../useAction';
import { useSendTransaction } from '../useSendTransaction';

// [DESCRIBE] useSendTransaction
{
    const client = {} as ClientWithTransactionSending;
    const input = {} as InstructionPlanInput;

    // It returns an ActionResult that resolves with a successful single-transaction result
    {
        const result = useSendTransaction(client);
        result.dispatch(input) satisfies void;
        result.dispatchAsync(input) satisfies Promise<SuccessfulSingleTransactionPlanResult>;
        result.data satisfies SuccessfulSingleTransactionPlanResult | undefined;
        result satisfies ActionResult<
            [input: InstructionPlanInput | SingleTransactionPlan | SingleTransactionPlan['message']],
            SuccessfulSingleTransactionPlanResult
        >;
    }

    // dispatch rejects an argument that is none of the accepted input shapes
    {
        const { dispatch } = useSendTransaction(client);
        // @ts-expect-error - argument must be an accepted send input
        dispatch(123);
    }
}
