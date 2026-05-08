/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable react-hooks/rules-of-hooks */

import { ActionResult, useAction } from '../useAction';

// [DESCRIBE] useAction
{
    // It infers TArgs and TResult from the wrapped function
    {
        const result = useAction(async (_signal: AbortSignal, value: number) => `n=${value}`);
        result satisfies ActionResult<[value: number], string>;
        result.send(7) satisfies Promise<string>;
        result.data satisfies string | undefined;
    }

    // The status field is a discriminated string union, not a generic string
    {
        const fn = (): Promise<number> => Promise.resolve(1);
        const { status } = useAction(fn);
        status satisfies 'error' | 'idle' | 'running' | 'success';
        // @ts-expect-error - 'pending' is not a valid status
        status satisfies 'pending';
    }

    // send rejects calls that pass the wrong argument types
    {
        const { send } = useAction(async (_signal: AbortSignal, _value: number) => 0);
        send(1);
        // @ts-expect-error - argument should be a number
        send('not a number');
    }

    // Zero-argument actions get a zero-argument send
    {
        const fn = (): Promise<string> => Promise.resolve('ok');
        const { send } = useAction(fn);
        send() satisfies Promise<string>;
        // @ts-expect-error - send takes no arguments
        send('extra');
    }
}
