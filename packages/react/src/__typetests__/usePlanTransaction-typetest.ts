/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/rules-of-hooks */

import type { ClientWithTransactionPlanning } from '@solana/kit';

import { ActionResult } from '../useAction';
import { usePlanTransaction } from '../usePlanTransaction';

type Input = Parameters<ClientWithTransactionPlanning['planTransaction']>[0];
type Result = Awaited<ReturnType<ClientWithTransactionPlanning['planTransaction']>>;

// [DESCRIBE] usePlanTransaction
{
    // It returns an ActionResult over the `planTransaction` input and result
    {
        const result = usePlanTransaction();
        result satisfies ActionResult<[input: Input], Result>;
        result.data satisfies Result | undefined;
    }

    // dispatch / dispatchAsync accept the `planTransaction` input
    {
        const { dispatch, dispatchAsync } = usePlanTransaction();
        const input = null as unknown as Input;
        dispatch(input) satisfies void;
        dispatchAsync(input) satisfies Promise<Result>;
    }

    // dispatch requires the input argument
    {
        const { dispatch } = usePlanTransaction();
        // @ts-expect-error - an input argument is required
        dispatch();
    }
}
