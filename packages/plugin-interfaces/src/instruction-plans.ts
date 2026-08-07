import type {
    InstructionPlanInput,
    SingleTransactionPlan,
    SuccessfulSingleTransactionPlanResult,
    TransactionPlan,
    TransactionPlanInput,
    TransactionPlanResult,
    TransactionPlanResultContext,
    TransactionPlanResultContextWithSignature,
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
 * @typeParam TContext - The context attached to the results. It defaults to
 * {@link TransactionPlanResultContextWithSignature}, which guarantees a `context.signature` on
 * every successful result. Supply a different context to change or drop that guarantee — for
 * instance, a client whose executor records extra fields on the context.
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
export type ClientWithTransactionSending<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
> = {
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
    ) => Promise<SuccessfulSingleTransactionPlanResult<TContext>>;

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
    ) => Promise<TransactionPlanResult<TContext>>;
};

/**
 * Represents a client that can sign transactions without submitting them to the network.
 *
 * Transaction signing accepts the same flexible inputs as
 * {@link ClientWithTransactionSending} — instructions, instruction plans, transaction messages or
 * transaction plans — but stops short of sending the resulting transactions. Use it to hand
 * transactions off to another party, such as an authority wallet signing a transaction that a
 * relayer will pay for and submit later.
 *
 * @typeParam TContext - The context attached to the results. The interface makes no claim about
 * what that context contains: it is entirely decided by the plugin providing the capability, which
 * would typically guarantee a `context.transaction` on successful results. Note that this differs
 * from {@link ClientWithTransactionSending}, whose default context preserves the
 * `context.signature` guarantee that predates configurable contexts.
 *
 * @example
 * ```ts
 * async function signTransfer(client: ClientWithTransactionSigning<{ transaction: Transaction }>) {
 *     const instructions = [createTransferInstruction(...)];
 *
 *     // Sign a single transaction
 *     const result = await client.signTransaction(instructions);
 *     const transaction = result.context.transaction;
 *
 *     // Or sign potentially multiple transactions
 *     const results = await client.signTransactions(instructions);
 * }
 * ```
 *
 * @see {@link ClientWithTransactionSending}
 */
export type ClientWithTransactionSigning<TContext extends TransactionPlanResultContext = TransactionPlanResultContext> =
    {
        /**
         * Signs a single transaction without sending it.
         *
         * Accepts flexible input: instructions, instruction plans, a single
         * transaction message or a single transaction plan.
         *
         * @param input - Instructions, a transaction plan, or a transaction message.
         * @param config - Optional configuration including an abort signal.
         * @returns A promise resolving to the successful transaction result, carrying the
         * `TContext` the client was parameterised with.
         *
         * @see {@link InstructionPlanInput}
         * @see {@link SingleTransactionPlan}
         */
        signTransaction: (
            input: InstructionPlanInput | SingleTransactionPlan | SingleTransactionPlan['message'],
            config?: Config,
        ) => Promise<SuccessfulSingleTransactionPlanResult<TContext>>;

        /**
         * Signs one or more transactions without sending them.
         *
         * Accepts flexible input: instructions, instruction plans, transaction messages
         * or transaction plans.
         *
         * @param input - Any instruction or a transaction plan input.
         * @param config - Optional configuration including an abort signal.
         * @returns A promise resolving to the results for all transactions. Successful leaves carry
         * the `TContext` the client was parameterised with.
         *
         * @see {@link InstructionPlanInput}
         * @see {@link TransactionPlanInput}
         */
        signTransactions: (
            input: InstructionPlanInput | TransactionPlanInput,
            config?: Config,
        ) => Promise<TransactionPlanResult<TContext>>;
    };
