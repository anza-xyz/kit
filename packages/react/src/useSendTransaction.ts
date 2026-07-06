import type { ClientWithTransactionSending } from '@solana/kit';

import { type ActionResult, useAction } from './useAction';
import { useClientCapability } from './useClientCapability';

type SendTransaction = ClientWithTransactionSending['sendTransaction'];
type SendTransactionInput = Parameters<SendTransaction>[0];

/**
 * Plans and sends a single transaction from a React component.
 *
 * Wraps the client's `sendTransaction` function with {@link useAction}. Requires a
 * `ClientProvider` whose client has `sendTransaction` installed (via `planAndSendTransactions()`);
 * asserts this at mount with {@link useClientCapability}.
 *
 * `dispatch`/`dispatchAsync` accept any of the inputs `sendTransaction` supports — one or more
 * instructions, an instruction plan, a single transaction message, or a single transaction plan.
 * The hook owns the `AbortSignal`, so an in-flight call is aborted when a newer one is dispatched.
 *
 * @example
 * ```tsx
 * const { dispatch, data, error, isRunning } = useSendTransaction();
 * dispatch(myInstructionPlan);
 * ```
 *
 * @see {@link useSendTransactions}
 */
export function useSendTransaction(): ActionResult<
    [input: SendTransactionInput],
    Awaited<ReturnType<SendTransaction>>
> {
    const client = useClientCapability<ClientWithTransactionSending>({
        capability: 'sendTransaction',
        hookName: 'useSendTransaction',
        providerHint: 'Install `planAndSendTransactions()` on the client.',
    });
    return useAction((abortSignal, input: SendTransactionInput) => client.sendTransaction(input, { abortSignal }));
}
