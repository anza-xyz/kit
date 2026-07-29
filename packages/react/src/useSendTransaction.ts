import type { ClientWithTransactionSending, SuccessfulSingleTransactionPlanResult } from '@solana/kit';

import { type ActionResult, useAction } from './useAction';

type SendTransactionInput = Parameters<ClientWithTransactionSending['sendTransaction']>[0];

/**
 * Sends a single transaction to the network, as a reactive action.
 *
 * Wraps `client.sendTransaction` with {@link useAction}, which handles signing, submission, and
 * confirmation. Each `dispatch(input)` runs with a fresh `AbortSignal` and tracks its lifecycle
 * through React state; calling `dispatch` again while a previous send is in flight aborts the first.
 * Accepts flexible input: instructions, an instruction plan, a single transaction message, or a
 * single transaction plan. Use {@link useSendTransactions} when the work may span multiple
 * transactions.
 *
 * @param client - A client with a transaction-sending plugin installed.
 * @returns An {@link ActionResult} whose `dispatch`/`dispatchAsync` take the input and resolve with
 *   the {@link SuccessfulSingleTransactionPlanResult}.
 *
 * @example
 * ```tsx
 * const { dispatch, data, isRunning } = useSendTransaction(client);
 * <button disabled={isRunning} onClick={() => dispatch(instructions)}>Send</button>
 * ```
 *
 * @see {@link useSendTransactions}
 * @see {@link usePlanTransaction}
 */
export function useSendTransaction(
    client: ClientWithTransactionSending,
): ActionResult<[input: SendTransactionInput], SuccessfulSingleTransactionPlanResult> {
    return useAction((abortSignal, input: SendTransactionInput) => client.sendTransaction(input, { abortSignal }));
}
