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
    address,
    Address,
    airdropFactory,
    appendTransactionMessageInstruction,
    appendTransactionMessageInstructions,
    assertIsTransactionWithBlockhashLifetime,
    BlockhashLifetimeConstraint,
    ClusterUrl,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    createTransactionMessage,
    createTransactionPlanExecutor,
    createTransactionPlanner,
    devnet,
    generateKeyPairSigner,
    getSignatureFromTransaction,
    Instruction,
    InstructionPlan,
    lamports,
    Lamports,
    mainnet,
    MainnetUrl,
    parallelInstructionPlan,
    pipe,
    Rpc,
    RpcSubscriptions,
    sendAndConfirmTransactionFactory,
    sequentialInstructionPlan,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    Signature,
    signTransactionMessageWithSigners,
    singleTransactionPlan,
    SolanaError,
    SolanaRpcApi,
    SolanaRpcApiFromClusterUrl,
    SolanaRpcSubscriptionsApi,
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithFeePayer,
    TransactionPartialSigner,
    TransactionPlan,
    TransactionPlanResult,
    TransactionPlanResultContext,
} from '@solana/kit';
import { getCreateAccountInstruction, getTransferSolInstruction } from '@solana-program/system';
import { estimateAndUpdateProvisoryComputeUnitLimitFactory, estimateComputeUnitLimitFactory, fillProvisorySetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction } from '@solana-program/compute-budget';
import { findAssociatedTokenPda, getCreateAssociatedTokenInstruction, getInitializeMint2Instruction, getMintSize, getMintToCheckedInstruction, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';

const log = createLogger('Helper Lib');

type TransactionConfig = {
    feePayer: TransactionPartialSigner;
    blockhash?: BlockhashLifetimeConstraint;
    cuPrice?: number | bigint;
}

type SendableTransactionMessage = TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithBlockhashLifetime;

type TransactionBuilder = {
    instruction(instruction: Instruction): Promise<SendableTransactionMessage>;
    instructions(instructions: Instruction[]): Promise<SendableTransactionMessage>;
}

type TransactionPlanBuilder = {
    instructionPlan(plan: InstructionPlan): Promise<TransactionPlan>;
}

/**
 * A compact summary of a {@link SingleTransactionPlanResult}.
 */
export type CompactSingleTransactionSummary<
    TContext extends TransactionPlanResultContext = TransactionPlanResultContext,
> =
    | Readonly<{
        context?: TContext;
        signature: Signature;
        status: 'successful';
    }>
    | Readonly<{
        error: SolanaError;
        status: 'failed';
    }>
    | Readonly<{
        status: 'canceled';
    }>;

/**
 * Summarizes a {@link TransactionPlanResult} into a flat array of compact single transaction summaries.
 * @param result The transaction plan result to summarize
 * @returns An array of compact single transaction summaries
 */
function summarizeTransactionPlanResult(result: TransactionPlanResult): CompactSingleTransactionSummary[] {
    const transactionResults: CompactSingleTransactionSummary[] = [];

    function traverse(result: TransactionPlanResult) {
        if (result.kind === 'single') {
            if (result.status.kind === 'successful') {
                const signature = getSignatureFromTransaction(result.status.transaction);
                transactionResults.push({ context: result.status.context, signature, status: 'successful' });
            } else if (result.status.kind === 'failed') {
                transactionResults.push({ error: result.status.error, status: 'failed' });
            } else if (result.status.kind === 'canceled') {
                transactionResults.push({ status: 'canceled' });
            }
        } else {
            for (const subResult of result.plans) {
                traverse(subResult);
            }
        }
    }

    traverse(result);
    return transactionResults;
}

type HideFromMainnet<TClusterUrl extends ClusterUrl, T> = TClusterUrl extends MainnetUrl ? never : T;

type SolanaClient<
    TClusterUrl extends ClusterUrl,
    TRpcApi extends SolanaRpcApiFromClusterUrl<TClusterUrl> = SolanaRpcApiFromClusterUrl<TClusterUrl>,
    TRpcSubscriptionsApi extends SolanaRpcSubscriptionsApi = SolanaRpcSubscriptionsApi,
> = {
    rpc: Rpc<TRpcApi>;
    rpcSubscriptions: RpcSubscriptions<TRpcSubscriptionsApi>;
    airdrop: HideFromMainnet<TClusterUrl, (recipientAddress: Address, amount: number | bigint | Lamports) => Promise<Signature>>;
    transaction(config: TransactionConfig): TransactionBuilder;
    transactionPlan(config: TransactionConfig): TransactionPlanBuilder;
    sendAndConfirm(transaction: SendableTransactionMessage | TransactionPlan, abortSignal?: AbortSignal): Promise<CompactSingleTransactionSummary[]>;
}

function createSolanaClient<TClusterUrl extends ClusterUrl>(
    rpcEndpoint: TClusterUrl,
    rpcSubscriptionsEndpoint?: TClusterUrl
): SolanaClient<TClusterUrl> {
    const rpc = createSolanaRpc(rpcEndpoint);
    // Typescript doesn't know the cluster URL, so internally we cast to the base SolanaRpcApi
    // We return `rpc` which is cluster-aware though
    const internalRpc = rpc as Rpc<SolanaRpcApi>;

    const rpcSubscriptionsEndpointOrDefault = rpcSubscriptionsEndpoint
        ? rpcSubscriptionsEndpoint
        : (rpcEndpoint.replace('http', 'ws').replace('8899', '8900') as TClusterUrl);
    const rpcSubscriptions = createSolanaRpcSubscriptions(rpcSubscriptionsEndpointOrDefault);
    const internalRpcSubscriptions = rpcSubscriptions as RpcSubscriptions<SolanaRpcSubscriptionsApi>;

    // We hide this from mainnet in the `SolanaClient` type
    const airdrop = airdropFactory({ rpc: internalRpc, rpcSubscriptions: internalRpcSubscriptions });

    async function createBaseTransactionMessage(config: TransactionConfig, abortSignal?: AbortSignal): Promise<SendableTransactionMessage> {
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
                    const { value: latestBlockhash } = await internalRpc.getLatestBlockhash({ commitment: 'confirmed' }).send({ abortSignal });
                    return setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx);
                }
            }
        )
    }

    function transactionBuilder(config: TransactionConfig): TransactionBuilder {
        return {
            async instruction(instruction: Instruction, abortSignal?: AbortSignal): Promise<SendableTransactionMessage> {
                const baseMessage = await createBaseTransactionMessage(config, abortSignal);
                return pipe(
                    baseMessage,
                    tx => appendTransactionMessageInstruction(instruction, tx)
                )
            },
            async instructions(instructions: Instruction[], abortSignal?: AbortSignal): Promise<SendableTransactionMessage> {
                const baseMessage = await createBaseTransactionMessage(config, abortSignal);
                return pipe(
                    baseMessage,
                    tx => appendTransactionMessageInstructions(instructions, tx)
                )
            }
        }
    }

    function transactionPlanBuilder(config: TransactionConfig): TransactionPlanBuilder {
        const transactionPlanner = createTransactionPlanner({
            async createTransactionMessage(innerConfig) {
                const abortSignal = innerConfig ? innerConfig.abortSignal : undefined;
                return await createBaseTransactionMessage(config, abortSignal);
            }
        })

        return {
            async instructionPlan(plan: InstructionPlan, abortSignal?: AbortSignal): Promise<TransactionPlan> {
                return await transactionPlanner(plan, { abortSignal });
            }
        }
    }

    const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc: internalRpc, rpcSubscriptions: internalRpcSubscriptions });
    const estimateCULimit = estimateComputeUnitLimitFactory({ rpc: internalRpc });
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

    async function airdropHelper(recipientAddress: Address, amount: number | bigint | Lamports): Promise<Signature> {
        const lamportsAmount = typeof amount === 'number' ? lamports(BigInt(amount)) : typeof amount === 'bigint' ? lamports(amount) : amount;
        return await airdrop({
            commitment: 'confirmed',
            recipientAddress,
            lamports: lamportsAmount,
        });
    }

    return {
        rpc,
        rpcSubscriptions,
        airdrop: airdropHelper as HideFromMainnet<TClusterUrl, typeof airdropHelper>,
        transaction(config: TransactionConfig): TransactionBuilder {
            return transactionBuilder(config);
        },
        transactionPlan(config: TransactionConfig): TransactionPlanBuilder {
            return transactionPlanBuilder(config);
        },
        async sendAndConfirm(transaction: TransactionMessage & TransactionMessageWithFeePayer | TransactionPlan, abortSignal?: AbortSignal): Promise<CompactSingleTransactionSummary[]> {
            let transactionPlan: TransactionPlan;
            if ('kind' in transaction) {
                transactionPlan = transaction;
            } else {
                transactionPlan = singleTransactionPlan(transaction);
            }
            const planResult = await transactionExecutor(transactionPlan, { abortSignal });
            return summarizeTransactionPlanResult(planResult);
        }
    }
}

