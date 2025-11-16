/**
 * EXAMPLE
 * Transfer Lamports from one account to another with @solana/kit.
 *
 * Before running any of the examples in this monorepo, make sure to set up a test validator by
 * running `pnpm test:live-with-test-validator:setup` in the root directory.
 *
 * To run this example, execute `pnpm start` in this directory.
 */
import { createLogger } from '@solana/example-utils/createLogger.js';
import pressAnyKeyPrompt from '@solana/example-utils/pressAnyKeyPrompt.js';
import {
    appendTransactionMessageInstruction,
    assertIsSendableTransaction,
    assertIsTransactionWithBlockhashLifetime,
    createKeyPairSignerFromBytes,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    createTransactionMessage,
    createTransactionPlanExecutor,
    createTransactionPlanner,
    generateKeyPairSigner,
    getSignatureFromTransaction,
    parallelInstructionPlan,
    pipe,
    sendAndConfirmTransactionFactory,
    sequentialInstructionPlan,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
} from '@solana/kit';
import { getCreateAccountInstruction } from '@solana-program/system';
import { estimateAndUpdateProvisoryComputeUnitLimitFactory, estimateComputeUnitLimitFactory, getSetComputeUnitPriceInstruction, MAX_COMPUTE_UNIT_LIMIT, updateOrAppendSetComputeUnitLimitInstruction } from '@solana-program/compute-budget';
import { getMintSize, findAssociatedTokenPda, getCreateAssociatedTokenInstruction, getInitializeMint2Instruction, getMintToCheckedInstruction, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';

const log = createLogger('Token Airdrop');

/**
 * SETUP: SOURCE ACCOUNT
 * The account from which the tokens will be transferred needs to sign the transaction. We need to
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

// SETUP: destination accounts
const destinationAddresses = await Promise.all(
    Array.from({ length: 100 }, async () => {
        const signer = await generateKeyPairSigner();
        return signer.address;
    }),
);
log.info('[setup] Generated 100 destination account addresses');

// SETUP: get a blockhash, used for all transactions
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();

// SETUP: transaction planner
const transactionPlanner = createTransactionPlanner({
    createTransactionMessage() {
        return pipe(
            createTransactionMessage({ version: 0 }),
            tx => (
                setTransactionMessageFeePayer(SOURCE_ACCOUNT_SIGNER.address, tx)
            ),
            tx => (
                setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx)
            ),
            tx => (
                appendTransactionMessageInstruction(
                    getSetComputeUnitPriceInstruction({
                        microLamports: 100n,
                    }),
                    tx
                )
            ),
            // TODO: should be fillProvisorySetComputeUnitLimitInstruction but that sets limit to 0
            tx => updateOrAppendSetComputeUnitLimitInstruction(MAX_COMPUTE_UNIT_LIMIT, tx)
        )
    },
})

/**
 * SETUP: TRANSACTION SENDER
 * We use the RPC connection that you just created to build a reusable transaction sender.
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

// SETUP: CU estimator
// TODO: how to add a multiplier here?
const estimateCULimit = estimateComputeUnitLimitFactory({ rpc });
const estimateAndSetCULimit = estimateAndUpdateProvisoryComputeUnitLimitFactory(estimateCULimit);

// SETUP: transaction executor
const transactionExecutor = createTransactionPlanExecutor({
    async executeTransactionMessage(message, config) {
        const abortSignal = config ? config.abortSignal : undefined;
        const messageWithCUEstimate = await estimateAndSetCULimit(message, { abortSignal });
        const signedTransaction = await signTransactionMessageWithSigners(
            messageWithCUEstimate,
            { abortSignal },
        );

        const signature = getSignatureFromTransaction(signedTransaction);
        log.info({ signature }, `[transaction executor] Sending transaction`);

        assertIsTransactionWithBlockhashLifetime(signedTransaction);
        await sendAndConfirmTransaction(signedTransaction, { commitment: 'confirmed', abortSignal });
        log.info({ signature }, `[transaction executor] Transaction confirmed: https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=127.0.0.1:8899`);
        return { transaction: signedTransaction };
    }
});

// SETUP: token mint address
const tokenMint = await generateKeyPairSigner();
log.info({ address: tokenMint.address }, '[setup] Generated token mint address');

// create account for mint
const mintSize = getMintSize();
const lamportsForMintAccount = await rpc.getMinimumBalanceForRentExemption(BigInt(mintSize)).send();
const createAccountForMintInstruction = getCreateAccountInstruction({
    payer: SOURCE_ACCOUNT_SIGNER,
    newAccount: tokenMint,
    lamports: lamportsForMintAccount,
    space: mintSize,
    programAddress: TOKEN_PROGRAM_ADDRESS,
})

// create the initialize mint instruction
const initializeMintInstruction = getInitializeMint2Instruction({
    mint: tokenMint.address,
    decimals: 6,
    mintAuthority: SOURCE_ACCOUNT_SIGNER.address,
});

// generate the ATA addresses
const destinationTokenAccountAddresses = await Promise.all(destinationAddresses.map(async ownerAddress => {
    const [address] = await findAssociatedTokenPda({
        owner: ownerAddress,
        mint: tokenMint.address,
        tokenProgram: TOKEN_PROGRAM_ADDRESS
    });
    return address;
}));

// create instruction plan: initialize mint, then create ATA + mint for each recipient
const instructionPlan = sequentialInstructionPlan([
    createAccountForMintInstruction,
    initializeMintInstruction,
    parallelInstructionPlan(destinationAddresses.map((address, index) =>
        sequentialInstructionPlan([
            // create the associated token account
            getCreateAssociatedTokenInstruction({
                payer: SOURCE_ACCOUNT_SIGNER,
                ata: destinationTokenAccountAddresses[index],
                owner: address,
                mint: tokenMint.address,
            }),
            // mint to this token account
            getMintToCheckedInstruction({
                mint: tokenMint.address,
                token: destinationTokenAccountAddresses[index],
                mintAuthority: SOURCE_ACCOUNT_SIGNER,
                amount: 1_000_000_000n, // 1,000 tokens, considering 6 decimals
                decimals: 6,
            })
        ])
    ))
])

const transactionPlan = await transactionPlanner(instructionPlan);
log.info('Created transaction plan');

// execute the transaction plan
// todo catch error
await transactionExecutor(transactionPlan);
await pressAnyKeyPrompt('Press any key to quit');
