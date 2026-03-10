import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';
import { Blockhash } from '@solana/rpc-types';

import { CompiledTransactionMessageWithLifetime, V1CompiledTransactionMessage } from '../../../compile/message';
import { CompiledTransactionConfigValue } from '../../../compile/v1/config';
import { Nonce } from '../../../durable-nonce';
import { decompileTransactionMessage } from '../message';

describe('decompileTransactionMessage (v1)', () => {
    const U64_MAX = 2n ** 64n - 1n;

    const feePayer = '7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK' as Address;
    const account1 = 'H4RdPRWYk3pKw2CkNznxQK6J6herjgQke2pzFJW4GC6x' as Address;
    const account2 = 'BPFLoaderUpgradeab1e11111111111111111111111' as Address;
    const account3 = 'B5Fz4ToKPTzVXHwrAjorBLxwjoDp2ReeZbKXbq38AKgj' as Address;
    const account4 = 'D56dcHE1GALkcjJ7dAFGtus48iev7A8deHNY9dHLXrnq' as Address;
    const program1 = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;
    const program2 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address;
    const program3 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address;
    const blockhash = 'J4yED2jcMAHyQUg61DBmm4njmEydUr2WqrV9cdEcDDgL' as Blockhash;

    function getMockV1CompiledTransactionMessage({
        lifetimeToken,
    }: {
        lifetimeToken?: Blockhash | Nonce;
    } = {}): CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage {
        return {
            configMask: 0,
            configValues: [],
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 1,
            },
            instructionHeaders: [],
            instructionPayloads: [],
            lifetimeToken: lifetimeToken ?? blockhash,
            numInstructions: 0,
            numStaticAccounts: 1,
            staticAccounts: [feePayer],
            version: 1,
        };
    }

    describe('for a transaction with a blockhash lifetime', () => {
        it('decompiles a v1 transaction with no instructions and no config', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage({ lifetimeToken: blockhash }),
                instructionHeaders: [],
                instructionPayloads: [],
                version: 1,
            };

            const transaction = decompileTransactionMessage(compiledTransaction);

            expect(transaction.version).toBe(1);
            expect(transaction.feePayer.address).toBe(feePayer);
            expect(transaction.lifetimeConstraint).toStrictEqual({
                blockhash,
                lastValidBlockHeight: U64_MAX,
            });
            expect(transaction.instructions).toStrictEqual([]);
            expect(transaction).not.toHaveProperty('config');
        });

        it('freezes the blockhash lifetime constraint', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage =
                getMockV1CompiledTransactionMessage({ lifetimeToken: blockhash });

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.lifetimeConstraint).toBeFrozenObject();
        });

        it('decompiles a transaction with one instruction with no accounts or data', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage(),
                header: {
                    numReadonlyNonSignerAccounts: 1, // program address
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1, // fee payer
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 0,
                        numInstructionDataBytes: 0,
                        programAccountIndex: 1,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [],
                        instructionData: new Uint8Array(),
                    },
                ],
                numInstructions: 1,
                numStaticAccounts: 2,
                staticAccounts: [feePayer, program1],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions).toStrictEqual([
                {
                    programAddress: program1,
                },
            ]);
        });

        it('decompiles a transaction with one instruction with accounts and data', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage(),
                header: {
                    numReadonlyNonSignerAccounts: 2, // 1 passed into instruction + 1 program
                    numReadonlySignerAccounts: 1,
                    numSignerAccounts: 3, // fee payer + 2 passed into instruction
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 4,
                        numInstructionDataBytes: 5,
                        programAccountIndex: 5,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [1, 2, 3, 4],
                        instructionData: new Uint8Array([0, 1, 2, 3, 4]),
                    },
                ],
                numInstructions: 1,
                numStaticAccounts: 6,
                staticAccounts: [
                    // writable signers
                    feePayer,
                    account1,
                    // readonly signers
                    account2,
                    // writable non-signers
                    account3,
                    // readonly non-signers
                    account4,
                    program1,
                ],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions).toHaveLength(1);
            expect(transaction.instructions).toStrictEqual([
                {
                    accounts: [
                        {
                            address: account1,
                            role: AccountRole.WRITABLE_SIGNER,
                        },
                        {
                            address: account2,
                            role: AccountRole.READONLY_SIGNER,
                        },
                        {
                            address: account3,
                            role: AccountRole.WRITABLE,
                        },
                        {
                            address: account4,
                            role: AccountRole.READONLY,
                        },
                    ],
                    data: new Uint8Array([0, 1, 2, 3, 4]),
                    programAddress: program1,
                },
            ]);
        });

        it('freezes the instruction accounts', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage(),
                header: {
                    numReadonlyNonSignerAccounts: 2,
                    numReadonlySignerAccounts: 1,
                    numSignerAccounts: 3,
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 4,
                        numInstructionDataBytes: 5,
                        programAccountIndex: 5,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [1, 2, 3, 4],
                        instructionData: new Uint8Array([0, 1, 2, 3, 4]),
                    },
                ],
                numInstructions: 1,
                numStaticAccounts: 6,
                staticAccounts: [
                    // writable signers
                    feePayer,
                    // read-only signers
                    account1,
                    account2,
                    // writable non-signers
                    account3,
                    // readonly non-signers
                    account4,
                    program1,
                ],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions[0].accounts).toBeFrozenObject();
        });

        it('decompiles a transaction with multiple instructions', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage(),
                header: {
                    numReadonlyNonSignerAccounts: 3, // 3 programs
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1, // fee payer
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 0,
                        numInstructionDataBytes: 0,
                        programAccountIndex: 1,
                    },
                    {
                        numInstructionAccounts: 0,
                        numInstructionDataBytes: 0,
                        programAccountIndex: 2,
                    },
                    {
                        numInstructionAccounts: 0,
                        numInstructionDataBytes: 0,
                        programAccountIndex: 3,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [],
                        instructionData: new Uint8Array(),
                    },
                    {
                        instructionAccountIndices: [],
                        instructionData: new Uint8Array(),
                    },
                    {
                        instructionAccountIndices: [],
                        instructionData: new Uint8Array(),
                    },
                ],
                numInstructions: 3,
                numStaticAccounts: 4,
                staticAccounts: [
                    feePayer,
                    // read-only non-signers
                    program1,
                    program2,
                    program3,
                ],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions).toStrictEqual([
                {
                    programAddress: program1,
                },
                {
                    programAddress: program2,
                },
                {
                    programAddress: program3,
                },
            ]);
        });

        it('decompiles a transaction with a given lastValidBlockHeight', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage =
                getMockV1CompiledTransactionMessage({ lifetimeToken: blockhash });

            const transaction = decompileTransactionMessage(compiledTransaction, { lastValidBlockHeight: 100n });
            expect(transaction.lifetimeConstraint).toStrictEqual({
                blockhash,
                lastValidBlockHeight: 100n,
            });
        });

        it('freezes the instructions within the transaction', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage(),
                header: {
                    numReadonlyNonSignerAccounts: 1,
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1,
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 0,
                        numInstructionDataBytes: 0,
                        programAccountIndex: 1,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [],
                        instructionData: new Uint8Array(),
                    },
                ],
                numInstructions: 1,
                numStaticAccounts: 2,
                staticAccounts: [feePayer, program1],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions[0]).toBeFrozenObject();
        });
    });

    describe('for a transaction with a durable nonce lifetime', () => {
        const nonce = '27kqzE1RifbyoFtibDRTjbnfZ894jsNpuR77JJkt3vgH' as Nonce;
        const nonceAccountAddress = 'DhezFECsqmzuDxeuitFChbghTrwKLdsKdVsGArYbFEtm' as Address;
        const nonceAuthorityAddress = '2KntmCrnaf63tpNb8UMFFjFGGnYYAKQdmW9SbuCiRvhM' as Address;
        const systemProgramAddress = '11111111111111111111111111111111' as Address;
        const recentBlockhashesSysvarAddress = 'SysvarRecentB1ockHashes11111111111111111111' as Address;

        it('decompiles a transaction with advance nonce instruction where fee payer is nonce authority', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage({ lifetimeToken: nonce }),
                header: {
                    numReadonlyNonSignerAccounts: 2, // recent blockhashes sysvar, system program
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1, // fee payer and nonce authority are the same
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 3,
                        numInstructionDataBytes: 4,
                        programAccountIndex: 2,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [1, 3, 0],
                        instructionData: new Uint8Array([4, 0, 0, 0]),
                    },
                ],
                numInstructions: 1,
                numStaticAccounts: 4,
                staticAccounts: [
                    // writable signers
                    nonceAuthorityAddress,
                    // writable non-signers
                    nonceAccountAddress,
                    // readonly non-signers
                    systemProgramAddress,
                    recentBlockhashesSysvarAddress,
                ],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions).toStrictEqual([
                {
                    accounts: [
                        {
                            address: nonceAccountAddress,
                            role: AccountRole.WRITABLE,
                        },
                        {
                            address: recentBlockhashesSysvarAddress,
                            role: AccountRole.READONLY,
                        },
                        {
                            address: nonceAuthorityAddress,
                            role: AccountRole.WRITABLE_SIGNER,
                        },
                    ],
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddress: systemProgramAddress,
                },
            ]);
            expect(transaction.feePayer.address).toBe(nonceAuthorityAddress);
            expect(transaction.lifetimeConstraint).toStrictEqual({ nonce });
        });

        it('freezes the nonce lifetime constraint', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage({ lifetimeToken: nonce }),
                header: {
                    numReadonlyNonSignerAccounts: 2,
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1,
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 3,
                        numInstructionDataBytes: 4,
                        programAccountIndex: 2,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [1, 3, 0],
                        instructionData: new Uint8Array([4, 0, 0, 0]),
                    },
                ],
                numInstructions: 1,
                numStaticAccounts: 4,
                staticAccounts: [
                    nonceAuthorityAddress,
                    nonceAccountAddress,
                    systemProgramAddress,
                    recentBlockhashesSysvarAddress,
                ],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.lifetimeConstraint).toBeFrozenObject();
        });

        it('decompiles a transaction with advance nonce instruction where fee payer is not nonce authority', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage({ lifetimeToken: nonce }),
                header: {
                    numReadonlyNonSignerAccounts: 2, // recent blockhashes sysvar, system program
                    numReadonlySignerAccounts: 1, // nonce authority
                    numSignerAccounts: 2, // fee payer, nonce authority
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 3,
                        numInstructionDataBytes: 4,
                        programAccountIndex: 3,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [2, 4, 1],
                        instructionData: new Uint8Array([4, 0, 0, 0]),
                    },
                ],
                numInstructions: 1,
                numStaticAccounts: 5,
                staticAccounts: [
                    // writable signers
                    feePayer,
                    // readonly signers
                    nonceAuthorityAddress,
                    // writable non-signers
                    nonceAccountAddress,
                    // readonly non-signers
                    systemProgramAddress,
                    recentBlockhashesSysvarAddress,
                ],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions).toStrictEqual([
                {
                    accounts: [
                        {
                            address: nonceAccountAddress,
                            role: AccountRole.WRITABLE,
                        },
                        {
                            address: recentBlockhashesSysvarAddress,
                            role: AccountRole.READONLY,
                        },
                        {
                            address: nonceAuthorityAddress,
                            role: AccountRole.READONLY_SIGNER,
                        },
                    ],
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddress: systemProgramAddress,
                },
            ]);
            expect(transaction.feePayer.address).toBe(feePayer);
            expect(transaction.lifetimeConstraint).toStrictEqual({ nonce });
        });

        it('decompiles a durable nonce transaction with multiple instructions', () => {
            const programAddress1 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address;
            const programAddress2 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address;

            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage({ lifetimeToken: nonce }),
                header: {
                    numReadonlyNonSignerAccounts: 4, // recent blockhashes, system program, 2 other programs
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1,
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 3,
                        numInstructionDataBytes: 4,
                        programAccountIndex: 2,
                    },
                    {
                        numInstructionAccounts: 0,
                        numInstructionDataBytes: 0,
                        programAccountIndex: 4,
                    },
                    {
                        numInstructionAccounts: 0,
                        numInstructionDataBytes: 0,
                        programAccountIndex: 5,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [1, 3, 0],
                        instructionData: new Uint8Array([4, 0, 0, 0]),
                    },
                    {
                        instructionAccountIndices: [],
                        instructionData: new Uint8Array(),
                    },
                    {
                        instructionAccountIndices: [],
                        instructionData: new Uint8Array(),
                    },
                ],
                numInstructions: 3,
                numStaticAccounts: 6,
                staticAccounts: [
                    nonceAuthorityAddress,
                    nonceAccountAddress,
                    systemProgramAddress,
                    recentBlockhashesSysvarAddress,
                    programAddress1,
                    programAddress2,
                ],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions).toHaveLength(3);
            expect(transaction.instructions[0].programAddress).toBe(systemProgramAddress);
            expect(transaction.instructions[1].programAddress).toBe(programAddress1);
            expect(transaction.instructions[2].programAddress).toBe(programAddress2);
            expect(transaction.lifetimeConstraint).toStrictEqual({ nonce });
        });

        it('freezes all instructions in nonce transaction', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage({ lifetimeToken: nonce }),
                header: {
                    numReadonlyNonSignerAccounts: 2,
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1,
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 3,
                        numInstructionDataBytes: 4,
                        programAccountIndex: 2,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [1, 3, 0],
                        instructionData: new Uint8Array([4, 0, 0, 0]),
                    },
                ],
                numInstructions: 1,
                numStaticAccounts: 4,
                staticAccounts: [
                    nonceAuthorityAddress,
                    nonceAccountAddress,
                    systemProgramAddress,
                    recentBlockhashesSysvarAddress,
                ],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions[0]).toBeFrozenObject();
        });
    });

    describe('for a transaction with config values', () => {
        const blockhash = 'J4yED2jcMAHyQUg61DBmm4njmEydUr2WqrV9cdEcDDgL' as Blockhash;

        it('converts a transaction with priority fee config', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage(),
                configMask: 0b11,
                configValues: [{ kind: 'u64', value: 5_000n }] as CompiledTransactionConfigValue[],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.config).toStrictEqual({
                priorityFeeLamports: 5_000n,
            });
        });

        it('converts a transaction with all config values', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage(),
                configMask: 0b11111,
                configValues: [
                    { kind: 'u64', value: 10_000n },
                    { kind: 'u32', value: 400_000 },
                    { kind: 'u32', value: 80_000 },
                    { kind: 'u32', value: 512_000 },
                ] as CompiledTransactionConfigValue[],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.config).toStrictEqual({
                computeUnitLimit: 400_000,
                heapSize: 512_000,
                loadedAccountsDataSizeLimit: 80_000,
                priorityFeeLamports: 10_000n,
            });
        });

        it('does not include config field when configMask is 0', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage(),
                configMask: 0,
                configValues: [],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction).not.toHaveProperty('config');
        });

        it('converts a transaction with config and instructions', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage(),
                configMask: 0b100,
                configValues: [{ kind: 'u32', value: 300_000 }] as CompiledTransactionConfigValue[],
                header: {
                    numReadonlyNonSignerAccounts: 1,
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1,
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 0,
                        numInstructionDataBytes: 2,
                        programAccountIndex: 1,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [],
                        instructionData: new Uint8Array([7, 8]),
                    },
                ],
                numInstructions: 1,
                numStaticAccounts: 2,
                staticAccounts: [feePayer, program1],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.config).toStrictEqual({
                computeUnitLimit: 300_000,
            });
            expect(transaction.instructions).toStrictEqual([
                {
                    data: new Uint8Array([7, 8]),
                    programAddress: program1,
                },
            ]);
        });

        it('freezes the config object', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage(),
                configMask: 0b11,
                configValues: [{ kind: 'u64', value: 5_000n }] as CompiledTransactionConfigValue[],
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.config).toBeFrozenObject();
        });

        it('converts a complex transaction with all features', () => {
            const compiledTransaction: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                ...getMockV1CompiledTransactionMessage(),
                configMask: 0b11111,
                configValues: [
                    { kind: 'u64', value: 10_000n },
                    { kind: 'u32', value: 400_000 },
                    { kind: 'u32', value: 80_000 },
                    { kind: 'u32', value: 512_000 },
                ] as CompiledTransactionConfigValue[],
                header: {
                    numReadonlyNonSignerAccounts: 1,
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 2,
                },
                instructionHeaders: [
                    {
                        numInstructionAccounts: 1,
                        numInstructionDataBytes: 3,
                        programAccountIndex: 2,
                    },
                ],
                instructionPayloads: [
                    {
                        instructionAccountIndices: [1],
                        instructionData: new Uint8Array([1, 2, 3]),
                    },
                ],
                numInstructions: 1,
                numStaticAccounts: 3,
                staticAccounts: [feePayer, account1, program1],
            };

            const transaction = decompileTransactionMessage(compiledTransaction, { lastValidBlockHeight: 100n });

            expect(transaction.version).toBe(1);
            expect(transaction.feePayer.address).toBe(feePayer);
            expect(transaction.config).toStrictEqual({
                computeUnitLimit: 400_000,
                heapSize: 512_000,
                loadedAccountsDataSizeLimit: 80_000,
                priorityFeeLamports: 10_000n,
            });
            expect(transaction.instructions).toStrictEqual([
                {
                    accounts: [
                        {
                            address: account1,
                            role: AccountRole.WRITABLE_SIGNER,
                        },
                    ],
                    data: new Uint8Array([1, 2, 3]),
                    programAddress: program1,
                },
            ]);
            expect(transaction.lifetimeConstraint).toStrictEqual({
                blockhash,
                lastValidBlockHeight: 100n,
            });
        });
    });
});
