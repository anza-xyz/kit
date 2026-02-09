import type {
    InstructionPlanInput,
    SingleTransactionPlan,
    SuccessfulSingleTransactionPlanResult,
    TransactionPlan,
    TransactionPlanInput,
    TransactionPlanResult,
} from '@solana/instruction-plans';

type Config = { abortSignal?: AbortSignal };

/**
 * Represents a client that can plan transactions from instruction inputs.
 *
 * Transaction planning converts high-level instruction plans into concrete
 * transaction messages, handling concerns like blockhash fetching, transaction
 * splitting for size limits, and instruction ordering.
 *
 * @example
 * ```ts
 * async function prepareTransfer(client: ClientWithTransactionPlanning) {
 *     const instructions = [createTransferInstruction(...)];
 *
 *     // Plan a single transaction
 *     const message = await client.planTransaction(instructions);
 *
 *     // Or plan potentially multiple transactions if needed
 *     const plan = await client.planTransactions(instructions);
 * }
 * ```
 */
export type ClientWithTransactionPlanning = {
    /**
     * Plans a single transaction from the given instruction input.
     *
     * Use this when you expect all instructions to fit in a single transaction.
     *
     * @param input - The instruction plan input (instructions or instruction plans).
     * @param config - Optional configuration including an abort signal.
     * @returns A promise resolving to the planned transaction message.
     *
     * @see {@link InstructionPlanInput}
     */
    planTransaction: (input: InstructionPlanInput, config?: Config) => Promise<SingleTransactionPlan['message']>;

    /**
     * Plans one or more transactions from the given instruction input.
     *
     * Use this when instructions might need to be split across multiple
     * transactions due to size limits.
     *
     * @param input - The instruction plan input (instructions or instruction plans).
     * @param config - Optional configuration including an abort signal.
     * @returns A promise resolving to the full transaction plan.
     *
     * @see {@link InstructionPlanInput}
     */
    planTransactions: (input: InstructionPlanInput, config?: Config) => Promise<TransactionPlan>;
};

/**
 * Represents a client that can send transactions to the Solana network.
 *
 * Transaction sending handles signing, submission, and confirmation of
 * transactions. It supports flexible input formats including instructions,
 * instruction plans, transaction messages or transaction plans.
 *
 * @example
 * ```ts
 * async function executeTransfer(client: ClientWithTransactionSending) {
 *     const instructions = [createTransferInstruction(...)];
 *
 *     // Send a single transaction
 *     const result = await client.sendTransaction(instructions);
 *     console.log(`Transaction confirmed: ${result.context.signature}`);
 *
 *     // Or send potentially multiple transactions
 *     const results = await client.sendTransactions(instructions);
 * }
 * ```
 */
export type ClientWithTransactionSending = {
    /**
     * Sends a single transaction to the network.
     *
     * Accepts flexible input: instructions, instruction plans, a single
     * transaction message or a single transaction plan.
     *
     * @param input - Instructions, a transaction plan, or a transaction message.
     * @param config - Optional configuration including an abort signal.
     * @returns A promise resolving to the successful transaction result.
     *
     * @see {@link InstructionPlanInput}
     * @see {@link SingleTransactionPlan}
     */
    sendTransaction: (
        input: InstructionPlanInput | SingleTransactionPlan | SingleTransactionPlan['message'],
        config?: Config,
    ) => Promise<SuccessfulSingleTransactionPlanResult>;

    /**
     * Sends one or more transactions to the network.
     *
     * Accepts flexible input: instructions, instruction plans, transaction messages
     * or transaction plans.
     *
     * @param input - Any instruction or a transaction plan input.
     * @param config - Optional configuration including an abort signal.
     * @returns A promise resolving to the results for all transactions.
     *
     * @see {@link InstructionPlanInput}
     * @see {@link TransactionPlanInput}
     */
    sendTransactions: (
        input: InstructionPlanInput | TransactionPlanInput,
        config?: Config,
    ) => Promise<TransactionPlanResult>;
};
