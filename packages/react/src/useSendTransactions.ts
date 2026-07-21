import type { ClientWithTransactionSending } from '@solana/kit';

import { type ActionResult, useAction } from './useAction';
import { useClientCapability } from './useClientCapability';

type SendTransactions = ClientWithTransactionSending['sendTransactions'];
type SendTransactionsInput = Parameters<SendTransactions>[0];

/**
 * Plans and sends a transaction plan (one or more transactions) from a React component.
 *
 * Wraps the client's `sendTransactions` function with {@link useAction}. Requires a
 * `ClientProvider` whose client has `sendTransactions` installed (via `planAndSendTransactions()`);
 * asserts this at mount with {@link useClientCapability}. Unlike {@link useSendTransaction}, the
 * result is the full transaction plan result rather than a single successful transaction.
 *
 * `dispatch`/`dispatchAsync` accept any of the inputs `sendTransactions` supports — one or more
 * instructions, an instruction plan, one or more transaction messages, or a transaction plan. The
 * hook owns the `AbortSignal`, so an in-flight call is aborted when a newer one is dispatched.
 *
 * @example
 * ```tsx
 * const { dispatch, data } = useSendTransactions();
 * dispatch(myInstructionPlan);
 * ```
 *
 * @see {@link useSendTransaction}
 */
export function useSendTransactions(): ActionResult<
    [input: SendTransactionsInput],
    Awaited<ReturnType<SendTransactions>>
> {
    const client = useClientCapability<ClientWithTransactionSending>({
        capability: 'sendTransactions',
        hookName: 'useSendTransactions',
        providerHint: 'Install `planAndSendTransactions()` on the client.',
    });
    return useAction((abortSignal, input: SendTransactionsInput) => client.sendTransactions(input, { abortSignal }));
}
