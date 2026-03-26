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
import { TransactionMessageWithLifetime } from '../../../lifetime';
import { TransactionMessage } from '../../../transaction-message';
import { getOrderedAccountsFromAddressMap, OrderedAccounts } from '../accounts';
import { getCompiledMessageHeader } from '../header';
import { getCompiledInstructions } from '../instructions';
import { getCompiledLifetimeToken } from '../lifetime-token';
import { compileTransactionMessage } from '../message';

jest.mock('../accounts');
jest.mock('../header');
jest.mock('../instructions');
jest.mock('../lifetime-token');

const MOCK_LIFETIME_CONSTRAINT =
    'SOME_CONSTRAINT' as unknown as TransactionMessageWithBlockhashLifetime['lifetimeConstraint'];

describe('compileTransactionMessage', () => {
    let baseTx: TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithLifetime & { version: 'legacy' };
    beforeEach(() => {
        baseTx = {
            feePayer: { address: 'abc' as Address<'abc'> },
            instructions: [],
            lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
            version: 'legacy',
        };
        jest.mocked(getOrderedAccountsFromAddressMap).mockReturnValue([] as unknown as OrderedAccounts);
    });
    describe('message header', () => {
        const expectedCompiledMessageHeader = {
            numReadonlyNonSignerAccounts: 0,
            numReadonlySignerAccounts: 0,
            numSignerAccounts: 1,
        } as const;
        beforeEach(() => {
            jest.mocked(getCompiledMessageHeader).mockReturnValue(expectedCompiledMessageHeader);
        });
        it('sets `header` to the return value of `getCompiledMessageHeader`', () => {
            const message = compileTransactionMessage(baseTx);
            expect(getCompiledMessageHeader).toHaveBeenCalled();
            expect(message.header).toBe(expectedCompiledMessageHeader);
        });
    });
    describe('instructions', () => {
        const expectedInstructions = [] as ReturnType<typeof getCompiledInstructions>;
        beforeEach(() => {
            jest.mocked(getCompiledInstructions).mockReturnValue(expectedInstructions);
        });
        it('sets `instructions` to the return value of `getCompiledInstructions`', () => {
            const message = compileTransactionMessage(baseTx);
            console.log({ message });
            expect(getCompiledInstructions).toHaveBeenCalledWith(
                baseTx.instructions,
                expect.any(Array) /* orderedAccounts */,
            );
            expect(message.instructions).toBe(expectedInstructions);
        });
    });
    describe('lifetime constraints', () => {
        beforeEach(() => {
            jest.mocked(getCompiledLifetimeToken).mockReturnValue('abc');
        });
        it('sets `lifetimeToken` to the return value of `getCompiledLifetimeToken`', () => {
            const message = compileTransactionMessage(baseTx);
            expect(getCompiledLifetimeToken).toHaveBeenCalledWith('SOME_CONSTRAINT');
            expect(message.lifetimeToken).toBe('abc');
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
        it('sets `staticAccounts` to the return value of `getCompiledStaticAccounts`', () => {
            const message = compileTransactionMessage(baseTx);
            expect(getOrderedAccountsFromAddressMap).toHaveBeenCalled();
            expect(message.staticAccounts).toStrictEqual(['abc' as Address<'abc'>, 'def' as Address<'def'>]);
        });
    });
    describe('versions', () => {
        it('compiles the version', () => {
            const message = compileTransactionMessage(baseTx);
            expect(message).toHaveProperty('version', 'legacy');
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
                expect(() => compileTransactionMessage(baseTx)).toThrow(
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
                expect(() => compileTransactionMessage(baseTx)).not.toThrow();
            });
        });
        describe('too many signer addresses', () => {
            it('throws when there are more than 12 unique signers', () => {
                const accounts = Array.from({ length: 13 }, (_, i) => ({
                    address: `signer${i}` as Address,
                    role: AccountRole.WRITABLE_SIGNER,
                })) as unknown as OrderedAccounts;
                jest.mocked(getOrderedAccountsFromAddressMap).mockReturnValue(accounts);
                expect(() => compileTransactionMessage(baseTx)).toThrow(
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
                expect(() => compileTransactionMessage(baseTx)).not.toThrow();
            });
        });
        describe('too many instructions', () => {
            it('throws when there are more than 64 instructions', () => {
                baseTx = {
                    ...baseTx,
                    instructions: Array.from({ length: 65 }, () => ({ programAddress: 'prog' as Address })),
                    lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
                };
                expect(() => compileTransactionMessage(baseTx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS, {
                        actualCount: 65,
                        maxAllowed: 64,
                    }),
                );
            });
            it('does not throw with exactly 64 instructions', () => {
                baseTx = {
                    ...baseTx,
                    instructions: Array.from({ length: 64 }, () => ({ programAddress: 'prog' as Address })),
                    lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
                };
                expect(() => compileTransactionMessage(baseTx)).not.toThrow();
            });
        });
        describe('too many accounts in an instruction', () => {
            it('throws when an instruction has more than 255 account references', () => {
                baseTx = {
                    ...baseTx,
                    instructions: [
                        {
                            accounts: Array.from({ length: 256 }, () => ({
                                address: 'acct' as Address,
                                role: AccountRole.READONLY,
                            })),
                            programAddress: 'prog' as Address,
                        },
                    ],
                    lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
                };
                expect(() => compileTransactionMessage(baseTx)).toThrow(
                    new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION, {
                        actualCount: 256,
                        instructionIndex: 0,
                        maxAllowed: 255,
                    }),
                );
            });
            it('does not throw with exactly 255 accounts in an instruction', () => {
                baseTx = {
                    ...baseTx,
                    instructions: [
                        {
                            accounts: Array.from({ length: 255 }, () => ({
                                address: 'acct' as Address,
                                role: AccountRole.READONLY,
                            })),
                            programAddress: 'prog' as Address,
                        },
                    ],
                    lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
                };
                expect(() => compileTransactionMessage(baseTx)).not.toThrow();
            });
            it('reports the correct instruction index when a later instruction violates the constraint', () => {
                baseTx = {
                    ...baseTx,
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
                    lifetimeConstraint: MOCK_LIFETIME_CONSTRAINT,
                };
                expect(() => compileTransactionMessage(baseTx)).toThrow(
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
