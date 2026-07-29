import type { ClientWithTransactionPlanning, InstructionPlanInput, TransactionPlan } from '@solana/kit';

import { type ActionResult, useAction } from './useAction';

/**
 * Plans one or more transactions from an instruction input, as a reactive action.
 *
 * Wraps `client.planTransactions` with {@link useAction}: each `dispatch(input)` runs the plan with a
 * fresh `AbortSignal` and tracks its lifecycle through React state. Calling `dispatch` again while a
 * previous plan is in flight aborts the first. Use this when the instructions might be split across
 * multiple transactions due to size limits; reach for {@link usePlanTransaction} for the single-
 * transaction case.
 *
 * @param client - A client with a transaction-planning plugin installed.
 * @returns An {@link ActionResult} whose `dispatch`/`dispatchAsync` take the
 *   {@link InstructionPlanInput} and resolve with the full {@link TransactionPlan}.
 *
 * @example
 * ```tsx
 * const { dispatch, data, isRunning } = usePlanTransactions(client);
 * <button disabled={isRunning} onClick={() => dispatch(instructions)}>Plan</button>
 * ```
 *
 * @see {@link usePlanTransaction}
 * @see {@link useSendTransactions}
 */
export function usePlanTransactions(
    client: ClientWithTransactionPlanning,
): ActionResult<[input: InstructionPlanInput], TransactionPlan> {
    return useAction((abortSignal, input: InstructionPlanInput) => client.planTransactions(input, { abortSignal }));
}
