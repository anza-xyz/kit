/**
 * EXAMPLE
 * Building a helper lib client using @solana/kit and @solana-program libraries
 *
 * Before running any of the examples in this monorepo, make sure to set up a test validator by
 * running `pnpm test:live-with-test-validator:setup` in the root directory.
 *
 * To run this example, execute `pnpm start` in this directory.
 */
import { createLogger } from '@solana/example-utils/createLogger.js';
import pressAnyKeyPrompt from '@solana/example-utils/pressAnyKeyPrompt.js';
import {
    Address,
    airdropFactory,
    appendTransactionMessageInstruction,
    assertIsTransactionWithBlockhashLifetime,
    Blockhash,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    createTransactionMessage,
    createTransactionPlanExecutor,
    createTransactionPlanner,
    generateKeyPairSigner,
    getSignatureFromTransaction,
    Instruction,
    InstructionPlan,
    lamports,
    Lamports,
    pipe,
    sendAndConfirmTransactionFactory,
    sequentialInstructionPlan,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    Signature,
    signTransactionMessageWithSigners,
    singleInstructionPlan,
    SolanaRpcApi,
    SolanaRpcSubscriptionsApi,
    TransactionPartialSigner,
    TransactionPlan,
    TransactionPlanResult,
} from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { estimateAndUpdateProvisoryComputeUnitLimitFactory, estimateComputeUnitLimitFactory, fillProvisorySetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction } from '@solana-program/compute-budget';

const log = createLogger('Helper Lib');

type TransactionBuilder = {
    instruction(instruction: Instruction): Promise<TransactionPlan>;
    instructions(instructions: Instruction[]): Promise<TransactionPlan>;
    instructionPlan(plan: InstructionPlan): Promise<TransactionPlan>;
}

type TransactionConfig = {
    feePayer: TransactionPartialSigner;
    blockhash?: BlockhashLifetimeConstraint;
    cuPrice?: number | bigint;
}

type Client<TRpcApi = SolanaRpcApi, TRpcSubscriptionsApi = SolanaRpcSubscriptionsApi> = {
    rpc: TRpcApi;
    rpcSubscriptions: TRpcSubscriptionsApi;
    airdrop(recipientAddress: Address, lamports: Lamports): Promise<Signature>;
    transaction(config: TransactionConfig): TransactionBuilder;
    sendAndConfirm(transactionPlan: TransactionPlan, abortSignal?: AbortSignal): Promise<TransactionPlanResult>;
}

// could export this from Kit?
type BlockhashLifetimeConstraint = Readonly<{
    blockhash: Blockhash;
    lastValidBlockHeight: bigint;
}>;


function createSolanaClient(endpoint: string): Client<ReturnType<typeof createSolanaRpc>, ReturnType<typeof createSolanaRpcSubscriptions>> {
    const rpc = createSolanaRpc(endpoint);
    const rpcSubscriptions = createSolanaRpcSubscriptions(endpoint.replace('http', 'ws').replace('8899', '8900'));

    const airdrop = airdropFactory({ rpc, rpcSubscriptions });

    function transactionBuilder(config: TransactionConfig): TransactionBuilder {
        const transactionPlanner = createTransactionPlanner({
            async createTransactionMessage(innerConfig) {
                const abortSignal = innerConfig ? innerConfig.abortSignal : undefined;
                return pipe(
                    createTransactionMessage({ version: 0 }),
                    tx => setTransactionMessageFeePayer(config.feePayer.address, tx),
                    tx => config.cuPrice ? appendTransactionMessageInstruction(
                        getSetComputeUnitPriceInstruction({
                            microLamports: config.cuPrice,
                        }),
                        tx
                    ) : tx,
                    tx => fillProvisorySetComputeUnitLimitInstruction(tx),
                    async tx => {
                        if (config.blockhash) {
                            return setTransactionMessageLifetimeUsingBlockhash(config.blockhash, tx);
                        } else {
                            const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send({ abortSignal });
                            return setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx);
                        }
                    }
                )
            }
        })

        return {
            async instruction(instruction: Instruction, abortSignal?: AbortSignal): Promise<TransactionPlan> {
                return await transactionPlanner(singleInstructionPlan(instruction), { abortSignal });
            },
            async instructions(instructions: Instruction[], abortSignal?: AbortSignal): Promise<TransactionPlan> {
                return await transactionPlanner(sequentialInstructionPlan(instructions), { abortSignal });
            },
            async instructionPlan(plan: InstructionPlan, abortSignal?: AbortSignal): Promise<TransactionPlan> {
                return await transactionPlanner(plan, { abortSignal });
            }
        }
    }

    const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
    const estimateCULimit = estimateComputeUnitLimitFactory({ rpc });
    // TODO: should we add a number => number function param to estimateAndUpdateProvisoryComputeUnitLimitFactory?
    async function estimateWithMultiplier(...args: Parameters<typeof estimateCULimit>): Promise<number> {
        const estimate = await estimateCULimit(...args);
        return Math.ceil(estimate * 1.1);
    }
    const estimateAndSetCULimit = estimateAndUpdateProvisoryComputeUnitLimitFactory(estimateWithMultiplier);

    const transactionExecutor = createTransactionPlanExecutor({
        async executeTransactionMessage(message, config) {
            const abortSignal = config ? config.abortSignal : undefined;
            const messageWithCUEstimate = await estimateAndSetCULimit(message, { abortSignal });
            const signedTransaction = await signTransactionMessageWithSigners(messageWithCUEstimate, { abortSignal });
            assertIsTransactionWithBlockhashLifetime(signedTransaction);
            await sendAndConfirm(signedTransaction, { commitment: 'confirmed', abortSignal });
            return { transaction: signedTransaction };
        }
    })

    return {
        rpc,
        rpcSubscriptions,
        async airdrop(recipientAddress: Address, lamports: Lamports): Promise<Signature> {
            return await airdrop({
                commitment: 'confirmed',
                recipientAddress,
                lamports,
            });
        },
        transaction(config: TransactionConfig): TransactionBuilder {
            return transactionBuilder(config);
        },
        async sendAndConfirm(transactionPlan: TransactionPlan, abortSignal?: AbortSignal): Promise<TransactionPlanResult> {
            return await transactionExecutor(transactionPlan, { abortSignal });
        }
    }
}

// Example: Generate a new signer, airdrop it 1 SOL, then transfer lamports to a new destination account
const client = createSolanaClient('http://127.0.0.1:8899');

const signer = await generateKeyPairSigner();
await client.airdrop(signer.address, lamports(1_000_000_000n));
log.info('Airdropped 1 SOL to the new signer address');

const { value: balance } = await client.rpc.getBalance(signer.address).send();
log.info({ address: signer.address, balance }, 'New balance for signer account');

const destination = await generateKeyPairSigner();
const transaction = await client.transaction({ feePayer: signer }).instruction(
    getTransferSolInstruction({
        source: signer,
        destination: destination.address,
        amount: lamports(1_000_000n),
    })
)
const result = await client.sendAndConfirm(transaction);
// TODO: helpers for parsing tx plan results
if (result.kind === 'single' && result.status.kind === 'successful') {
    const signature = getSignatureFromTransaction(result.status.transaction);
    log.info({ signature }, 'Transfer transaction confirmed');
}
await pressAnyKeyPrompt('Press any key to quit');
