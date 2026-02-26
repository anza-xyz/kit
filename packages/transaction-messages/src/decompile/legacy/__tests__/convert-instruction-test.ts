import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
    SolanaError,
} from '@solana/errors';
import { AccountRole } from '@solana/instructions';

import { CompiledTransactionMessage } from '../../..';
import { convertInstructions } from '../convert-instruction';

describe('convertInstructions', () => {
    it('should convert a single instruction with program address, accounts, and data', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [
            {
                accountIndices: [0, 1],
                data: new Uint8Array([1, 2, 3]),
                programAddressIndex: 2,
            },
        ];

        const accountMetas = [
            { address: 'account0' as Address, role: AccountRole.WRITABLE_SIGNER },
            { address: 'account1' as Address, role: AccountRole.READONLY },
            { address: 'program' as Address, role: AccountRole.READONLY },
        ];

        const instructions = convertInstructions(compiledInstructions, accountMetas);

        expect(instructions).toStrictEqual([
            {
                accounts: [
                    { address: 'account0', role: AccountRole.WRITABLE_SIGNER },
                    { address: 'account1', role: AccountRole.READONLY },
                ],
                data: new Uint8Array([1, 2, 3]),
                programAddress: 'program',
            },
        ]);
    });

    it('should convert an instruction with only program address (no accounts or data)', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [
            {
                programAddressIndex: 0,
            },
        ];

        const accountMetas = [{ address: 'program' as Address, role: AccountRole.READONLY }];

        const instructions = convertInstructions(compiledInstructions, accountMetas);

        expect(instructions).toStrictEqual([
            {
                programAddress: 'program',
            },
        ]);
    });

    it('should convert an instruction with program address and accounts but no data', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [
            {
                accountIndices: [0],
                programAddressIndex: 1,
            },
        ];

        const accountMetas = [
            { address: 'account0' as Address, role: AccountRole.WRITABLE },
            { address: 'program' as Address, role: AccountRole.READONLY },
        ];

        const instructions = convertInstructions(compiledInstructions, accountMetas);

        expect(instructions).toStrictEqual([
            {
                accounts: [{ address: 'account0', role: AccountRole.WRITABLE }],
                programAddress: 'program',
            },
        ]);
    });

    it('should convert an instruction with program address and data but no accounts', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [
            {
                data: new Uint8Array([4, 5, 6]),
                programAddressIndex: 0,
            },
        ];

        const accountMetas = [{ address: 'program' as Address, role: AccountRole.READONLY }];

        const instructions = convertInstructions(compiledInstructions, accountMetas);

        expect(instructions).toStrictEqual([
            {
                data: new Uint8Array([4, 5, 6]),
                programAddress: 'program',
            },
        ]);
    });

    it('should not include accounts field when accountIndices is empty array', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [
            {
                accountIndices: [],
                programAddressIndex: 0,
            },
        ];

        const accountMetas = [{ address: 'program' as Address, role: AccountRole.READONLY }];

        const instructions = convertInstructions(compiledInstructions, accountMetas);

        expect(instructions).toStrictEqual([
            {
                programAddress: 'program',
            },
        ]);
        expect(instructions[0]).not.toHaveProperty('accounts');
    });

    it('should not include data field when data is empty array', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [
            {
                data: new Uint8Array(),
                programAddressIndex: 0,
            },
        ];

        const accountMetas = [{ address: 'program' as Address, role: AccountRole.READONLY }];

        const instructions = convertInstructions(compiledInstructions, accountMetas);

        expect(instructions).toStrictEqual([
            {
                programAddress: 'program',
            },
        ]);
        expect(instructions[0]).not.toHaveProperty('data');
    });

    it('should convert multiple instructions', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [
            {
                accountIndices: [0],
                data: new Uint8Array([1]),
                programAddressIndex: 2,
            },
            {
                accountIndices: [1],
                data: new Uint8Array([2]),
                programAddressIndex: 3,
            },
            {
                programAddressIndex: 4,
            },
        ];

        const accountMetas = [
            { address: 'account0' as Address, role: AccountRole.WRITABLE_SIGNER },
            { address: 'account1' as Address, role: AccountRole.READONLY_SIGNER },
            { address: 'program1' as Address, role: AccountRole.READONLY },
            { address: 'program2' as Address, role: AccountRole.READONLY },
            { address: 'program3' as Address, role: AccountRole.READONLY },
        ];

        const instructions = convertInstructions(compiledInstructions, accountMetas);

        expect(instructions).toStrictEqual([
            {
                accounts: [{ address: 'account0', role: AccountRole.WRITABLE_SIGNER }],
                data: new Uint8Array([1]),
                programAddress: 'program1',
            },
            {
                accounts: [{ address: 'account1', role: AccountRole.READONLY_SIGNER }],
                data: new Uint8Array([2]),
                programAddress: 'program2',
            },
            {
                programAddress: 'program3',
            },
        ]);
    });

    it('should handle instructions with multiple account indices', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [
            {
                accountIndices: [0, 1, 2, 3],
                programAddressIndex: 4,
            },
        ];

        const accountMetas = [
            { address: 'account0' as Address, role: AccountRole.WRITABLE_SIGNER },
            { address: 'account1' as Address, role: AccountRole.READONLY_SIGNER },
            { address: 'account2' as Address, role: AccountRole.WRITABLE },
            { address: 'account3' as Address, role: AccountRole.READONLY },
            { address: 'program' as Address, role: AccountRole.READONLY },
        ];

        const instructions = convertInstructions(compiledInstructions, accountMetas);

        expect(instructions).toStrictEqual([
            {
                accounts: [
                    { address: 'account0', role: AccountRole.WRITABLE_SIGNER },
                    { address: 'account1', role: AccountRole.READONLY_SIGNER },
                    { address: 'account2', role: AccountRole.WRITABLE },
                    { address: 'account3', role: AccountRole.READONLY },
                ],
                programAddress: 'program',
            },
        ]);
    });

    it('should throw when program address index is out of bounds', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [
            {
                programAddressIndex: 5,
            },
        ];

        const accountMetas = [{ address: 'account0' as Address, role: AccountRole.WRITABLE_SIGNER }];

        expect(() => convertInstructions(compiledInstructions, accountMetas)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
                index: 5,
            }),
        );
    });

    it('should throw when program address index is negative', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [
            {
                programAddressIndex: -1,
            },
        ];

        const accountMetas = [{ address: 'account0' as Address, role: AccountRole.WRITABLE_SIGNER }];

        expect(() => convertInstructions(compiledInstructions, accountMetas)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
                index: -1,
            }),
        );
    });

    it('should return empty array when no instructions provided', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [];
        const accountMetas = [{ address: 'account0' as Address, role: AccountRole.WRITABLE_SIGNER }];

        const instructions = convertInstructions(compiledInstructions, accountMetas);

        expect(instructions).toStrictEqual([]);
    });

    it('should freeze the returned instruction objects', () => {
        const compiledInstructions: CompiledTransactionMessage['instructions'] = [
            {
                accountIndices: [0],
                programAddressIndex: 1,
            },
        ];

        const accountMetas = [
            { address: 'account0' as Address, role: AccountRole.WRITABLE },
            { address: 'program' as Address, role: AccountRole.READONLY },
        ];

        const instructions = convertInstructions(compiledInstructions, accountMetas);

        expect(instructions[0]).toBeFrozenObject();
        expect(instructions[0].accounts).toBeFrozenObject();
    });
});
