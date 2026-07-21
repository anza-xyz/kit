import type { ClientWithTransactionPlanning } from '@solana/kit';

import { type ActionResult, useAction } from './useAction';
import { useClientCapability } from './useClientCapability';

type PlanTransactions = ClientWithTransactionPlanning['planTransactions'];
type PlanTransactionsInput = Parameters<PlanTransactions>[0];

/**
 * Plans a transaction plan (one or more transactions) from a React component, without sending it.
 *
 * Wraps the client's `planTransactions` function with {@link useAction}. Requires a
 * `ClientProvider` whose client has `planTransactions` installed (via `planAndSendTransactions()`);
 * asserts this at mount with {@link useClientCapability}.
 *
 * `dispatch`/`dispatchAsync` accept any of the inputs `planTransactions` supports — one or more
 * instructions or an instruction plan. The hook owns the `AbortSignal`, so an in-flight call is
 * aborted when a newer one is dispatched.
 *
 * @example
 * ```tsx
 * const { dispatch, data } = usePlanTransactions();
 * dispatch(myInstructionPlan);
 * ```
 *
 * @see {@link usePlanTransaction}
 */
export function usePlanTransactions(): ActionResult<
    [input: PlanTransactionsInput],
    Awaited<ReturnType<PlanTransactions>>
> {
    const client = useClientCapability<ClientWithTransactionPlanning>({
        capability: 'planTransactions',
        hookName: 'usePlanTransactions',
        providerHint: 'Install `planAndSendTransactions()` on the client.',
    });
    return useAction((abortSignal, input: PlanTransactionsInput) => client.planTransactions(input, { abortSignal }));
}
