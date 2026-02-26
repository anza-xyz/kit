import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';
import { AccountRole } from '@solana/instructions';

import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '../../..';
import { Nonce } from '../../../durable-nonce';
import { decompileTransactionMessage } from '../message';

describe('decompileTransactionMessage (v0)', () => {
    const U64_MAX = 2n ** 64n - 1n;
    const feePayer = '7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK' as Address;

    describe('for a transaction with a blockhash lifetime', () => {
        const blockhash = 'J4yED2jcMAHyQUg61DBmm4njmEydUr2WqrV9cdEcDDgL';

        it('converts a v0 transaction with no instructions', () => {
            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 0,
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1,
                },
                instructions: [],
                lifetimeToken: blockhash,
                staticAccounts: [feePayer],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction);

            expect(transaction.version).toBe(0);
            expect(transaction.feePayer.address).toBe(feePayer);
            expect(transaction.lifetimeConstraint).toStrictEqual({
                blockhash,
                lastValidBlockHeight: U64_MAX,
            });
            expect(transaction.instructions).toStrictEqual([]);
        });

        it('freezes the blockhash lifetime constraint', () => {
            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 0,
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1,
                },
                instructions: [],
                lifetimeToken: blockhash,
                staticAccounts: [feePayer],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.lifetimeConstraint).toBeFrozenObject();
        });

        it('converts a transaction with one instruction with no accounts or data', () => {
            const programAddress = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;

            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 1, // program address
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1, // fee payer
                },
                instructions: [{ programAddressIndex: 1 }],
                lifetimeToken: blockhash,
                staticAccounts: [feePayer, programAddress],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions).toStrictEqual([
                {
                    programAddress,
                },
            ]);
        });

        it('converts a transaction with one instruction with accounts and data', () => {
            const programAddress = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;

            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 2, // 1 passed into instruction + 1 program
                    numReadonlySignerAccounts: 1,
                    numSignerAccounts: 3, // fee payer + 2 passed into instruction
                },
                instructions: [
                    {
                        accountIndices: [1, 2, 3, 4],
                        data: new Uint8Array([0, 1, 2, 3, 4]),
                        programAddressIndex: 5,
                    },
                ],
                lifetimeToken: blockhash,
                staticAccounts: [
                    // writable signers
                    feePayer,
                    'H4RdPRWYk3pKw2CkNznxQK6J6herjgQke2pzFJW4GC6x' as Address,
                    // read-only signers
                    'G35QeFd4jpXWfRkuRKwn8g4vYrmn8DWJ5v88Kkpd8z1V' as Address,
                    // writable non-signers
                    '3LeBzRE9Yna5zi9R8vdT3MiNQYuEp4gJgVyhhwmqfCtd' as Address,
                    // read-only non-signers
                    '8kud9bpNvfemXYdTFjs5cZ8fZinBkx8JAnhVmRwJZk5e' as Address,
                    programAddress,
                ],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions).toStrictEqual([
                {
                    accounts: [
                        {
                            address: 'H4RdPRWYk3pKw2CkNznxQK6J6herjgQke2pzFJW4GC6x' as Address,
                            role: AccountRole.WRITABLE_SIGNER,
                        },
                        {
                            address: 'G35QeFd4jpXWfRkuRKwn8g4vYrmn8DWJ5v88Kkpd8z1V' as Address,
                            role: AccountRole.READONLY_SIGNER,
                        },
                        {
                            address: '3LeBzRE9Yna5zi9R8vdT3MiNQYuEp4gJgVyhhwmqfCtd' as Address,
                            role: AccountRole.WRITABLE,
                        },
                        {
                            address: '8kud9bpNvfemXYdTFjs5cZ8fZinBkx8JAnhVmRwJZk5e' as Address,
                            role: AccountRole.READONLY,
                        },
                    ],
                    data: new Uint8Array([0, 1, 2, 3, 4]),
                    programAddress,
                },
            ]);
        });

        it('freezes the instruction accounts', () => {
            const programAddress = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;

            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 2, // 1 passed into instruction + 1 program
                    numReadonlySignerAccounts: 1,
                    numSignerAccounts: 3, // fee payer + 2 passed into instruction
                },
                instructions: [
                    {
                        accountIndices: [1, 2, 3, 4],
                        data: new Uint8Array([0, 1, 2, 3, 4]),
                        programAddressIndex: 5,
                    },
                ],
                lifetimeToken: blockhash,
                staticAccounts: [
                    // writable signers
                    feePayer,
                    'H4RdPRWYk3pKw2CkNznxQK6J6herjgQke2pzFJW4GC6x' as Address,
                    // read-only signers
                    'G35QeFd4jpXWfRkuRKwn8g4vYrmn8DWJ5v88Kkpd8z1V' as Address,
                    // writable non-signers
                    '3LeBzRE9Yna5zi9R8vdT3MiNQYuEp4gJgVyhhwmqfCtd' as Address,
                    // read-only non-signers
                    '8kud9bpNvfemXYdTFjs5cZ8fZinBkx8JAnhVmRwJZk5e' as Address,
                    programAddress,
                ],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions[0].accounts).toBeFrozenObject();
        });

        it('converts a transaction with multiple instructions', () => {
            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 3, // 3 programs
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1, // fee payer
                },
                instructions: [{ programAddressIndex: 1 }, { programAddressIndex: 2 }, { programAddressIndex: 3 }],
                lifetimeToken: blockhash,
                staticAccounts: [
                    feePayer,
                    '3hpECiFPtnyxoWqWqcVyfBUDhPKSZXWDduNXFywo8ncP' as Address,
                    'Cmqw16pVQvmW1b7Ek1ioQ5Ggf1PaoXi5XxsK9iVSbRKC' as Address,
                    'GJRYBLa6XpfswT1AN5tpGp8NHtUirwAdTPdSYXsW9L3S' as Address,
                ],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions).toStrictEqual([
                {
                    programAddress: '3hpECiFPtnyxoWqWqcVyfBUDhPKSZXWDduNXFywo8ncP' as Address,
                },
                {
                    programAddress: 'Cmqw16pVQvmW1b7Ek1ioQ5Ggf1PaoXi5XxsK9iVSbRKC' as Address,
                },
                {
                    programAddress: 'GJRYBLa6XpfswT1AN5tpGp8NHtUirwAdTPdSYXsW9L3S' as Address,
                },
            ]);
        });

        it('converts a transaction with a given lastValidBlockHeight', () => {
            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 0,
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1,
                },
                instructions: [],
                lifetimeToken: blockhash,
                staticAccounts: [feePayer],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction, { lastValidBlockHeight: 100n });
            expect(transaction.lifetimeConstraint).toStrictEqual({
                blockhash,
                lastValidBlockHeight: 100n,
            });
        });

        it('freezes the instructions within the transaction', () => {
            const programAddress = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;

            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 1,
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1, // fee payer
                },
                instructions: [{ programAddressIndex: 1 }],
                lifetimeToken: blockhash,
                staticAccounts: [feePayer, programAddress],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions[0]).toBeFrozenObject();
        });
    });

    describe('for a transaction with a durable nonce lifetime', () => {
        const nonce = '27kqzE1RifbyoFtibDRTjbnfZ894jsNpuR77JJkt3vgH' as Nonce;

        // added as writable non-signer in the durable nonce instruction
        const nonceAccountAddress = 'DhezFECsqmzuDxeuitFChbghTrwKLdsKdVsGArYbFEtm' as Address;

        // added as read-only signer in the durable nonce instruction
        const nonceAuthorityAddress = '2KntmCrnaf63tpNb8UMFFjFGGnYYAKQdmW9SbuCiRvhM' as Address;

        const systemProgramAddress = '11111111111111111111111111111111' as Address;
        const recentBlockhashesSysvarAddress = 'SysvarRecentB1ockHashes11111111111111111111' as Address;

        it('converts a transaction with one instruction which is advance nonce (fee payer is nonce authority)', () => {
            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 2, // recent blockhashes sysvar, system program
                    numReadonlySignerAccounts: 0, // nonce authority already added as fee payer
                    numSignerAccounts: 1, // fee payer and nonce authority are the same account
                },
                instructions: [
                    {
                        accountIndices: [
                            1, // nonce account address
                            3, // recent blockhashes sysvar
                            0, // nonce authority address
                        ],
                        data: new Uint8Array([4, 0, 0, 0]),
                        programAddressIndex: 2,
                    },
                ],
                lifetimeToken: nonce,
                staticAccounts: [
                    // writable signers
                    nonceAuthorityAddress,
                    // no read-only signers
                    // writable non-signers
                    nonceAccountAddress,
                    // read-only non-signers
                    systemProgramAddress,
                    recentBlockhashesSysvarAddress,
                ],
                version: 0,
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
            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 2, // recent blockhashes sysvar, system program
                    numReadonlySignerAccounts: 0, // nonce authority already added as fee payer
                    numSignerAccounts: 1, // fee payer and nonce authority are the same account
                },
                instructions: [
                    {
                        accountIndices: [
                            1, // nonce account address
                            3, // recent blockhashes sysvar
                            0, // nonce authority address
                        ],
                        data: new Uint8Array([4, 0, 0, 0]),
                        programAddressIndex: 2,
                    },
                ],
                lifetimeToken: nonce,
                staticAccounts: [
                    // writable signers
                    nonceAuthorityAddress,
                    // no read-only signers
                    // writable non-signers
                    nonceAccountAddress,
                    // read-only non-signers
                    systemProgramAddress,
                    recentBlockhashesSysvarAddress,
                ],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.lifetimeConstraint).toBeFrozenObject();
        });

        it('converts a transaction with one instruction which is advance nonce (fee payer is not nonce authority)', () => {
            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 2, // recent blockhashes sysvar, system program
                    numReadonlySignerAccounts: 1, // nonce authority
                    numSignerAccounts: 2, // fee payer, nonce authority
                },
                instructions: [
                    {
                        accountIndices: [
                            2, // nonce account address
                            4, // recent blockhashes sysvar
                            1, // nonce authority address
                        ],
                        data: new Uint8Array([4, 0, 0, 0]),
                        programAddressIndex: 3,
                    },
                ],
                lifetimeToken: nonce,
                staticAccounts: [
                    // writable signers
                    feePayer,
                    // read-only signers
                    nonceAuthorityAddress,
                    // writable non-signers
                    nonceAccountAddress,
                    // read-only non-signers
                    systemProgramAddress,
                    recentBlockhashesSysvarAddress,
                ],
                version: 0,
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
        });

        it('converts a durable nonce transaction with multiple instructions', () => {
            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 4, // recent blockhashes sysvar, system program, 2 other program addresses
                    numReadonlySignerAccounts: 0, // nonce authority already added as fee payer
                    numSignerAccounts: 1, // fee payer and nonce authority are the same account
                },
                instructions: [
                    {
                        accountIndices: [
                            1, // nonce account address
                            3, // recent blockhashes sysvar
                            0, // nonce authority address
                        ],
                        data: new Uint8Array([4, 0, 0, 0]),
                        programAddressIndex: 2,
                    },
                    {
                        accountIndices: [0, 1],
                        data: new Uint8Array([1, 2, 3, 4]),
                        programAddressIndex: 4,
                    },
                    { programAddressIndex: 5 },
                ],
                lifetimeToken: nonce,
                staticAccounts: [
                    // writable signers
                    nonceAuthorityAddress,
                    // no read-only signers
                    // writable non-signers
                    nonceAccountAddress,
                    // read-only non-signers
                    systemProgramAddress,
                    recentBlockhashesSysvarAddress,
                    '3hpECiFPtnyxoWqWqcVyfBUDhPKSZXWDduNXFywo8ncP' as Address,
                    'Cmqw16pVQvmW1b7Ek1ioQ5Ggf1PaoXi5XxsK9iVSbRKC' as Address,
                ],
                version: 0,
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
                {
                    accounts: [
                        {
                            address: nonceAuthorityAddress,
                            role: AccountRole.WRITABLE_SIGNER,
                        },
                        {
                            address: nonceAccountAddress,
                            role: AccountRole.WRITABLE,
                        },
                    ],
                    data: new Uint8Array([1, 2, 3, 4]),
                    programAddress: '3hpECiFPtnyxoWqWqcVyfBUDhPKSZXWDduNXFywo8ncP' as Address,
                },
                {
                    programAddress: 'Cmqw16pVQvmW1b7Ek1ioQ5Ggf1PaoXi5XxsK9iVSbRKC' as Address,
                },
            ]);
            expect(transaction.lifetimeConstraint).toStrictEqual({ nonce });
        });

        it('freezes the instructions within the transaction', () => {
            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 } = {
                header: {
                    numReadonlyNonSignerAccounts: 4, // recent blockhashes sysvar, system program, 2 other program addresses
                    numReadonlySignerAccounts: 0, // nonce authority already added as fee payer
                    numSignerAccounts: 1, // fee payer and nonce authority are the same account
                },
                instructions: [
                    {
                        accountIndices: [
                            1, // nonce account address
                            3, // recent blockhashes sysvar
                            0, // nonce authority address
                        ],
                        data: new Uint8Array([4, 0, 0, 0]),
                        programAddressIndex: 2,
                    },
                    {
                        accountIndices: [0, 1],
                        data: new Uint8Array([1, 2, 3, 4]),
                        programAddressIndex: 4,
                    },
                    { programAddressIndex: 5 },
                ],
                lifetimeToken: nonce,
                staticAccounts: [
                    // writable signers
                    nonceAuthorityAddress,
                    // no read-only signers
                    // writable non-signers
                    nonceAccountAddress,
                    // read-only non-signers
                    systemProgramAddress,
                    recentBlockhashesSysvarAddress,
                    '3hpECiFPtnyxoWqWqcVyfBUDhPKSZXWDduNXFywo8ncP' as Address,
                    'Cmqw16pVQvmW1b7Ek1ioQ5Ggf1PaoXi5XxsK9iVSbRKC' as Address,
                ],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions[0]).toBeFrozenObject();
            expect(transaction.instructions[1]).toBeFrozenObject();
            expect(transaction.instructions[2]).toBeFrozenObject();
        });
    });

    describe('for a transaction with address lookup tables', () => {
        const blockhash = 'J4yED2jcMAHyQUg61DBmm4njmEydUr2WqrV9cdEcDDgL';
        const lookupTableAddress = 'FwR5Cu5b5zXHa5KHuGQkN7UhSNebc756N1EhR2aHHLHq' as Address;

        it('converts a transaction with accounts from a lookup table', () => {
            const programAddress = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;
            const lookupAccount1 = '9fhzQgdY7y7TpYHvH4sVBjJRzgq2LbqNq7hPvWvKAzWz' as Address;
            const lookupAccount2 = 'BqN3g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7' as Address;

            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & {
                    addressTableLookups: readonly {
                        lookupTableAddress: Address;
                        readonlyIndexes: readonly number[];
                        writableIndexes: readonly number[];
                    }[];
                    version: 0;
                } = {
                addressTableLookups: [
                    {
                        lookupTableAddress,
                        readonlyIndexes: [1],
                        writableIndexes: [0],
                    },
                ],
                header: {
                    numReadonlyNonSignerAccounts: 1, // program address
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1, // fee payer
                },
                instructions: [
                    {
                        accountIndices: [2, 3], // indexes 2 and 3 reference lookup table accounts
                        programAddressIndex: 1,
                    },
                ],
                lifetimeToken: blockhash,
                staticAccounts: [feePayer, programAddress],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction, {
                addressesByLookupTableAddress: {
                    [lookupTableAddress]: [lookupAccount1, lookupAccount2],
                },
            });

            expect(transaction.instructions).toStrictEqual([
                {
                    accounts: [
                        {
                            address: lookupAccount1,
                            addressIndex: 0,
                            lookupTableAddress,
                            role: AccountRole.WRITABLE,
                        },
                        {
                            address: lookupAccount2,
                            addressIndex: 1,
                            lookupTableAddress,
                            role: AccountRole.READONLY,
                        },
                    ],
                    programAddress,
                },
            ]);
        });

        it('converts a transaction with both static and lookup table accounts', () => {
            const programAddress = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;
            const staticAccount = 'H4RdPRWYk3pKw2CkNznxQK6J6herjgQke2pzFJW4GC6x' as Address;
            const lookupAccount = '9fhzQgdY7y7TpYHvH4sVBjJRzgq2LbqNq7hPvWvKAzWz' as Address;

            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & {
                    addressTableLookups: readonly {
                        lookupTableAddress: Address;
                        readonlyIndexes: readonly number[];
                        writableIndexes: readonly number[];
                    }[];
                    version: 0;
                } = {
                addressTableLookups: [
                    {
                        lookupTableAddress,
                        readonlyIndexes: [0],
                        writableIndexes: [],
                    },
                ],
                header: {
                    numReadonlyNonSignerAccounts: 1, // program address
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 2, // fee payer + static account
                },
                instructions: [
                    {
                        accountIndices: [1, 3], // index 1 is static, index 3 is from lookup table
                        programAddressIndex: 2,
                    },
                ],
                lifetimeToken: blockhash,
                staticAccounts: [feePayer, staticAccount, programAddress],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction, {
                addressesByLookupTableAddress: {
                    [lookupTableAddress]: [lookupAccount],
                },
            });

            expect(transaction.instructions).toStrictEqual([
                {
                    accounts: [
                        {
                            address: staticAccount,
                            role: AccountRole.WRITABLE_SIGNER,
                        },
                        {
                            address: lookupAccount,
                            addressIndex: 0,
                            lookupTableAddress,
                            role: AccountRole.READONLY,
                        },
                    ],
                    programAddress,
                },
            ]);
        });

        it('converts a transaction with multiple lookup tables', () => {
            const programAddress = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;
            const lookupTableAddress2 = '8qN8g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7' as Address;
            const lookupAccount1 = '9fhzQgdY7y7TpYHvH4sVBjJRzgq2LbqNq7hPvWvKAzWz' as Address;
            const lookupAccount2 = 'BqN3g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7' as Address;

            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & {
                    addressTableLookups: readonly {
                        lookupTableAddress: Address;
                        readonlyIndexes: readonly number[];
                        writableIndexes: readonly number[];
                    }[];
                    version: 0;
                } = {
                addressTableLookups: [
                    {
                        lookupTableAddress,
                        readonlyIndexes: [0],
                        writableIndexes: [],
                    },
                    {
                        lookupTableAddress: lookupTableAddress2,
                        readonlyIndexes: [],
                        writableIndexes: [0],
                    },
                ],
                header: {
                    numReadonlyNonSignerAccounts: 1, // program address
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1, // fee payer
                },
                instructions: [
                    {
                        accountIndices: [2, 3], // indexes from two different lookup tables
                        programAddressIndex: 1,
                    },
                ],
                lifetimeToken: blockhash,
                staticAccounts: [feePayer, programAddress],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction, {
                addressesByLookupTableAddress: {
                    [lookupTableAddress]: [lookupAccount1],
                    [lookupTableAddress2]: [lookupAccount2],
                },
            });

            expect(transaction.instructions).toStrictEqual([
                {
                    accounts: [
                        {
                            address: lookupAccount2,
                            addressIndex: 0,
                            lookupTableAddress: lookupTableAddress2,
                            role: AccountRole.WRITABLE,
                        },
                        {
                            address: lookupAccount1,
                            addressIndex: 0,
                            lookupTableAddress,
                            role: AccountRole.READONLY,
                        },
                    ],
                    programAddress,
                },
            ]);
        });

        it('converts a transaction with empty address table lookups array', () => {
            const programAddress = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;

            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & {
                    addressTableLookups: readonly {
                        lookupTableAddress: Address;
                        readonlyIndexes: readonly number[];
                        writableIndexes: readonly number[];
                    }[];
                    version: 0;
                } = {
                addressTableLookups: [],
                header: {
                    numReadonlyNonSignerAccounts: 1, // program address
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1, // fee payer
                },
                instructions: [{ programAddressIndex: 1 }],
                lifetimeToken: blockhash,
                staticAccounts: [feePayer, programAddress],
                version: 0,
            };

            const transaction = decompileTransactionMessage(compiledTransaction);
            expect(transaction.instructions).toStrictEqual([
                {
                    programAddress,
                },
            ]);
        });

        it('throws when address lookup table content is missing', () => {
            const programAddress = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;

            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & {
                    addressTableLookups: readonly {
                        lookupTableAddress: Address;
                        readonlyIndexes: readonly number[];
                        writableIndexes: readonly number[];
                    }[];
                    version: 0;
                } = {
                addressTableLookups: [
                    {
                        lookupTableAddress,
                        readonlyIndexes: [0],
                        writableIndexes: [],
                    },
                ],
                header: {
                    numReadonlyNonSignerAccounts: 1, // program address
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1, // fee payer
                },
                instructions: [{ programAddressIndex: 1 }],
                lifetimeToken: blockhash,
                staticAccounts: [feePayer, programAddress],
                version: 0,
            };

            expect(() => {
                decompileTransactionMessage(compiledTransaction);
            }).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING, {
                    lookupTableAddresses: [lookupTableAddress],
                }),
            );
        });

        it('throws when address lookup table index is out of range', () => {
            const programAddress = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;
            const lookupAccount = '9fhzQgdY7y7TpYHvH4sVBjJRzgq2LbqNq7hPvWvKAzWz' as Address;

            const compiledTransaction: CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & {
                    addressTableLookups: readonly {
                        lookupTableAddress: Address;
                        readonlyIndexes: readonly number[];
                        writableIndexes: readonly number[];
                    }[];
                    version: 0;
                } = {
                addressTableLookups: [
                    {
                        lookupTableAddress,
                        readonlyIndexes: [5], // index 5 is out of range (only 1 account in lookup table)
                        writableIndexes: [],
                    },
                ],
                header: {
                    numReadonlyNonSignerAccounts: 1, // program address
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1, // fee payer
                },
                instructions: [{ programAddressIndex: 1 }],
                lifetimeToken: blockhash,
                staticAccounts: [feePayer, programAddress],
                version: 0,
            };

            expect(() => {
                decompileTransactionMessage(compiledTransaction, {
                    addressesByLookupTableAddress: {
                        [lookupTableAddress]: [lookupAccount],
                    },
                });
            }).toThrow(
                new SolanaError(
                    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
                    {
                        highestKnownIndex: 0,
                        highestRequestedIndex: 5,
                        lookupTableAddress,
                    },
                ),
            );
        });
    });
});
