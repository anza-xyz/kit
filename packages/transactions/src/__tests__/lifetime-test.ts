import { Address } from '@solana/addresses';
import { SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE, SolanaError } from '@solana/errors';
import { Blockhash } from '@solana/rpc-types';
import {
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    Nonce,
} from '@solana/transaction-messages';

import { getTransactionLifetimeConstraintFromCompiledTransactionMessage } from '../lifetime';

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
