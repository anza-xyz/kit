/**
 * Instruction plans describe operations that go beyond a
 * single instruction and may even span multiple transactions.
 *
 * They define a set of instructions that must be executed following a specific order.
 * For instance, imagine we wanted to create an instruction plan for a simple escrow
 * transfer between Alice and Bob. First, both would need to deposit their assets
 * into a vault. This could happen in any order. Then and only then, the vault can be
 * activated to switch the assets. Alice and Bob can now both withdraw each other’s assets
 * (again, in any order). Here’s how we could describe an instruction plan for such an operation.
 *
 * ```typescript
 * const instructionPlan = sequentialInstructionPlan([
 *     parallelInstructionPlan([
 *         depositFromAlice,
 *         depositFromBob,
 *     ]),
 *     activateVault,
 *     parallelInstructionPlan([
 *         withdrawToAlice,
 *         withdrawToBob,
 *     ]),
 * ]);
 * ```
 *
 * As you can see, instruction plans don’t concern themselves with:
 * - Adding structural instructions — e.g. compute budget limits and prices.
 * - Building transaction messages from these instructions.
 *   That is planning how many can fit into a single instruction, adding a fee payer, a lifetime, etc.
 * - Compiling, signing and sending transactions to the network.
 *
 * Instead, they solely focus on describing operations and delegate
 * all that to two components introduced in this package:
 * - **Transaction planner**: builds transaction messages from an
 *   instruction plan and returns an appropriate transaction plan.
 * - **Transaction plan executor**: compiles, signs and sends
 *   transaction plans and returns a detailed result of this operation.
 *
 * ```typescript
 * // Plan instructions into transactions.
 * const transactionPlan = await transactionPlanner(instructionPlan);
 *
 * // Execute transactions.
 * const transactionPlanResult = await transactionPlanExecutor(transactionPlan);
 * ```
 *
 * This separation of concerns not only improves the developer experience but also
 * allows program maintainers to offer helper functions that go beyond a single instruction,
 * while leaving their consumers to decide how they want these operations to materialise.
 *
 * @packageDocumentation
 */
export * from './instruction-plan';
export * from './transaction-plan-executor';
export * from './transaction-plan-result';
export * from './transaction-plan';
export * from './transaction-planner';
