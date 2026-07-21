import type { ClientWithTransactionPlanning } from '@solana/kit';

import { type ActionResult, useAction } from './useAction';
import { useClientCapability } from './useClientCapability';

type PlanTransaction = ClientWithTransactionPlanning['planTransaction'];
type PlanTransactionInput = Parameters<PlanTransaction>[0];

/**
 * Plans a single transaction message from a React component, without sending it.
 *
 * Wraps the client's `planTransaction` function with {@link useAction}. Requires a
 * `ClientProvider` whose client has `planTransaction` installed (via `planAndSendTransactions()`);
 * asserts this at mount with {@link useClientCapability}.
 *
 * `dispatch`/`dispatchAsync` accept any of the inputs `planTransaction` supports — one or more
 * instructions or an instruction plan. The hook owns the `AbortSignal`, so an in-flight call is
 * aborted when a newer one is dispatched.
 *
 * @example
 * ```tsx
 * const { dispatch, data } = usePlanTransaction();
 * dispatch(myInstructionPlan);
 * ```
 *
 * @see {@link usePlanTransactions}
 */
export function usePlanTransaction(): ActionResult<
    [input: PlanTransactionInput],
    Awaited<ReturnType<PlanTransaction>>
> {
    const client = useClientCapability<ClientWithTransactionPlanning>({
        capability: 'planTransaction',
        hookName: 'usePlanTransaction',
        providerHint: 'Install `planAndSendTransactions()` on the client.',
    });
    return useAction((abortSignal, input: PlanTransactionInput) => client.planTransaction(input, { abortSignal }));
}
