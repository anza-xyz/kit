import { Address } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import { SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE, SolanaError } from '@solana/errors';
import { Blockhash } from '@solana/rpc-types';
import {
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    Nonce,
} from '@solana/transaction-messages';

import {
    assertIsTransactionWithBlockhashLifetime,
    assertIsTransactionWithDurableNonceLifetime,
    getTransactionLifetimeConstraintFromCompiledTransactionMessage,
} from '../lifetime';
import { Transaction, TransactionMessageBytes } from '../transaction';

const SYSTEM_PROGRAM_ADDRESS = '11111111111111111111111111111111' as Address;
const U64_MAX = 2n ** 64n - 1n;

describe('getTransactionLifetimeConstraintFromCompiledTransactionMessage', () => {
    it('returns a blockhash transaction lifetime when there are no instructions', async () => {
        expect.assertions(1);
        const compiledTransactionMessage = {
            instructions: [],
            lifetimeToken: 'abc',
        } as unknown as CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;

        await expect(
            getTransactionLifetimeConstraintFromCompiledTransactionMessage(compiledTransactionMessage),
        ).resolves.toEqual({ blockhash: 'abc' as Blockhash, lastValidBlockHeight: U64_MAX });
    });

    describe('returns a blockhash transaction lifetime when the first instruction is not an AdvanceNonceAccount instruction', () => {
        it('because the program is not the System Program', async () => {
            expect.assertions(1);
            const compiledTransactionMessage = {
                instructions: [
                    {
                        accountIndices: [1, 2, 3],
                        data: new Uint8Array([4, 0, 0, 0]),
                        programAddressIndex: 0,
                    },
                ],
                lifetimeToken: 'abc',
                staticAccounts: ['otherProgramAddress'],
            } as unknown as CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;

            await expect(
                getTransactionLifetimeConstraintFromCompiledTransactionMessage(compiledTransactionMessage),
            ).resolves.toEqual({ blockhash: 'abc' as Blockhash, lastValidBlockHeight: U64_MAX });
        });

        it('because the instruction data is not for AdvanceNonceAccount', async () => {
            expect.assertions(1);
            const compiledTransactionMessage = {
                instructions: [
                    {
                        accountIndices: [1, 2, 3],
                        data: new Uint8Array([1, 0, 0, 0]),
                        programAddressIndex: 0,
                    },
                ],
                lifetimeToken: 'abc',
                staticAccounts: [SYSTEM_PROGRAM_ADDRESS],
            } as unknown as CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;

            await expect(
                getTransactionLifetimeConstraintFromCompiledTransactionMessage(compiledTransactionMessage),
            ).resolves.toEqual({ blockhash: 'abc' as Blockhash, lastValidBlockHeight: U64_MAX });
        });

        it('because the instruction does not have exactly 3 accounts', async () => {
            expect.assertions(1);
            const compiledTransactionMessage = {
                instructions: [
                    {
                        accountIndices: [1, 2],
                        data: new Uint8Array([4, 0, 0, 0]),
                        programAddressIndex: 0,
                    },
                ],
                lifetimeToken: 'abc',
                staticAccounts: [SYSTEM_PROGRAM_ADDRESS],
            } as unknown as CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;

            await expect(
                getTransactionLifetimeConstraintFromCompiledTransactionMessage(compiledTransactionMessage),
            ).resolves.toEqual({ blockhash: 'abc' as Blockhash, lastValidBlockHeight: U64_MAX });
        });

        it('because it has no account indices', async () => {
            expect.assertions(1);
            const compiledTransactionMessage = {
                instructions: [
                    {
                        data: new Uint8Array([4, 0, 0, 0]),
                        programAddressIndex: 0,
                    },
                ],
                lifetimeToken: 'abc',
                staticAccounts: [SYSTEM_PROGRAM_ADDRESS],
            } as unknown as CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;

            await expect(
                getTransactionLifetimeConstraintFromCompiledTransactionMessage(compiledTransactionMessage),
            ).resolves.toEqual({ blockhash: 'abc' as Blockhash, lastValidBlockHeight: U64_MAX });
        });
    });

    it('returns a durable nonce transaction lifetime when the first instruction is an AdvanceNonceAccount instruction', async () => {
        expect.assertions(1);
        const compiledTransactionMessage = {
            instructions: [
                {
                    accountIndices: [1, 2, 3],
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddressIndex: 0,
                },
            ],
            lifetimeToken: 'abc',
            staticAccounts: [
                '11111111111111111111111111111111',
                'nonceAccountAddress',
                'recentBlockhashesSysvarAddress',
                'nonceAuthorityAddress',
            ],
        } as unknown as CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;

        await expect(
            getTransactionLifetimeConstraintFromCompiledTransactionMessage(compiledTransactionMessage),
        ).resolves.toEqual({ nonce: 'abc' as Nonce, nonceAccountAddress: 'nonceAccountAddress' });
    });

    it('fatals if the nonce account address is not in static accounts', async () => {
        expect.assertions(1);
        const compiledTransactionMessage = {
            instructions: [
                {
                    accountIndices: [1, 2, 3],
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddressIndex: 0,
                },
            ],
            lifetimeToken: 'abc',
            staticAccounts: ['11111111111111111111111111111111'],
        } as unknown as CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;

        await expect(() =>
            getTransactionLifetimeConstraintFromCompiledTransactionMessage(compiledTransactionMessage),
        ).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE, {
                nonce: 'abc',
            }),
        );
    });
});

