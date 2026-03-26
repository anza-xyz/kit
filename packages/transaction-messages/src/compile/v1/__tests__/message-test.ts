import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES,
    SolanaError,
} from '@solana/errors';
import { AccountRole } from '@solana/instructions';

import { TransactionMessageWithBlockhashLifetime } from '../../../blockhash';
import { TransactionMessageWithFeePayer } from '../../../fee-payer';
import { TransactionMessage } from '../../../transaction-message';
import { V1TransactionConfig } from '../../../v1-transaction-config';
import {
    getAddressMapFromInstructions,
    getOrderedAccountsFromAddressMap,
    OrderedAccounts,
} from '../../legacy/accounts';
import { getCompiledMessageHeader } from '../../legacy/header';
import { getAccountIndex } from '../../legacy/instructions';
import { getCompiledLifetimeToken } from '../../legacy/lifetime-token';
import { getTransactionConfigMask, getTransactionConfigValues } from '../config';
import { getInstructionHeader, getInstructionPayload } from '../instructions';
import { compileTransactionMessage } from '../message';

jest.mock('../../legacy/accounts');
jest.mock('../../legacy/header');
jest.mock('../../legacy/instructions');
jest.mock('../../legacy/lifetime-token');
jest.mock('../config');
jest.mock('../instructions');

type V1TransactionMessage = TransactionMessage & TransactionMessageWithFeePayer & { version: 1 };
type V1Instruction = V1TransactionMessage['instructions'][number];

function makeMockTransactionMessage(overrides?: Partial<V1TransactionMessage>): V1TransactionMessage {
    return {
        feePayer: { address: 'abc' as Address },
        instructions: [] as V1Instruction[],
        version: 1,
        ...overrides,
    };
}

