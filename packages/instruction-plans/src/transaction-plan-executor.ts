import type { TransactionPlan } from './transaction-plan';
import type { TransactionPlanResult, TransactionPlanResultContext } from './transaction-plan-result';

export type TransactionPlanExecutor<TContext extends TransactionPlanResultContext = TransactionPlanResultContext> = (
    transactionPlan: TransactionPlan,
    config?: { abortSignal?: AbortSignal },
) => Promise<TransactionPlanResult<TContext>>;