function sol(amount: number): Lamports {
    return lamports(BigInt(Math.ceil(amount * 1_000_000_000)));
}

function displayAmount(amount: bigint, decimals: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
        // @ts-expect-error TS doesn't know you can do this yet
    }).format(`${amount}E-${decimals}`);
}

const client = createSolanaClient('http://127.0.0.1:8899', 'ws://127.0.0.1:8900');

// Example: Airdrop SOL to a new signer
const signer = await generateKeyPairSigner();
await client.airdrop(signer.address, sol(1.5));
log.info('Airdropped 1.5 SOL to the new signer address');

const { value: balance } = await client.rpc.getBalance(signer.address).send();
log.info({ address: signer.address, balance: `${displayAmount(balance, 9)} SOL` }, 'New balance for signer account');
await pressAnyKeyPrompt('Press any key to continue');

// Example: Transfer lamports to a new account
async function transferExample() {
    const destination = await generateKeyPairSigner();
    const transaction = await client.transaction({ feePayer: signer }).instruction(
        getTransferSolInstruction({
            source: signer,
            destination: destination.address,
            amount: sol(0.001),
        })
    )
    const [result] = await client.sendAndConfirm(transaction);
    if (result.status === 'successful') {
        const signature = result.signature;
        log.info({ signature }, 'Transfer transaction confirmed');
    } else {
        log.error({ result }, 'Transfer transaction failed');
    }
    await pressAnyKeyPrompt('Press any key to continue');
}
await transferExample();

