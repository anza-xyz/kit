import type { InstructionPlan } from './instruction-plan';
import type { TransactionPlan } from './transaction-plan';

/**
 * Plans one or more transactions according to the provided instruction plan.
 *
 * @param instructionPlan - The instruction plan to be planned and executed.
 * @param config - Optional configuration object that can include an `AbortSignal` to cancel the planning process.
 *
 * @see {@link InstructionPlan}
 * @see {@link TransactionPlan}
 */
export type TransactionPlanner = (
    instructionPlan: InstructionPlan,
    config?: { abortSignal?: AbortSignal },
) => Promise<TransactionPlan>;
