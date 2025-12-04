/**
 * EXAMPLE
 * Transfer Lamports from one account to another with @solana/kit.
 *
 * Before running any of the examples in this monorepo, make sure to set up a test validator by
 * running `pnpm test:setup` in the root directory.
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
    getSignatureFromTransaction,
    isSolanaError,
    partiallySignTransactionMessageWithSigners,
    pipe,
    sendAndConfirmTransactionFactory,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
} from '@solana/kit';
import { getSetComputeUnitLimitInstruction } from '@solana-program/compute-budget';
import { getAddMemoInstruction } from '@solana-program/memo';
import { getSystemErrorMessage, isSystemError } from '@solana-program/system';

const log = createLogger('Transfer');

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
        [137, 148, 2, 55, 136, 120, 100, 247, 209, 118, 170, 9, 69, 112, 239, 132, 44, 77, 200, 148, 164, 220, 152, 61, 17, 38, 79, 175, 14, 252, 78, 133, 250, 170, 155, 227, 218, 127, 248, 28, 145, 191, 177, 89, 150, 249, 223, 235, 193, 195, 144, 176, 34, 107, 2, 255, 248, 128, 32, 202, 21, 45, 57, 55],
    ), // Address: HsVp65y5s8gv24EWmKvZkFSZHKTHbZwNSLyiHNaK3bhG
);
log.info({ address: SOURCE_ACCOUNT_SIGNER.address }, '[setup] Loaded key pair for source account');

/**
 * SETUP: RPC CONNECTION
 * When it comes time to send our transaction to the Solana network for execution, we will do so
 * through a remote procedure call (RPC) server. This example uses your local test validator which
 * must be running before you run this script.
 * RPC URL from https://simd-0296.surfnet.dev/
 *
 */
const rpc = createSolanaRpc('https://simd-0296.surfnet.dev:8899');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://simd-0296.surfnet.dev:8900');

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

/**
 * SETUP: TRANSACTION LIFETIME
 * Every transaction needs to specify a valid lifetime for it to be accepted for execution on the
 * network. For this transaction, we will fetch the latest block's hash as proof that this
 * transaction was prepared close in time to when we tried to execute it. The network will accept
 * transactions which include this hash until it progresses past the block specified as
 * `latestBlockhash.lastValidBlockHeight`.
 *
 * TIP: It is desirable for your program to fetch this block hash as late as possible before signing
 * and sending the transaction so as to ensure that it's as 'fresh' as possible.
 */
log.info("[setup] Fetching a blockhash for use as the transaction's lifetime constraint");
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
log.info(latestBlockhash, '[setup] Got a blockhash');

function randomHex(length = 32) {
    const bytes = new Uint8Array(length / 2);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * STEP 1: CREATE THE TRANSFER TRANSACTION
 */
const transactionMessage = pipe(
    (log.info('[step 1] Creating a transaction message'), createTransactionMessage({ version: 0 })),
    /**
     * Every transaction must state from which account the transaction fee should be debited from,
     * and that account must sign the transaction. Here, we'll make the source account pay the fee.
     */
    tx => setTransactionMessageFeePayerSigner(SOURCE_ACCOUNT_SIGNER, tx),
    /**
     * A transaction is valid for execution as long as it includes a valid lifetime constraint. Here
     * we supply the hash of a recent block. The network will accept this transaction until it
     * considers that hash to be 'expired' for the purpose of transaction execution.
     */
    tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    tx =>
        appendTransactionMessageInstruction(
            getSetComputeUnitLimitInstruction({
                units: 1_400_000,
            }),
            tx,
        ),
    tx =>
        appendTransactionMessageInstruction(
            getAddMemoInstruction({
                memo: 'hi from kit!' + randomHex(2000),
            }),
            tx,
        ),
);

/**
 * STEP 2: SIGN THE TRANSACTION
 * In order to prove that the owner of the account from which the tokens are being transferred
 * approves of the transfer itself, the transaction will need to include a cryptographic signature
 * that only the owner of that account could produce. We have already loaded the account owner's
 * key pair above, so we can sign the transaction now.
 */
log.info('[step 2] Signing the transaction');
const ps = await partiallySignTransactionMessageWithSigners(transactionMessage);
console.log({ ps });
const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
log.info({ signature: getSignatureFromTransaction(signedTransaction) }, '[step 2] Transaction signed');

/**
 * STEP 3: SEND AND CONFIRM THE TRANSACTION
 * Now that the transaction is signed, we send it to an RPC. The RPC will relay it to the Solana
 * network for execution. The `sendAndConfirmTransaction` method will resolve when the transaction
 * is reported to have been confirmed. It will reject in the event of an error (eg. a failure to
 * simulate the transaction), or may timeout if the transaction lifetime is thought to have expired
 * (eg. the network has progressed past the `lastValidBlockHeight` of the transaction's blockhash
 * lifetime constraint).
 */
log.info(
    '[step 3] Sending transaction: https://explorer.solana.com/tx/%s?cluster=custom&customUrl=https%3A%2F%2Fsimd-0296.surfnet.dev%3A8899',
    getSignatureFromTransaction(signedTransaction),
);
try {
    assertIsSendableTransaction(signedTransaction);
    assertIsTransactionWithBlockhashLifetime(signedTransaction);
    await sendAndConfirmTransaction(signedTransaction, { commitment: 'confirmed' });
    log.info('[success] Transfer confirmed');
    await pressAnyKeyPrompt('Press any key to quit');
} catch (e) {
    if (isSolanaError(e, SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE)) {
        const preflightErrorContext = e.context;
        const preflightErrorMessage = e.message;
        const errorDetailMessage = isSystemError(e.cause, transactionMessage)
            ? getSystemErrorMessage(e.cause.context.code)
            : e.cause?.message;
        if (errorDetailMessage !== undefined) {
            log.error('%O %s: %s', preflightErrorContext, preflightErrorMessage, errorDetailMessage);
        } else {
            log.error('%O %s', preflightErrorContext, preflightErrorMessage);
        }
    } else {
        throw e;
    }
}
