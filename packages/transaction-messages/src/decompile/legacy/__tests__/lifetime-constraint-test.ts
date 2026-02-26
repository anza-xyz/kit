import { Address } from '@solana/addresses';
import { AccountRole, Instruction } from '@solana/instructions';
import { Blockhash } from '@solana/rpc-types';

import { getLifetimeConstraint } from '../lifetime-constraint';

describe('getLifetimeConstraint', () => {
    describe('blockhash lifetime constraint', () => {
        it('should return blockhash lifetime constraint when no instructions provided', () => {
            const lifetimeToken = 'blockhash123' as Blockhash;
            const instructions: Instruction[] = [];
            const constraint = getLifetimeConstraint(lifetimeToken, instructions);

            expect(constraint).toStrictEqual({
                blockhash: lifetimeToken,
                lastValidBlockHeight: 2n ** 64n - 1n,
            });
        });

        it('should return blockhash lifetime constraint when first instruction is not advance nonce', () => {
            const lifetimeToken = 'blockhash456' as Blockhash;
            const instructions: Instruction[] = [
                {
                    accounts: [{ address: 'account1' as Address, role: AccountRole.WRITABLE }],
                    programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
                },
            ];

            const constraint = getLifetimeConstraint(lifetimeToken, instructions);

            expect(constraint).toStrictEqual({
                blockhash: lifetimeToken,
                lastValidBlockHeight: 2n ** 64n - 1n,
            });
        });

        it('should use provided lastValidBlockHeight when given', () => {
            const lifetimeToken = 'blockhash789' as Blockhash;
            const instructions: Instruction[] = [];
            const lastValidBlockHeight = 12345n;

            const constraint = getLifetimeConstraint(lifetimeToken, instructions, lastValidBlockHeight);

            expect(constraint).toStrictEqual({
                blockhash: lifetimeToken,
                lastValidBlockHeight: 12345n,
            });
        });

        it('should return blockhash when first instruction has wrong program address', () => {
            const lifetimeToken = 'blockhash000' as Blockhash;
            const instructions: Instruction[] = [
                {
                    accounts: [
                        { address: 'nonce-account' as Address, role: AccountRole.WRITABLE },
                        {
                            address: 'SysvarRecentB1ockHashes11111111111111111111' as Address,
                            role: AccountRole.READONLY,
                        },
                        { address: 'authority' as Address, role: AccountRole.READONLY_SIGNER },
                    ],
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddress: 'WrongProgram1111111111111111111111111111' as Address,
                },
            ];

            const constraint = getLifetimeConstraint(lifetimeToken, instructions);

            expect(constraint).toStrictEqual({
                blockhash: lifetimeToken,
                lastValidBlockHeight: 2n ** 64n - 1n,
            });
        });

        it('should return blockhash when first instruction has wrong data', () => {
            const lifetimeToken = 'blockhash111' as Blockhash;
            const instructions = [
                {
                    accounts: [
                        { address: 'nonce-account' as Address, role: AccountRole.WRITABLE },
                        {
                            address: 'SysvarRecentB1ockHashes11111111111111111111' as Address,
                            role: AccountRole.READONLY,
                        },
                        { address: 'authority' as Address, role: AccountRole.READONLY_SIGNER },
                    ],
                    data: new Uint8Array([5, 0, 0, 0]),
                    programAddress: '11111111111111111111111111111111' as Address, // wrong instruction discriminator
                },
            ];

            const constraint = getLifetimeConstraint(lifetimeToken, instructions);

            expect(constraint).toStrictEqual({
                blockhash: lifetimeToken,
                lastValidBlockHeight: 2n ** 64n - 1n,
            });
        });

        it('should return blockhash when first instruction has wrong number of accounts', () => {
            const lifetimeToken = 'blockhash222' as Blockhash;
            const instructions = [
                {
                    accounts: [
                        { address: 'nonce-account' as Address, role: AccountRole.WRITABLE },
                        {
                            address: 'SysvarRecentB1ockHashes11111111111111111111' as Address,
                            role: AccountRole.READONLY,
                        },
                    ],
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddress: '11111111111111111111111111111111' as Address,
                },
            ];

            const constraint = getLifetimeConstraint(lifetimeToken, instructions);

            expect(constraint).toStrictEqual({
                blockhash: lifetimeToken,
                lastValidBlockHeight: 2n ** 64n - 1n,
            });
        });

        it('should return blockhash when first instruction has no accounts', () => {
            const lifetimeToken = 'blockhash-no-accounts' as Blockhash;
            const instructions: Instruction[] = [
                {
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddress: '11111111111111111111111111111111' as Address,
                },
            ];

            const constraint = getLifetimeConstraint(lifetimeToken, instructions);

            expect(constraint).toStrictEqual({
                blockhash: lifetimeToken,
                lastValidBlockHeight: 2n ** 64n - 1n,
            });
        });

        it('should return blockhash when first instruction has no data', () => {
            const lifetimeToken = 'blockhash-no-data' as Blockhash;
            const instructions: Instruction[] = [
                {
                    accounts: [
                        { address: 'nonce-account' as Address, role: AccountRole.WRITABLE },
                        {
                            address: 'SysvarRecentB1ockHashes11111111111111111111' as Address,
                            role: AccountRole.READONLY,
                        },
                        { address: 'authority' as Address, role: AccountRole.READONLY_SIGNER },
                    ],
                    programAddress: '11111111111111111111111111111111' as Address,
                },
            ];

            const constraint = getLifetimeConstraint(lifetimeToken, instructions);

            expect(constraint).toStrictEqual({
                blockhash: lifetimeToken,
                lastValidBlockHeight: 2n ** 64n - 1n,
            });
        });
    });

    describe('nonce lifetime constraint', () => {
        it('should return nonce lifetime constraint when first instruction is advance nonce with readonly signer', () => {
            const lifetimeToken = 'nonce123';
            const instructions = [
                {
                    accounts: [
                        {
                            address: '4wBqpZM9xaSheZzJSMawUHDgH36fBXoKrcna28MqTQF1' as Address,
                            role: AccountRole.WRITABLE,
                        },
                        {
                            address: 'SysvarRecentB1ockHashes11111111111111111111' as Address,
                            role: AccountRole.READONLY,
                        },
                        {
                            address: 'FYZJxv6E1UB1AZReeakjUZgnkYvsHxqPMVkDsjdbWs3L' as Address,
                            role: AccountRole.READONLY_SIGNER,
                        },
                    ],
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddress: '11111111111111111111111111111111' as Address,
                },
            ];

            const constraint = getLifetimeConstraint(lifetimeToken, instructions);

            expect(constraint).toStrictEqual({
                nonce: lifetimeToken,
                nonceAccountAddress: '4wBqpZM9xaSheZzJSMawUHDgH36fBXoKrcna28MqTQF1',
                nonceAuthorityAddress: 'FYZJxv6E1UB1AZReeakjUZgnkYvsHxqPMVkDsjdbWs3L',
            });
        });

        it('should return nonce lifetime constraint when first instruction is advance nonce with writable signer', () => {
            const lifetimeToken = 'nonce456';
            const instructions = [
                {
                    accounts: [
                        {
                            address: '8vCf5aVJkPzzkW34WFq9tHHVmgYMNzJf2jPKvv7YF5Ah' as Address,
                            role: AccountRole.WRITABLE,
                        },
                        {
                            address: 'SysvarRecentB1ockHashes11111111111111111111' as Address,
                            role: AccountRole.READONLY,
                        },
                        {
                            address: 'GZz8aVQBfN7wXT8F2vKvK4kZ5J1xYPaM3wQE4pqBv8Qj' as Address,
                            role: AccountRole.WRITABLE_SIGNER,
                        },
                    ],
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddress: '11111111111111111111111111111111' as Address,
                },
            ];

            const constraint = getLifetimeConstraint(lifetimeToken, instructions);

            expect(constraint).toStrictEqual({
                nonce: lifetimeToken,
                nonceAccountAddress: '8vCf5aVJkPzzkW34WFq9tHHVmgYMNzJf2jPKvv7YF5Ah',
                nonceAuthorityAddress: 'GZz8aVQBfN7wXT8F2vKvK4kZ5J1xYPaM3wQE4pqBv8Qj',
            });
        });

        it('should return nonce lifetime constraint even when lastValidBlockHeight is provided', () => {
            const lifetimeToken = 'nonce789';
            const instructions = [
                {
                    accounts: [
                        {
                            address: 'CsJmqbHTR5pY8CLH8TnQXh5rL2qp1fS9Y8wSVkv8pPWy' as Address,
                            role: AccountRole.WRITABLE,
                        },
                        {
                            address: 'SysvarRecentB1ockHashes11111111111111111111' as Address,
                            role: AccountRole.READONLY,
                        },
                        {
                            address: 'DnVsJPvU3iW9rJqbLbGxFdp4xVkLZKRLw8pnhqVkpN3H' as Address,
                            role: AccountRole.READONLY_SIGNER,
                        },
                    ],
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddress: '11111111111111111111111111111111' as Address,
                },
            ];
            const lastValidBlockHeight = 99999n;

            const constraint = getLifetimeConstraint(lifetimeToken, instructions, lastValidBlockHeight);

            expect(constraint).toStrictEqual({
                nonce: lifetimeToken,
                nonceAccountAddress: 'CsJmqbHTR5pY8CLH8TnQXh5rL2qp1fS9Y8wSVkv8pPWy',
                nonceAuthorityAddress: 'DnVsJPvU3iW9rJqbLbGxFdp4xVkLZKRLw8pnhqVkpN3H',
            });
        });

        it('should return nonce lifetime constraint when there are multiple instructions', () => {
            const lifetimeToken = 'nonce000';
            const instructions = [
                {
                    accounts: [
                        {
                            address: '2mGq8vz9Z3e3vQWaP9sPfYvYzrh8jrE1VQ4TH2wLFRp6' as Address,
                            role: AccountRole.WRITABLE,
                        },
                        {
                            address: 'SysvarRecentB1ockHashes11111111111111111111' as Address,
                            role: AccountRole.READONLY,
                        },
                        {
                            address: '7hBjZqWmR3JvE4QfxqKjvFZnkxqYpLCz4xJ9Fn8MTy2D' as Address,
                            role: AccountRole.READONLY_SIGNER,
                        },
                    ],
                    data: new Uint8Array([4, 0, 0, 0]),
                    programAddress: '11111111111111111111111111111111' as Address,
                },
                {
                    accounts: [
                        {
                            address: '3pKvN2wV8qhLZjP6YfmR7qWJdkzVxH5RKLnfU9sQ2tY8' as Address,
                            role: AccountRole.WRITABLE,
                        },
                    ],
                    programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address,
                },
            ];

            const constraint = getLifetimeConstraint(lifetimeToken, instructions);

            expect(constraint).toStrictEqual({
                nonce: lifetimeToken,
                nonceAccountAddress: '2mGq8vz9Z3e3vQWaP9sPfYvYzrh8jrE1VQ4TH2wLFRp6',
                nonceAuthorityAddress: '7hBjZqWmR3JvE4QfxqKjvFZnkxqYpLCz4xJ9Fn8MTy2D',
            });
        });
    });
});