describe('assertIsTransactionWithBlockhashLifetime', () => {
    it('throws for a transaction with no lifetime constraint', () => {
        const transaction: Transaction = {
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        };
        expect(() => assertIsTransactionWithBlockhashLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a durable nonce constraint', () => {
        const transaction = {
            lifetimeConstraint: {
                nonce: 'abcd' as Nonce,
                nonceAccountAddress: 'nonceAccountAddress' as Address,
            },
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        } as Transaction;
        expect(() => assertIsTransactionWithBlockhashLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a blockhash but no lastValidBlockHeight in lifetimeConstraint', () => {
        const transaction = {
            lifetimeConstraint: {
                blockhash: '11111111111111111111111111111111',
            },
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        } as Transaction;
        expect(() => assertIsTransactionWithBlockhashLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a lastValidBlockHeight but no blockhash in lifetimeConstraint', () => {
        const transaction = {
            lifetimeConstraint: {
                lastValidBlockHeight: 1234n,
            },
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        } as Transaction;
        expect(() => assertIsTransactionWithBlockhashLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a blockhash lifetime but an invalid blockhash value', () => {
        const transaction = {
            lifetimeConstraint: {
                blockhash: 'not a valid blockhash value',
            },
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        } as Transaction;
        expect(() => assertIsTransactionWithBlockhashLifetime(transaction)).toThrow();
    });
    it('does not throw for a transaction with a valid blockhash lifetime constraint', () => {
        const transaction = {
            lifetimeConstraint: {
                blockhash: '11111111111111111111111111111111',
                lastValidBlockHeight: 1234n,
            },
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        } as Transaction;
        expect(() => assertIsTransactionWithBlockhashLifetime(transaction)).not.toThrow();
    });
});

describe('assertIsTransactionWithDurableNonceLifetime()', () => {
    const validAddress = '2B7hCrBozp5hPV31mw1qUh5XhXYs9f6p1GsRdHNjF4xS' as Address;
    it('throws for a transaction with no lifetime constraint', () => {
        const transaction: Transaction = {
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        };
        expect(() => assertIsTransactionWithDurableNonceLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a blockhash constraint', () => {
        const transaction = {
            lifetimeConstraint: {
                blockhash: '11111111111111111111111111111111',
                lastValidBlockHeight: 1234n,
            },
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        } as Transaction;
        expect(() => assertIsTransactionWithDurableNonceLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a nonce but no nonceAccountAddress in lifetimeConstraint', () => {
        const transaction = {
            lifetimeConstraint: {
                nonce: 'abcd' as Nonce,
            },
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        } as Transaction;
        expect(() => assertIsTransactionWithDurableNonceLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a nonceAccountAddress but no nonce in lifetimeConstraint', () => {
        const transaction = {
            lifetimeConstraint: {
                nonceAccountAddress: validAddress,
            },
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        } as Transaction;
        expect(() => assertIsTransactionWithDurableNonceLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a durable nonce lifetime but an invalid nonceAccountAddress value', () => {
        const transaction = {
            lifetimeConstraint: {
                nonce: 'abcd' as Nonce,
                nonceAccountAddress: 'not a valid address' as Address,
            },
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        } as Transaction;
        expect(() => assertIsTransactionWithDurableNonceLifetime(transaction)).toThrow();
    });
    it('does not throw for a transaction with a valid durable nonce lifetime constraint', () => {
        const transaction = {
            lifetimeConstraint: {
                nonce: 'abcd' as Nonce,
                nonceAccountAddress: validAddress,
            },
            messageBytes: new Uint8Array() as ReadonlyUint8Array as TransactionMessageBytes,
            signatures: {},
        } as Transaction;
        expect(() => assertIsTransactionWithDurableNonceLifetime(transaction)).not.toThrow();
    });
});
