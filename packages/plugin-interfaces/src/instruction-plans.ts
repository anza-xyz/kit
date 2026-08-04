import type {
    InstructionPlanInput,
    SingleTransactionPlan,
    SuccessfulSingleTransactionPlanResult,
    SuccessfulSingleTransactionPlanResultWithTransaction,
    TransactionPlan,
    TransactionPlanInput,
    TransactionPlanResult,
    TransactionPlanResultWithTransactions,
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

/**
 * Represents a client that can sign transactions without sending them.
 *
 * Signing takes the same flexible input as sending — instructions, instruction plans,
 * transaction messages or transaction plans — and does nearly everything sending does:
 * it assigns the transaction lifetime, compiles the message and signs it. It stops short
 * of submitting anything to the network.
 *
 * The results are not guaranteed to be fully signed. A transaction may still need
 * signatures from other parties before the network will accept it; the results carry the
 * transaction so that those signatures can be added, or so that it can be handed straight
 * to a {@link ClientWithSignedTransactionSending}.
 *
 * @example
 * ```ts
 * async function prepareTransfer(client: ClientWithTransactionSigning) {
 *     const instructions = [createTransferInstruction(...)];
 *
 *     // Sign a single transaction without sending it.
 *     const result = await client.signTransaction(instructions);
 *     console.log(`Transaction signed: ${result.context.signature}`);
 *
 *     // Or sign potentially multiple transactions.
 *     const results = await client.signTransactions(instructions);
 * }
 * ```
 *
 * @see {@link ClientWithSignedTransactionSending}
 * @see {@link ClientWithTransactionSending}
 */
export type ClientWithTransactionSigning = {
    /**
     * Signs a single transaction without sending it.
     *
     * Accepts the same input as {@link ClientWithTransactionSending.sendTransaction}:
     * instructions, instruction plans, a single transaction message or a single
     * transaction plan.
     *
     * @param input - Instructions, a transaction plan, or a transaction message.
     * @param config - Optional configuration including an abort signal.
     * @returns A promise resolving to a result carrying the signed transaction.
     *
     * @see {@link InstructionPlanInput}
     * @see {@link SuccessfulSingleTransactionPlanResultWithTransaction}
     */
    signTransaction: (
        input: InstructionPlanInput | SingleTransactionPlan | SingleTransactionPlan['message'],
        config?: Config,
    ) => Promise<SuccessfulSingleTransactionPlanResultWithTransaction>;

    /**
     * Signs one or more transactions without sending them.
     *
     * Accepts the same input as {@link ClientWithTransactionSending.sendTransactions}:
     * instructions, instruction plans, transaction messages or transaction plans.
     *
     * Signing may not complete for every transaction in the plan — a signer may refuse
     * part-way through, or the abort signal may fire — so the result may contain failed or
     * canceled leaves alongside signed ones.
     *
     * @param input - Any instruction or a transaction plan input.
     * @param config - Optional configuration including an abort signal.
     * @returns A promise resolving to results carrying the signed transactions.
     *
     * @see {@link InstructionPlanInput}
     * @see {@link TransactionPlanInput}
     * @see {@link TransactionPlanResultWithTransactions}
     */
    signTransactions: (
        input: InstructionPlanInput | TransactionPlanInput,
        config?: Config,
    ) => Promise<TransactionPlanResultWithTransactions>;
};

/**
 * Represents a client that can send already-signed transactions to the Solana network.
 *
 * This is the counterpart to {@link ClientWithTransactionSigning}: it takes the results
 * that signing produced and broadcasts them, handling submission and confirmation. Since
 * the two are separate capabilities, a client that only ever signs need not require this
 * one, and a client that only ever broadcasts need not require signing.
 *
 * The input type guarantees only that a transaction is present to send, not that it is
 * fully signed or within the size limit. Callers are responsible for a transaction being
 * sendable by the time they hand it over; implementations are expected to reject one that
 * is not.
 *
 * The returned results describe the outcome of *sending*, not of signing, so a
 * transaction that was signed successfully may still come back as a failure.
 *
 * @example
 * ```ts
 * async function broadcast(
 *     client: ClientWithSignedTransactionSending,
 *     signed: SuccessfulSingleTransactionPlanResultWithTransaction,
 * ) {
 *     const result = await client.sendSignedTransaction(signed);
 *     console.log(`Transaction confirmed: ${result.context.signature}`);
 * }
 * ```
 *
 * @see {@link ClientWithTransactionSigning}
 * @see {@link ClientWithTransactionSending}
 */
export type ClientWithSignedTransactionSending = {
    /**
     * Sends a single already-signed transaction to the network.
     *
     * @param result - A result carrying the signed transaction to send.
     * @param config - Optional configuration including an abort signal.
     * @returns A promise resolving to the successful transaction result.
     *
     * @see {@link SuccessfulSingleTransactionPlanResultWithTransaction}
     */
    sendSignedTransaction: (
        result: SuccessfulSingleTransactionPlanResultWithTransaction,
        config?: Config,
    ) => Promise<SuccessfulSingleTransactionPlanResult>;

    /**
     * Sends one or more already-signed transactions to the network.
     *
     * Any leaf of the given result that carries no transaction — because it failed or was
     * canceled — is passed through untouched, so a partially signed plan yields a result
     * of the same shape.
     *
     * @param result - Results carrying the signed transactions to send.
     * @param config - Optional configuration including an abort signal.
     * @returns A promise resolving to the results for all transactions.
     *
     * @see {@link TransactionPlanResultWithTransactions}
     */
    sendSignedTransactions: (
        result: TransactionPlanResultWithTransactions,
        config?: Config,
    ) => Promise<TransactionPlanResult>;
};
