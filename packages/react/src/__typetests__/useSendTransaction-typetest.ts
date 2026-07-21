/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/rules-of-hooks */

import type { ClientWithTransactionSending } from '@solana/kit';

import { ActionResult } from '../useAction';
import { useSendTransaction } from '../useSendTransaction';

type Input = Parameters<ClientWithTransactionSending['sendTransaction']>[0];
type Result = Awaited<ReturnType<ClientWithTransactionSending['sendTransaction']>>;

// [DESCRIBE] useSendTransaction
{
    // It returns an ActionResult over the `sendTransaction` input and result
    {
        const result = useSendTransaction();
        result satisfies ActionResult<[input: Input], Result>;
        result.data satisfies Result | undefined;
    }

    // dispatch / dispatchAsync accept the `sendTransaction` input
    {
        const { dispatch, dispatchAsync } = useSendTransaction();
        const input = null as unknown as Input;
        dispatch(input) satisfies void;
        dispatchAsync(input) satisfies Promise<Result>;
    }

    // dispatch requires the input argument
    {
        const { dispatch } = useSendTransaction();
        // @ts-expect-error - an input argument is required
        dispatch();
    }
}
