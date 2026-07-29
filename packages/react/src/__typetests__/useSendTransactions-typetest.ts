/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/rules-of-hooks */

import type {
    ClientWithTransactionSending,
    InstructionPlanInput,
    TransactionPlanInput,
    TransactionPlanResult,
} from '@solana/kit';

import type { ActionResult } from '../useAction';
import { useSendTransactions } from '../useSendTransactions';

// [DESCRIBE] useSendTransactions
{
    const client = {} as ClientWithTransactionSending;
    const input = {} as InstructionPlanInput;

    // It returns an ActionResult that resolves with a transaction plan result
    {
        const result = useSendTransactions(client);
        result.dispatch(input) satisfies void;
        result.dispatchAsync(input) satisfies Promise<TransactionPlanResult>;
        result.data satisfies TransactionPlanResult | undefined;
        result satisfies ActionResult<[input: InstructionPlanInput | TransactionPlanInput], TransactionPlanResult>;
    }

    // dispatch rejects an argument that is none of the accepted input shapes
    {
        const { dispatch } = useSendTransactions(client);
        // @ts-expect-error - argument must be an accepted send input
        dispatch(123);
    }
}
