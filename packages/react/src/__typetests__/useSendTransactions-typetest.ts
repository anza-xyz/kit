/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/rules-of-hooks */

import type { ClientWithTransactionSending } from '@solana/kit';

import { ActionResult } from '../useAction';
import { useSendTransactions } from '../useSendTransactions';

type Input = Parameters<ClientWithTransactionSending['sendTransactions']>[0];
type Result = Awaited<ReturnType<ClientWithTransactionSending['sendTransactions']>>;

// [DESCRIBE] useSendTransactions
{
    // It returns an ActionResult over the `sendTransactions` input and result
    {
        const result = useSendTransactions();
        result satisfies ActionResult<[input: Input], Result>;
        result.data satisfies Result | undefined;
    }

    // dispatch / dispatchAsync accept the `sendTransactions` input
    {
        const { dispatch, dispatchAsync } = useSendTransactions();
        const input = null as unknown as Input;
        dispatch(input) satisfies void;
        dispatchAsync(input) satisfies Promise<Result>;
    }

    // dispatch requires the input argument
    {
        const { dispatch } = useSendTransactions();
        // @ts-expect-error - an input argument is required
        dispatch();
    }
}
