import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';
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

/**
 * Checks whether the provided client has both the `planTransaction` and `planTransactions`
 * functions installed.
 *
 * @param client - The client to check.
 * @return `true` if the client has both planning functions, narrowing it to a
 * {@link ClientWithTransactionPlanning}.
 *
 * @example
 * ```ts
 * if (isClientWithTransactionPlanning(client)) {
 *     const message = await client.planTransaction(instructions);
 * }
 * ```
 *
 * @see {@link assertIsClientWithTransactionPlanning}
 */
export function isClientWithTransactionPlanning(client: object): client is ClientWithTransactionPlanning {
    return Object.hasOwn(client, 'planTransaction') && Object.hasOwn(client, 'planTransactions');
}

/**
 * Asserts that the provided client has both the `planTransaction` and `planTransactions`
 * functions installed.
 *
 * @param client - The client to check.
 * @throws A {@link SolanaError} with code {@link SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES}
 * if the client is missing either planning function.
 *
 * @example
 * ```ts
 * function planningLoggerPlugin() {
 *     return <T extends object>(client: T) => {
 *         assertIsClientWithTransactionPlanning(client);
 *         return extendClient(client, {
 *             logPlan: async (instructions: Instruction[]) => {
 *                 console.log(await client.planTransactions(instructions));
 *             },
 *         });
 *     };
 * }
 * ```
 *
 * @see {@link isClientWithTransactionPlanning}
 */
export function assertIsClientWithTransactionPlanning(client: object): asserts client is ClientWithTransactionPlanning {
    if (!isClientWithTransactionPlanning(client)) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: ['planTransaction', 'planTransactions'],
        });
    }
}

/**
 * Checks whether the provided client has both the `sendTransaction` and `sendTransactions`
 * functions installed.
 *
 * Only the presence of the functions is checked. The context attached to their results cannot be
 * verified at runtime, so the caller vouches for it through the `TContext` type parameter.
 *
 * @typeParam TContext - The context the client is expected to attach to its results. It defaults
 * to {@link TransactionPlanResultContextWithSignature}, as in {@link ClientWithTransactionSending}.
 * @param client - The client to check.
 * @return `true` if the client has both sending functions, narrowing it to a
 * {@link ClientWithTransactionSending}.
 *
 * @example
 * ```ts
 * if (isClientWithTransactionSending(client)) {
 *     const result = await client.sendTransaction(instructions);
 *     console.log(`Transaction confirmed: ${result.context.signature}`);
 * }
 * ```
 *
 * @see {@link assertIsClientWithTransactionSending}
 */
export function isClientWithTransactionSending<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
>(client: object): client is ClientWithTransactionSending<TContext> {
    return Object.hasOwn(client, 'sendTransaction') && Object.hasOwn(client, 'sendTransactions');
}

/**
 * Asserts that the provided client has both the `sendTransaction` and `sendTransactions`
 * functions installed.
 *
 * Only the presence of the functions is checked. The context attached to their results cannot be
 * verified at runtime, so the caller vouches for it through the `TContext` type parameter.
 *
 * @typeParam TContext - The context the client is expected to attach to its results. It defaults
 * to {@link TransactionPlanResultContextWithSignature}, as in {@link ClientWithTransactionSending}.
 * @param client - The client to check.
 * @throws A {@link SolanaError} with code {@link SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES}
 * if the client is missing either sending function.
 *
 * @example
 * ```ts
 * async function executeTransfer(client: object, instructions: Instruction[]) {
 *     assertIsClientWithTransactionSending(client);
 *     const result = await client.sendTransaction(instructions);
 *     console.log(`Transaction confirmed: ${result.context.signature}`);
 * }
 * ```
 *
 * @see {@link isClientWithTransactionSending}
 */
export function assertIsClientWithTransactionSending<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContextWithSignature,
>(client: object): asserts client is ClientWithTransactionSending<TContext> {
    if (!isClientWithTransactionSending(client)) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: ['sendTransaction', 'sendTransactions'],
        });
    }
}

/**
 * Checks whether the provided client has both the `signTransaction` and `signTransactions`
 * functions installed.
 *
 * Only the presence of the functions is checked. The context attached to their results cannot be
 * verified at runtime, so the caller vouches for it through the `TContext` type parameter.
 *
 * @typeParam TContext - The context the client is expected to attach to its results. As in
 * {@link ClientWithTransactionSigning}, it makes no claim about its contents by default.
 * @param client - The client to check.
 * @return `true` if the client has both signing functions, narrowing it to a
 * {@link ClientWithTransactionSigning}.
 *
 * @example
 * ```ts
 * if (isClientWithTransactionSigning<{ transaction: Transaction }>(client)) {
 *     const result = await client.signTransaction(instructions);
 *     const transaction = result.context.transaction;
 * }
 * ```
 *
 * @see {@link assertIsClientWithTransactionSigning}
 */
export function isClientWithTransactionSigning<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
>(client: object): client is ClientWithTransactionSigning<TContext> {
    return Object.hasOwn(client, 'signTransaction') && Object.hasOwn(client, 'signTransactions');
}

/**
 * Asserts that the provided client has both the `signTransaction` and `signTransactions`
 * functions installed.
 *
 * Only the presence of the functions is checked. The context attached to their results cannot be
 * verified at runtime, so the caller vouches for it through the `TContext` type parameter.
 *
 * @typeParam TContext - The context the client is expected to attach to its results. As in
 * {@link ClientWithTransactionSigning}, it makes no claim about its contents by default.
 * @param client - The client to check.
 * @throws A {@link SolanaError} with code {@link SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES}
 * if the client is missing either signing function.
 *
 * @example
 * ```ts
 * async function signTransfer(client: object, instructions: Instruction[]) {
 *     assertIsClientWithTransactionSigning<{ transaction: Transaction }>(client);
 *     const result = await client.signTransaction(instructions);
 *     return result.context.transaction;
 * }
 * ```
 *
 * @see {@link isClientWithTransactionSigning}
 */
export function assertIsClientWithTransactionSigning<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
>(client: object): asserts client is ClientWithTransactionSigning<TContext> {
    if (!isClientWithTransactionSigning(client)) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: ['signTransaction', 'signTransactions'],
        });
    }
}
