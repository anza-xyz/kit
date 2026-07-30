/**
 * EXAMPLE
 * Create a new token mint and airdrop it to 100 recipients.
 *
 * Before running any of the examples in this monorepo, make sure to set up a test validator by
 * running `pnpm test:setup` in the root directory.
 *
 * To run this example, execute `pnpm start` in this directory.
 */
import { createLogger } from '@solana/example-utils/createLogger.js';
import pressAnyKeyPrompt from '@solana/example-utils/pressAnyKeyPrompt.js';
import {
    assertIsTransactionWithBlockhashLifetime,
    ClientWithGetMinimumBalance,
    createKeyPairSignerFromBytes,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    createTransactionMessage,
    createTransactionPlanExecutor,
    createTransactionPlanner,
    estimateAndSetResourceLimitsFactory,
    estimateResourceLimitsFactory,
    fillTransactionMessageProvisoryResourceLimits,
    generateKeyPairSigner,
    getSignatureFromTransaction,
    parallelInstructionPlan,
    pipe,
    ResourceLimitsEstimate,
    sendAndConfirmTransactionFactory,
    sequentialInstructionPlan,
    setTransactionMessageComputeUnitPrice,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
    TransactionMessage,
    TransactionMessageWithFeePayer,
    TransactionPlan,
} from '@solana/kit';
import { getCreateMintInstructionPlan, getMintToATAInstructionPlanAsync } from '@solana-program/token';

const log = createLogger('Token Airdrop');

/**
 * SETUP: SOURCE ACCOUNT
 * The account that will pay for the airdrop needs to sign the transaction. We need to
 * create a `TransactionSigner` for it. You can find the account this key relates to in the test
 * validator fixtures in `/scripts/fixtures/example-transfer-sol-source-account.json`
 */
const SOURCE_ACCOUNT_SIGNER = await createKeyPairSignerFromBytes(
    /**
     * These are the bytes that we saved at the time this account's key pair was originally
     * generated. Here, they are inlined into the source code, but you can also imagine them being
     * loaded from disk or, better yet, read from an environment variable.
     */
    new Uint8Array(
        // prettier-ignore
        [2, 194, 94, 194, 31, 15, 34, 248, 159, 9, 59, 156, 194, 152, 79, 148, 81, 17, 63, 53, 245, 175, 37, 0, 134, 90, 111, 236, 245, 160, 3, 50, 196, 59, 123, 60, 59, 151, 65, 255, 27, 247, 241, 230, 52, 54, 143, 136, 108, 160, 7, 128, 4, 14, 232, 119, 234, 61, 47, 158, 9, 241, 48, 140],
    ), // Address: ED1WqT2hWJLSZtj4TtTdoovmpMrr7zpkUdbfxmcJR1Fq
);
log.info({ address: SOURCE_ACCOUNT_SIGNER.address }, '[setup] Loaded key pair for source account');

/**
 * SETUP: RPC CONNECTION
 * When it comes time to send our transaction to the Solana network for execution, we will do so
 * through a remote procedure call (RPC) server. This example uses your local test validator which
 * must be running before you run this script.
 */
const rpc = createSolanaRpc('http://127.0.0.1:8899');
const rpcSubscriptions = createSolanaRpcSubscriptions('ws://127.0.0.1:8900');

/**
 * SETUP: DESTINATION ACCOUNTS
 * We will generate 100 new random accounts to receive the airdropped tokens.
 * In a real world scenario, these would be the addresses you want to airdrop tokens to.
 */
const destinationAddresses = await Promise.all(
    Array.from({ length: 100 }, async () => {
        const signer = await generateKeyPairSigner();
        return signer.address;
    }),
);
log.info('[setup] Generated 100 destination account addresses');

/**
 * TOKEN MINT ADDRESS
 * We will create a new token mint for this airdrop.
 * Note that the new mint must sign the transaction that initializes it.
 */
const tokenMint = await generateKeyPairSigner();
log.info({ address: tokenMint.address }, '[setup] Generated token mint address');

/**
 * CREATE TRANSACTION PLANNER
 * A transaction planner is responsible for providing the structure of how transaction messages are built.
 */
