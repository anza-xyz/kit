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
    appendTransactionMessageInstructions,
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
    parallelInstructionPlan,
    pipe,
    sendAndConfirmTransactionFactory,
    sequentialInstructionPlan,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    Signature,
    signTransactionMessageWithSigners,
    singleTransactionPlan,
    SolanaRpcApi,
    SolanaRpcSubscriptionsApi,
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithFeePayer,
    TransactionPartialSigner,
    TransactionPlan,
    TransactionPlanResult,
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

type Client<TRpcApi = SolanaRpcApi, TRpcSubscriptionsApi = SolanaRpcSubscriptionsApi> = {
    rpc: TRpcApi;
    rpcSubscriptions: TRpcSubscriptionsApi;
    airdrop(recipientAddress: Address, amount: number | bigint | Lamports): Promise<Signature>;
    transaction(config: TransactionConfig): TransactionBuilder;
    transactionPlan(config: TransactionConfig): TransactionPlanBuilder;
    sendAndConfirm(transaction: SendableTransactionMessage | TransactionPlan, abortSignal?: AbortSignal): Promise<TransactionPlanResult>;
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
                    const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send({ abortSignal });
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

    const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
    const estimateCULimit = estimateComputeUnitLimitFactory({ rpc });
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
        async airdrop(recipientAddress: Address, amount: number | bigint | Lamports): Promise<Signature> {
            const lamportsAmount = typeof amount === 'number' ? lamports(BigInt(amount)) : typeof amount === 'bigint' ? lamports(amount) : amount;
            return await airdrop({
                commitment: 'confirmed',
                recipientAddress,
                lamports: lamportsAmount,
            });
        },
        transaction(config: TransactionConfig): TransactionBuilder {
            return transactionBuilder(config);
        },
        transactionPlan(config: TransactionConfig): TransactionPlanBuilder {
            return transactionPlanBuilder(config);
        },
        async sendAndConfirm(transaction: TransactionMessage & TransactionMessageWithFeePayer | TransactionPlan, abortSignal?: AbortSignal): Promise<TransactionPlanResult> {
            let transactionPlan: TransactionPlan;
            if ('kind' in transaction) {
                transactionPlan = transaction;
            } else {
                transactionPlan = singleTransactionPlan(transaction);
            }
            return await transactionExecutor(transactionPlan, { abortSignal });
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

const client = createSolanaClient('http://127.0.0.1:8899');

// Example: Airdrop SOL to a new signer

const signer = await generateKeyPairSigner();
await client.airdrop(signer.address, sol(1));
log.info('Airdropped 1 SOL to the new signer address');

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
            amount: lamports(1_000_000n),
        })
    )
    const result = await client.sendAndConfirm(transaction);
    // TODO: helpers for parsing tx plan results
    if (result.kind === 'single' && result.status.kind === 'successful') {
        const signature = getSignatureFromTransaction(result.status.transaction);
        log.info({ signature }, 'Transfer transaction confirmed');
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
    const result = await client.sendAndConfirm(transaction);
    const signature = getSignatures(result)[0];
    log.info({ signature, mintAddress: tokenMint.address }, 'Mint creation transaction confirmed');
    await pressAnyKeyPrompt('Press any key to continue');
}
await createMintExample();

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
    const signatures = getSignatures(result);
    log.info({ signatures, mintAddress: tokenMint.address }, 'Token airdrop transactions confirmed for multiple recipients');
    await pressAnyKeyPrompt('Press any key to quit');
}
await tokenAirdropExample();

// TODO: helper for something like this in Kit
function getSignatures(result: TransactionPlanResult): Signature[] {
    const signatures: Signature[] = [];

    function traverse(result: TransactionPlanResult) {
        if (result.kind === 'single') {
            if (result.status.kind === 'successful') {
                const signature = getSignatureFromTransaction(result.status.transaction);
                signatures.push(signature);
            }
        } else if (result.kind === 'parallel' || result.kind === 'sequential') {
            for (const subResult of result.plans) {
                traverse(subResult);
            }
        }
    }

    traverse(result);
    return signatures;
}
