import type { ClientWithTransactionSending, TransactionPlanResult } from '@solana/kit';

import { type ActionResult, useAction } from './useAction';

type SendTransactionsInput = Parameters<ClientWithTransactionSending['sendTransactions']>[0];

/**
 * Sends one or more transactions to the network, as a reactive action.
 *
 * Wraps `client.sendTransactions` with {@link useAction}, which handles signing, submission, and
 * confirmation. Each `dispatch(input)` runs with a fresh `AbortSignal` and tracks its lifecycle
 * through React state; calling `dispatch` again while a previous send is in flight aborts the first.
 * Accepts flexible input: instructions, an instruction plan, or a transaction plan. Use
 * {@link useSendTransaction} for the single-transaction case.
 *
 * @param client - A client with a transaction-sending plugin installed.
 * @returns An {@link ActionResult} whose `dispatch`/`dispatchAsync` take the input and resolve with
 *   the {@link TransactionPlanResult} for all transactions.
 *
 * @example
 * ```tsx
 * const { dispatch, data, isRunning } = useSendTransactions(client);
 * <button disabled={isRunning} onClick={() => dispatch(instructions)}>Send</button>
 * ```
 *
 * @see {@link useSendTransaction}
 * @see {@link usePlanTransactions}
 */
export function useSendTransactions(
    client: ClientWithTransactionSending,
): ActionResult<[input: SendTransactionsInput], TransactionPlanResult> {
    return useAction((abortSignal, input: SendTransactionsInput) => client.sendTransactions(input, { abortSignal }));
}