const transactionPlanner = createTransactionPlanner({
    /**
     * This function is called each time the transaction planner needs to create a new transaction message.
     * It determines the base structure of the transaction message before any instructions are added to it.
     * Note that this function can also be async if necessary
     * Also note that the returned transaction message does not need to be ready to sign at this stage,
     * in this case we are not setting any transaction lifetime at this stage.
     */
    createTransactionMessage() {
        return pipe(
            createTransactionMessage({ version: 0 }),
            // Set the fee payer to the source account
            tx => setTransactionMessageFeePayer(SOURCE_ACCOUNT_SIGNER.address, tx),
            /**
             * Compute Program Instructions
             * In this example we are setting a fixed Compute Unit (CU) price of 100 microlamports/CU.
             */
            tx => setTransactionMessageComputeUnitPrice(100n, tx),
            /**
             * We are also adding provisory resource limits. At this point we don't know what
             * instructions will be added to the transaction, so we don't know what the compute
             * unit (CU) limit will be. The resource limits will be updated later by the transaction
             * executor. The transaction planner is going to add as many instructions as possible to
             * each transaction, so we may not be able to add instructions later in the transaction
             * executor. By using the provisory limits, we ensure that there is always space for
             * them.
             */
            tx => fillTransactionMessageProvisoryResourceLimits(tx),
        );
    },
});

/**
 * SETUP: TRANSACTION SENDER
 * We use the RPC connection that we created earlier to build a reusable transaction sender.
 */
const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    /**
     * The RPC implements a `sendTransaction` method which relays transactions to the network.
     */
    rpc,
    /**
     * RPC subscriptions allow the transaction sender to subscribe to the status of our transaction.
     * The sender will resolve when the transaction is reported to have been confirmed, or will
     * reject in the event of an error, or a timeout if the transaction lifetime is thought to have
     * expired.
     */
    rpcSubscriptions,
});

/**
 * RESOURCE LIMIT ESTIMATOR
 * We create a resource limit estimator which will be used by the transaction executor to
 * estimate the resource limits (such as the CU limit) for each transaction message before sending
 * it. It does this by simulating the transaction message using the RPC we created earlier.
 */
const estimateResourceLimits = estimateResourceLimitsFactory({ rpc });
// We multiply the simulated compute unit limit by 1.1 to add a 10% buffer
async function estimateWithMultiplier<TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer>(
    transactionMessage: TTransactionMessage,
    config?: Parameters<typeof estimateResourceLimits>[1],
): Promise<ResourceLimitsEstimate<TTransactionMessage>> {
    const estimate = await estimateResourceLimits(transactionMessage, config);
    return { ...estimate, computeUnitLimit: Math.min(1_400_000, Math.ceil(estimate.computeUnitLimit * 1.1)) };
}
/**
 * This helper will take the estimate and use it to update the provisory resource limits
 * that we included in the planner base transaction message.
 */
const estimateAndSetResourceLimits = estimateAndSetResourceLimitsFactory(estimateWithMultiplier);

/**
 * TRANSACTION EXECUTOR
 * The transaction executor is responsible for executing the transaction plan created by the
 * transaction planner.
 */
const transactionExecutor = createTransactionPlanExecutor({
    /**
     * This function is called to actually execute each transaction message created by the transaction planner.
     * It is responsible for signing, sending, and confirming the transaction message.
     * It only needs to deal with one transaction message.
     */
    async executeTransactionMessage(context, message, config) {
        const abortSignal = config ? config.abortSignal : undefined;

        /**
         * We fetch the latest blockhash at this point, so that it is the latest possible
         * when the transaction is sent.
         */
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send({ abortSignal });
        const updatedMessage = await pipe(
            message,
            tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
            /**
             * We use the helper that we created to estimate and set the resource limits.
             * This returns an updated transaction message with the resource limits set.
             * Recall that this replaces the provisory limits that were added in the planner.
             */
            tx => estimateAndSetResourceLimits(tx, { abortSignal }),
        );

        // Store the updated message in the context for potential error handling.
        context.message = updatedMessage;

        // Sign this updated transaction message with any signers included in its instructions
        const signedTransaction = await signTransactionMessageWithSigners(updatedMessage, { abortSignal });

        const signature = getSignatureFromTransaction(signedTransaction);
        log.info({ signature }, `[transaction executor] Sending transaction`);

        // Store the signed transaction and its signature in the context for potential error handling.
        context.transaction = signedTransaction;
        context.signature = signature;

        // Send and confirm the transaction using the helper we created earlier
        assertIsTransactionWithBlockhashLifetime(signedTransaction);
        await sendAndConfirmTransaction(signedTransaction, { abortSignal, commitment: 'confirmed' });
        log.info(
            { signature },
            `[transaction executor] Transaction confirmed: https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=${encodeURIComponent('http://127.0.0.1:8899')}`,
        );

        // Return the context that the successful result should carry.
        return { message: updatedMessage, signature, transaction: signedTransaction };
    },
});

