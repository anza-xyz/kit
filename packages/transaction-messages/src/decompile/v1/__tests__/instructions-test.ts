import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
    SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH,
    SolanaError,
} from '@solana/errors';
import { AccountRole } from '@solana/instructions';

import { InstructionHeader, InstructionPayload } from '../../../compile/v1/instructions';
import { decompileInstructions } from '../instructions';

describe('decompileInstructions', () => {
    const account1 = '7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK' as Address;
    const account2 = 'H4RdPRWYk3pKw2CkNznxQK6J6herjgQke2pzFJW4GC6x' as Address;
    const account3 = 'BPFLoaderUpgradeab1e11111111111111111111111' as Address;
    const program1 = 'HZMKVnRrWLyQLwPLTTLKtY7ET4Cf7pQugrTr9eTBrpsf' as Address;
    const program2 = '11111111111111111111111111111111' as Address;
    const program3 = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address;
    const program4 = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address;

    describe('single instruction', () => {
        it('decompiles instruction with program address only', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 0,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 0,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [{ address: program1, role: AccountRole.READONLY }];

            const instructions = decompileInstructions(instructionHeaders, instructionPayloads, accountMetas);
            expect(instructions).toStrictEqual([
                {
                    programAddress: program1,
                },
            ]);
        });

        it('decompiles instruction with program address and accounts', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 2,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 2,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [0, 1],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [
                { address: account1, role: AccountRole.WRITABLE_SIGNER },
                { address: account2, role: AccountRole.READONLY },
                { address: program1, role: AccountRole.READONLY },
            ];

            const instructions = decompileInstructions(instructionHeaders, instructionPayloads, accountMetas);
            expect(instructions).toStrictEqual([
                {
                    accounts: [
                        { address: account1, role: AccountRole.WRITABLE_SIGNER },
                        { address: account2, role: AccountRole.READONLY },
                    ],
                    programAddress: program1,
                },
            ]);
        });

        it('decompiles instruction with program address and data', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 0,
                    numInstructionDataBytes: 5,
                    programAccountIndex: 0,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [],
                    instructionData: new Uint8Array([1, 2, 3, 4, 5]),
                },
            ];
            const accountMetas = [{ address: program1, role: AccountRole.READONLY }];

            const instructions = decompileInstructions(instructionHeaders, instructionPayloads, accountMetas);
            expect(instructions).toStrictEqual([
                {
                    data: new Uint8Array([1, 2, 3, 4, 5]),
                    programAddress: program1,
                },
            ]);
        });

        it('decompiles instruction with all fields', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 3,
                    numInstructionDataBytes: 4,
                    programAccountIndex: 3,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [0, 1, 2],
                    instructionData: new Uint8Array([0, 1, 2, 3]),
                },
            ];
            const accountMetas = [
                { address: account1, role: AccountRole.WRITABLE_SIGNER },
                { address: account2, role: AccountRole.READONLY_SIGNER },
                { address: account3, role: AccountRole.WRITABLE },
                { address: program1, role: AccountRole.READONLY },
            ];

            const instructions = decompileInstructions(instructionHeaders, instructionPayloads, accountMetas);
            expect(instructions).toStrictEqual([
                {
                    accounts: [
                        { address: account1, role: AccountRole.WRITABLE_SIGNER },
                        { address: account2, role: AccountRole.READONLY_SIGNER },
                        { address: account3, role: AccountRole.WRITABLE },
                    ],
                    data: new Uint8Array([0, 1, 2, 3]),
                    programAddress: program1,
                },
            ]);
        });

        it('does not include accounts field when instructionAccountIndices is empty', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 0,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 0,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [{ address: program1, role: AccountRole.READONLY }];

            const instructions = decompileInstructions(instructionHeaders, instructionPayloads, accountMetas);
            expect(instructions[0]).not.toHaveProperty('accounts');
        });

        it('does not include data field when instructionData is empty', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 0,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 0,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [{ address: program1, role: AccountRole.READONLY }];

            const instructions = decompileInstructions(instructionHeaders, instructionPayloads, accountMetas);
            expect(instructions[0]).not.toHaveProperty('data');
        });
    });

    describe('multiple instructions', () => {
        it('decompiles multiple instructions with different patterns', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 1,
                    numInstructionDataBytes: 1,
                    programAccountIndex: 2,
                },
                {
                    numInstructionAccounts: 1,
                    numInstructionDataBytes: 1,
                    programAccountIndex: 3,
                },
                {
                    numInstructionAccounts: 0,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 4,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [0],
                    instructionData: new Uint8Array([1]),
                },
                {
                    instructionAccountIndices: [1],
                    instructionData: new Uint8Array([2]),
                },
                {
                    instructionAccountIndices: [],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [
                { address: account1, role: AccountRole.WRITABLE_SIGNER },
                { address: account2, role: AccountRole.READONLY_SIGNER },
                { address: program2, role: AccountRole.READONLY },
                { address: program3, role: AccountRole.READONLY },
                { address: program4, role: AccountRole.READONLY },
            ];

            const instructions = decompileInstructions(instructionHeaders, instructionPayloads, accountMetas);
            expect(instructions).toStrictEqual([
                {
                    accounts: [{ address: account1, role: AccountRole.WRITABLE_SIGNER }],
                    data: new Uint8Array([1]),
                    programAddress: program2,
                },
                {
                    accounts: [{ address: account2, role: AccountRole.READONLY_SIGNER }],
                    data: new Uint8Array([2]),
                    programAddress: program3,
                },
                {
                    programAddress: program4,
                },
            ]);
        });

        it('reuses account metas across instructions', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 1,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 1,
                },
                {
                    numInstructionAccounts: 1,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 1,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [0],
                    instructionData: new Uint8Array(),
                },
                {
                    instructionAccountIndices: [0],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [
                { address: account1, role: AccountRole.WRITABLE_SIGNER },
                { address: program1, role: AccountRole.READONLY },
            ];

            const instructions = decompileInstructions(instructionHeaders, instructionPayloads, accountMetas);

            expect(instructions[0].programAddress).toBe(instructions[1].programAddress);
            expect(instructions[0].accounts?.[0]).toStrictEqual(instructions[1].accounts?.[0]);
        });
    });

    describe('empty arrays', () => {
        it('returns empty array when no instructions provided', () => {
            const instructionHeaders: InstructionHeader[] = [];
            const instructionPayloads: InstructionPayload[] = [];
            const accountMetas = [{ address: account1, role: AccountRole.WRITABLE_SIGNER }];

            const instructions = decompileInstructions(instructionHeaders, instructionPayloads, accountMetas);
            expect(instructions).toStrictEqual([]);
        });
    });

    describe('immutability', () => {
        it('freezes the returned instruction objects', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 1,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 1,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [0],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [
                { address: account1, role: AccountRole.WRITABLE },
                { address: program1, role: AccountRole.READONLY },
            ];

            const instructions = decompileInstructions(instructionHeaders, instructionPayloads, accountMetas);
            expect(instructions[0]).toBeFrozenObject();
        });

        it('freezes the accounts array within instructions', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 1,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 1,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [0],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [
                { address: account1, role: AccountRole.WRITABLE },
                { address: program1, role: AccountRole.READONLY },
            ];

            const instructions = decompileInstructions(instructionHeaders, instructionPayloads, accountMetas);
            expect(instructions[0].accounts).toBeFrozenObject();
        });
    });

    describe('error cases', () => {
        it('throws when headers and payloads length mismatch with more headers', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 0,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 0,
                },
                {
                    numInstructionAccounts: 0,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 0,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [{ address: program1, role: AccountRole.READONLY }];

            expect(() => decompileInstructions(instructionHeaders, instructionPayloads, accountMetas)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH, {
                    numInstructionHeaders: 2,
                    numInstructionPayloads: 1,
                }),
            );
        });

        it('throws when headers and payloads length mismatch with more payloads', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 0,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 0,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [],
                    instructionData: new Uint8Array(),
                },
                {
                    instructionAccountIndices: [],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [{ address: program1, role: AccountRole.READONLY }];

            expect(() => decompileInstructions(instructionHeaders, instructionPayloads, accountMetas)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH, {
                    numInstructionHeaders: 1,
                    numInstructionPayloads: 2,
                }),
            );
        });

        it('throws when program address index is out of bounds', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 0,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 5,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [{ address: account1, role: AccountRole.WRITABLE_SIGNER }];

            expect(() => decompileInstructions(instructionHeaders, instructionPayloads, accountMetas)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
                    index: 5,
                }),
            );
        });

        it('throws when program address index is negative', () => {
            const instructionHeaders: InstructionHeader[] = [
                {
                    numInstructionAccounts: 0,
                    numInstructionDataBytes: 0,
                    programAccountIndex: -1,
                },
            ];
            const instructionPayloads: InstructionPayload[] = [
                {
                    instructionAccountIndices: [],
                    instructionData: new Uint8Array(),
                },
            ];
            const accountMetas = [{ address: account1, role: AccountRole.WRITABLE_SIGNER }];

            expect(() => decompileInstructions(instructionHeaders, instructionPayloads, accountMetas)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
                    index: -1,
                }),
            );
        });
    });
});
