/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/rules-of-hooks */

import type { ClientWithTransactionPlanning } from '@solana/kit';

import { ActionResult } from '../useAction';
import { usePlanTransactions } from '../usePlanTransactions';

type Input = Parameters<ClientWithTransactionPlanning['planTransactions']>[0];
type Result = Awaited<ReturnType<ClientWithTransactionPlanning['planTransactions']>>;

// [DESCRIBE] usePlanTransactions
{
    // It returns an ActionResult over the `planTransactions` input and result
    {
        const result = usePlanTransactions();
        result satisfies ActionResult<[input: Input], Result>;
        result.data satisfies Result | undefined;
    }

    // dispatch / dispatchAsync accept the `planTransactions` input
    {
        const { dispatch, dispatchAsync } = usePlanTransactions();
        const input = null as unknown as Input;
        dispatch(input) satisfies void;
        dispatchAsync(input) satisfies Promise<Result>;
    }

    // dispatch requires the input argument
    {
        const { dispatch } = usePlanTransactions();
        // @ts-expect-error - an input argument is required
        dispatch();
    }
}