/**
 * MINIMUM BALANCE CLIENT
 * Creating a mint requires funding the new mint account with enough lamports to make it
 * rent-exempt. `getCreateMintInstructionPlan` computes this for us, but it needs a client that can
 * look up the minimum balance for a given account size. Here we adapt our RPC's
 * `getMinimumBalanceForRentExemption` method into the `getMinimumBalance` interface it expects.
 */
const minimumBalanceClient: ClientWithGetMinimumBalance = {
    getMinimumBalance: (space: number) => rpc.getMinimumBalanceForRentExemption(BigInt(space)).send(),
};

/**
 * CREATE INSTRUCTION PLAN
 * An instruction plan describes all of the instructions that need to be executed.
 * These instructions will be grouped into transaction messages by the transaction planner
 * and executed by the transaction executor.
 * At this point none of the instructions are being executed, we are just defining the instructions that
 * will be executed.
 *
 * In this example, we are creating a new mint, and then airdropping it to the 100 destination addresses.
 *
 * Instruction plans can be sequential or parallel, and can be nested.
 * In this case, we need to create the new mint before we can mint tokens to the destination addresses.
 * But we can mint to all destination addresses in parallel.
 */
const instructionPlan = sequentialInstructionPlan([
    /**
     * This helper returns an instruction plan including all the instructions necessary to create a mint.
     * It is itself a `SequentialInstructionPlan`.
     * It is async because it uses the minimum balance client to determine how many lamports are
     * needed to make the new mint account rent-exempt.
     */
    await getCreateMintInstructionPlan(minimumBalanceClient, {
        decimals: 6,
        mintAuthority: SOURCE_ACCOUNT_SIGNER.address,
        newMint: tokenMint,
        payer: SOURCE_ACCOUNT_SIGNER,
    }),
    // Here we mint to all destination addresses in parallel
    parallelInstructionPlan(
        /**
         * When we mint tokens for a destination address, we mint them to the associated token account (ATA)
         * for that address. This helper returns an instruction plan to mint to the ATA, creating it on-chain
         * first if it does not already exist.
         *
         * It is async because it first derives the address of the ATA for us.
         * We can do this in parallel for all destination addresses, using `Promise.all`.
         *
         * We then pass these instruction plans to `parallelInstructionPlan`, as we will later execute these
         * instructions for all destination addresses in parallel.
         *
         * Note that again the returned instruction plan is itself a `SequentialInstructionPlan`.
         */
        await Promise.all(
            destinationAddresses.map(address =>
                getMintToATAInstructionPlanAsync({
                    amount: 1_000_000_000n,
                    // 1,000 tokens, with 6 decimals
                    decimals: 6,

                    mint: tokenMint.address,

                    mintAuthority: SOURCE_ACCOUNT_SIGNER,

                    owner: address,
                    payer: SOURCE_ACCOUNT_SIGNER,
                }),
            ),
        ),
    ),
]);

/**
 * CREATE TRANSACTION PLAN
 * Now that we have the instruction plan, we can create a transaction plan using the
 * transaction planner that we created earlier.
 * This creates actual transaction messages using the instructions defined in the instruction
 * plan, and the `createTransactionPlan` function of the planner.
 *
 * Under the hood, the created transaction plan has a similar structure to the instruction plan.
 * Ours will look something like this:
 *
 * SequentialTransactionPlan(
 *     First Transaction: create the mint, plus as many airdrops as will fit,
 *     ParallelTransactionPlan(
 *        Second Transaction: remaining airdrops that didn't fit in the first,
 *        Third Transaction: remaining airdrops that didn't fit in the first,
 *        ...
 *     )
 * )
 *
 */
const transactionPlan: TransactionPlan = await transactionPlanner(instructionPlan);

/**
 * EXECUTE TRANSACTION PLAN
 * Finally, we can execute the transaction plan using the transaction executor that we created earlier.
 * This will execute all of the transaction messages created by the transaction planner,
 * using the `executeTransactionPlan` function of the executor.
 */
await transactionExecutor(transactionPlan);

await pressAnyKeyPrompt('Press any key to quit');
