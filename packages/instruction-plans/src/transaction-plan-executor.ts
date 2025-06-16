import type { TransactionPlan } from './transaction-plan';
import type { TransactionPlanResult } from './transaction-plan-result';

export type TransactionPlanExecutor<TContext extends object = object> = (
    transactionPlan: TransactionPlan,
    config?: { abortSignal?: AbortSignal },
) => Promise<TransactionPlanResult<TContext>>;