describe('compileTransactionMessage', () => {
    beforeEach(() => {
        jest.mocked(getAddressMapFromInstructions).mockReturnValue({});
        jest.mocked(getOrderedAccountsFromAddressMap).mockReturnValue([] as unknown as OrderedAccounts);
        jest.mocked(getAccountIndex).mockReturnValue({});
    });

    it('returns with version 1', () => {
        const tx = makeMockTransactionMessage();
        const message = compileTransactionMessage(tx);
        expect(message).toHaveProperty('version', 1);
    });

    it('sets `header` to the return value of `getCompiledMessageHeader`', () => {
        const expectedCompiledMessageHeader = {
            numReadonlyNonSignerAccounts: 0,
            numReadonlySignerAccounts: 0,
            numSignerAccounts: 1,
        } as const;
        jest.mocked(getCompiledMessageHeader).mockReturnValue(expectedCompiledMessageHeader);

        const tx = makeMockTransactionMessage();
        const message = compileTransactionMessage(tx);
        expect(getCompiledMessageHeader).toHaveBeenCalled();
        expect(message.header).toBe(expectedCompiledMessageHeader);
    });

    describe('config', () => {
        const expectedConfigMask = 0b00011111;
        const expectedConfigValues = [
            { kind: 'u64' as const, value: 10n },
            { kind: 'u32' as const, value: 20 },
        ];

        beforeEach(() => {
            jest.mocked(getTransactionConfigMask).mockReturnValue(expectedConfigMask);
            jest.mocked(getTransactionConfigValues).mockReturnValue(expectedConfigValues);
        });

        it('sets `configMask` to the return value of `getTransactionConfigMask`', () => {
            const config: V1TransactionConfig = {
                computeUnitLimit: 10,
            };
            const tx = makeMockTransactionMessage({ config });
            const message = compileTransactionMessage(tx);
            expect(getTransactionConfigMask).toHaveBeenCalledWith(tx.config);
            expect(message.configMask).toBe(expectedConfigMask);
        });

        it('sets `configValues` to the return value of `getTransactionConfigValues`', () => {
            const config: V1TransactionConfig = {
                computeUnitLimit: 10,
            };
            const tx = makeMockTransactionMessage({ config });
            const message = compileTransactionMessage(tx);
            expect(getTransactionConfigValues).toHaveBeenCalledWith(tx.config);
            expect(message.configValues).toBe(expectedConfigValues);
        });

        it('passes an empty object to config functions when config is missing', () => {
            const txWithoutConfig = makeMockTransactionMessage();
            compileTransactionMessage(txWithoutConfig);
            expect(getTransactionConfigMask).toHaveBeenCalledWith({});
            expect(getTransactionConfigValues).toHaveBeenCalledWith({});
        });
    });

    describe('lifetime constraints', () => {
        beforeEach(() => {
            jest.mocked(getCompiledLifetimeToken).mockReturnValue('abc');
        });
        it('sets `lifetimeToken` to the return value of `getCompiledLifetimeToken`', () => {
            const blockhash = 'myblockhash' as unknown as TransactionMessageWithBlockhashLifetime['lifetimeConstraint'];
            const tx = {
                ...makeMockTransactionMessage(),
                lifetimeConstraint: blockhash,
            };
            const message = compileTransactionMessage(tx);
            expect(getCompiledLifetimeToken).toHaveBeenCalledWith(blockhash);
            expect(message.lifetimeToken).toBe('abc');
        });
        it('does not set `lifetimeToken` when lifetime constraint is missing', () => {
            const txWithoutLifetime = makeMockTransactionMessage();
            const message = compileTransactionMessage(txWithoutLifetime);
            expect(message).not.toHaveProperty('lifetimeToken');
        });
    });

    describe('instructions', () => {
        const expectedInstructionHeader = {
            numInstructionAccounts: 2,
            numInstructionDataBytes: 3,
            programAccountIndex: 1,
        };

        const expectedInstructionPayload = {
            instructionAccountIndices: [2, 3],
            instructionData: new Uint8Array([1, 2, 3]),
        };

        beforeEach(() => {
            jest.mocked(getInstructionHeader).mockReturnValue(expectedInstructionHeader);
            jest.mocked(getInstructionPayload).mockReturnValue(expectedInstructionPayload);
        });

        it('sets `numInstructions` to the number of instructions', () => {
            const tx = makeMockTransactionMessage({
                instructions: [{} as V1Instruction, {} as V1Instruction],
            });
            const message = compileTransactionMessage(tx);
            expect(message.numInstructions).toBe(2);
        });

        it('sets `instructionHeaders` to the return values of `getInstructionHeader`', () => {
            const mockInstruction1 = {} as V1Instruction;
            const mockInstruction2 = {} as V1Instruction;
            const tx = makeMockTransactionMessage({
                instructions: [mockInstruction1, mockInstruction2],
            });
            const message = compileTransactionMessage(tx);
            expect(getInstructionHeader).toHaveBeenCalledTimes(2);
            expect(getInstructionHeader).toHaveBeenNthCalledWith(
                1,
                mockInstruction1,
                expect.anything() /* accountIndex */,
            );
            expect(getInstructionHeader).toHaveBeenNthCalledWith(
                2,
                mockInstruction2,
                expect.anything() /* accountIndex */,
            );
            expect(message.instructionHeaders).toEqual([expectedInstructionHeader, expectedInstructionHeader]);
        });

        it('sets `instructionPayloads` to the return values of `getInstructionPayload`', () => {
            const mockInstruction1 = {} as V1Instruction;
            const mockInstruction2 = {} as V1Instruction;
            const tx = makeMockTransactionMessage({
                instructions: [mockInstruction1, mockInstruction2],
            });
            const message = compileTransactionMessage(tx);
            expect(getInstructionPayload).toHaveBeenCalledTimes(2);
            expect(getInstructionPayload).toHaveBeenNthCalledWith(
                1,
                mockInstruction1,
                expect.anything() /* accountIndex */,
            );
            expect(getInstructionPayload).toHaveBeenNthCalledWith(
                2,
                mockInstruction2,
                expect.anything() /* accountIndex */,
            );
            expect(message.instructionPayloads).toEqual([expectedInstructionPayload, expectedInstructionPayload]);
        });
    });

    describe('static accounts', () => {
        const expectedOrderedAccounts: ReturnType<typeof getOrderedAccountsFromAddressMap> = [
            {
                address: 'abc' as Address<'abc'>,
                role: AccountRole.WRITABLE_SIGNER,
            },
            {
                address: 'def' as Address<'def'>,
                role: AccountRole.READONLY,
            },
        ] as ReturnType<typeof getOrderedAccountsFromAddressMap>;

        beforeEach(() => {
            jest.mocked(getOrderedAccountsFromAddressMap).mockReturnValue(expectedOrderedAccounts);
        });

        it('sets `staticAccounts` to the addresses from the ordered accounts', () => {
            const tx = makeMockTransactionMessage();
            const message = compileTransactionMessage(tx);
            expect(getOrderedAccountsFromAddressMap).toHaveBeenCalled();
            expect(message.staticAccounts).toStrictEqual(['abc' as Address<'abc'>, 'def' as Address<'def'>]);
        });
        it('sets `numStaticAccounts` to the number of ordered accounts', () => {
            const tx = makeMockTransactionMessage();
            const message = compileTransactionMessage(tx);
            expect(message.numStaticAccounts).toBe(2);
        });
    });
    describe('constraints', () => {
        describe('too many account addresses', () => {
            it('throws when there are more than 64 unique accounts', () => {
                const accounts = Array.from({ length: 65 }, (_, i) => ({
                    address: `account${i}` as Address,
                    role: AccountRole.READONLY,
                })) as unknown as OrderedAccounts;
                jest.mocked(getOrderedAccountsFromAddressMap).mockReturnValue(accounts);
                const tx = makeMockTransactionMessage();
                expect(() => compileTransactionMessage(tx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES, {
                        actualCount: 65,
                        maxAllowed: 64,
                    }),
                );
            });
            it('does not throw with exactly 64 unique accounts', () => {
                const accounts = Array.from({ length: 64 }, (_, i) => ({
                    address: `account${i}` as Address,
                    role: AccountRole.READONLY,
                })) as unknown as OrderedAccounts;
                jest.mocked(getOrderedAccountsFromAddressMap).mockReturnValue(accounts);
                const tx = makeMockTransactionMessage();
                expect(() => compileTransactionMessage(tx)).not.toThrow();
            });
        });
        describe('too many signer addresses', () => {
            it('throws when there are more than 12 unique signers', () => {
                const accounts = Array.from({ length: 13 }, (_, i) => ({
                    address: `signer${i}` as Address,
                    role: AccountRole.WRITABLE_SIGNER,
                })) as unknown as OrderedAccounts;
                jest.mocked(getOrderedAccountsFromAddressMap).mockReturnValue(accounts);
                const tx = makeMockTransactionMessage();
                expect(() => compileTransactionMessage(tx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES, {
                        actualCount: 13,
                        maxAllowed: 12,
                    }),
                );
            });
            it('does not throw with exactly 12 signers', () => {
                const accounts = Array.from({ length: 12 }, (_, i) => ({
                    address: `signer${i}` as Address,
                    role: AccountRole.WRITABLE_SIGNER,
                })) as unknown as OrderedAccounts;
                jest.mocked(getOrderedAccountsFromAddressMap).mockReturnValue(accounts);
                const tx = makeMockTransactionMessage();
                expect(() => compileTransactionMessage(tx)).not.toThrow();
            });
        });
        describe('too many instructions', () => {
            it('throws when there are more than 64 instructions', () => {
                const tx = makeMockTransactionMessage({
                    instructions: Array.from({ length: 65 }, () => ({ programAddress: 'prog' as Address })),
                });
                expect(() => compileTransactionMessage(tx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS, {
                        actualCount: 65,
                        maxAllowed: 64,
                    }),
                );
            });
            it('does not throw with exactly 64 instructions', () => {
                const tx = makeMockTransactionMessage({
                    instructions: Array.from({ length: 64 }, () => ({ programAddress: 'prog' as Address })),
                });
                expect(() => compileTransactionMessage(tx)).not.toThrow();
            });
        });
        describe('too many accounts in an instruction', () => {
            it('throws when an instruction has more than 255 account references', () => {
                const tx = makeMockTransactionMessage({
                    instructions: [
                        {
                            accounts: Array.from({ length: 256 }, () => ({
                                address: 'acct' as Address,
                                role: AccountRole.READONLY,
                            })),
                            programAddress: 'prog' as Address,
                        },
                    ],
                });
                expect(() => compileTransactionMessage(tx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION, {
                        actualCount: 256,
                        instructionIndex: 0,
                        maxAllowed: 255,
                    }),
                );
            });
            it('does not throw with exactly 255 accounts in an instruction', () => {
                const tx = makeMockTransactionMessage({
                    instructions: [
                        {
                            accounts: Array.from({ length: 255 }, () => ({
                                address: 'acct' as Address,
                                role: AccountRole.READONLY,
                            })),
                            programAddress: 'prog' as Address,
                        },
                    ],
                });
                expect(() => compileTransactionMessage(tx)).not.toThrow();
            });
            it('reports the correct instruction index when a later instruction violates the constraint', () => {
                const tx = makeMockTransactionMessage({
                    instructions: [
                        { programAddress: 'prog' as Address },
                        {
                            accounts: Array.from({ length: 256 }, () => ({
                                address: 'acct' as Address,
                                role: AccountRole.READONLY,
                            })),
                            programAddress: 'prog' as Address,
                        },
                    ],
                });
                expect(() => compileTransactionMessage(tx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION, {
                        actualCount: 256,
                        instructionIndex: 1,
                        maxAllowed: 255,
                    }),
                );
            });
        });
    });
});