// Example: Create a new mint
async function createMintExample() {
    const tokenMint = await generateKeyPairSigner();

    const mintSize = getMintSize();
    const lamportsForMintAccount = await client.rpc.getMinimumBalanceForRentExemption(BigInt(mintSize)).send();

    const transaction = await client.transaction({ feePayer: signer }).instructions([
        getCreateAccountInstruction({
            payer: signer,
            newAccount: tokenMint,
            lamports: lamportsForMintAccount,
            space: mintSize,
            programAddress: TOKEN_PROGRAM_ADDRESS,
        }),
        getInitializeMint2Instruction({
            mint: tokenMint.address,
            decimals: 6,
            mintAuthority: signer.address,
        })
    ])
    const [result] = await client.sendAndConfirm(transaction);
    if (result.status === 'successful') {
        const signature = result.signature;
        log.info({ signature, mintAddress: tokenMint.address }, 'Mint creation transaction confirmed');
    } else {
        log.error({ result }, 'Transfer transaction failed');
    }
    await pressAnyKeyPrompt('Press any key to continue');
}
await createMintExample();

// Example: Airdrop tokens to multiple recipients
async function tokenAirdropExample() {
    const tokenMint = await generateKeyPairSigner();

    const mintSize = getMintSize();
    const lamportsForMintAccount = await client.rpc.getMinimumBalanceForRentExemption(BigInt(mintSize)).send();

    const destinationAddresses = await Promise.all(
        Array.from({ length: 100 }, async () => {
            const signer = await generateKeyPairSigner();
            return signer.address;
        }),
    );

    const destinationTokenAccountAddresses = await Promise.all(destinationAddresses.map(async ownerAddress => {
        const [address] = await findAssociatedTokenPda({
            owner: ownerAddress,
            mint: tokenMint.address,
            tokenProgram: TOKEN_PROGRAM_ADDRESS
        });
        return address;
    }));

    const instructionPlan = sequentialInstructionPlan([
        getCreateAccountInstruction({
            payer: signer,
            newAccount: tokenMint,
            lamports: lamportsForMintAccount,
            space: mintSize,
            programAddress: TOKEN_PROGRAM_ADDRESS,
        }),
        getInitializeMint2Instruction({
            mint: tokenMint.address,
            decimals: 6,
            mintAuthority: signer.address,
        }),
        parallelInstructionPlan(destinationAddresses.map((address, index) =>
            sequentialInstructionPlan([
                // create the associated token account
                getCreateAssociatedTokenInstruction({
                    payer: signer,
                    ata: destinationTokenAccountAddresses[index],
                    owner: address,
                    mint: tokenMint.address,
                }),
                // mint to this token account
                getMintToCheckedInstruction({
                    mint: tokenMint.address,
                    token: destinationTokenAccountAddresses[index],
                    mintAuthority: signer,
                    amount: 1_000 * (10 ** 6), // 1,000 tokens each, considering 6 decimals
                    decimals: 6,
                })
            ])
        ))
    ])

    const { value: blockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();
    const transactionPlan = await client.transactionPlan({ feePayer: signer, blockhash }).instructionPlan(instructionPlan);
    const result = await client.sendAndConfirm(transactionPlan);
    if (result.every(r => r.status === 'successful')) {
        const signatures = result.map(r => r.signature);
        log.info({ signatures, mintAddress: tokenMint.address }, 'Token airdrop transactions confirmed for multiple recipients');
    } else {
        log.error({ result }, 'Token airdrop failed');
    }
    await pressAnyKeyPrompt('Press any key to quit');
}
await tokenAirdropExample();

// Additional typetests
async () => {
    const client = createSolanaClient('');
    await client.rpc.requestAirdrop(address('a'), lamports(1n)).send();
    await client.airdrop(address('a'), 1);
    sendAndConfirmTransactionFactory({ rpc: client.rpc, rpcSubscriptions: client.rpcSubscriptions });

    const devnetClient = createSolanaClient(devnet(''));
    await devnetClient.rpc.requestAirdrop(address('a'), lamports(1n)).send();
    await devnetClient.airdrop(address('a'), 1);
    sendAndConfirmTransactionFactory({ rpc: devnetClient.rpc, rpcSubscriptions: devnetClient.rpcSubscriptions });

    const mainnetClient = createSolanaClient(mainnet(''));
    await mainnetClient.rpc.getBalance(address('a')).send();
    // @ts-expect-error requestAirdrop should be unavailable on mainnet rpc
    await mainnetClient.rpc.requestAirdrop(address('a'), lamports(1n)).send();
    // @ts-expect-error airdrop should be unavailable on mainnet client
    await mainnetClient.airdrop(address('a'), 1); // should error
    sendAndConfirmTransactionFactory({ rpc: mainnetClient.rpc, rpcSubscriptions: mainnetClient.rpcSubscriptions });
}
