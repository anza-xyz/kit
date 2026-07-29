import type { ClientWithTransactionPlanning, InstructionPlanInput, SingleTransactionPlan } from '@solana/kit';

import { type ActionResult, useAction } from './useAction';

/**
 * Plans a single transaction from an instruction input, as a reactive action.
 *
 * Wraps `client.planTransaction` with {@link useAction}: each `dispatch(input)` runs the plan with a
 * fresh `AbortSignal` and tracks its lifecycle through React state. Calling `dispatch` again while a
 * previous plan is in flight aborts the first. Use this when you expect all instructions to fit in a
 * single transaction; reach for {@link usePlanTransactions} when they might need splitting.
 *
 * @param client - A client with a transaction-planning plugin installed.
 * @returns An {@link ActionResult} whose `dispatch`/`dispatchAsync` take the
 *   {@link InstructionPlanInput} and resolve with the planned transaction message.
 *
 * @example
 * ```tsx
 * const { dispatch, data, isRunning } = usePlanTransaction(client);
 * <button disabled={isRunning} onClick={() => dispatch(instructions)}>Plan</button>
 * ```
 *
 * @see {@link usePlanTransactions}
 * @see {@link useSendTransaction}
 */
export function usePlanTransaction(
    client: ClientWithTransactionPlanning,
): ActionResult<[input: InstructionPlanInput], SingleTransactionPlan['message']> {
    return useAction((abortSignal, input: InstructionPlanInput) => client.planTransaction(input, { abortSignal }));
}
