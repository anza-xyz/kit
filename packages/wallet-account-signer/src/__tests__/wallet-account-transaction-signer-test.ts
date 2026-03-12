import type { Address } from '@solana/addresses';
import { address } from '@solana/addresses';
import { bytesEqual } from '@solana/codecs-core';
import { SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE, SolanaError } from '@solana/errors';
import { TransactionModifyingSigner } from '@solana/signers';
import { getCompiledTransactionMessageDecoder } from '@solana/transaction-messages';
import {
    assertIsTransactionWithinSizeLimit,
    getTransactionCodec,
    getTransactionLifetimeConstraintFromCompiledTransactionMessage,
    TransactionBlockhashLifetime,
    TransactionDurableNonceLifetime,
    TransactionMessageBytes,
} from '@solana/transactions';
import { SolanaSignTransaction, SolanaSignTransactionFeature } from '@solana/wallet-standard-features';
import { WalletStandardError } from '@wallet-standard/errors';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';

import { Blockhash } from '../../../rpc-types/dist/types';
import { createTransactionSignerFromWalletAccount } from '../wallet-account-transaction-signer';

jest.mock('@solana/addresses');
jest.mock('@wallet-standard/ui');
jest.mock('@wallet-standard/ui-registry');
jest.mock('@solana/transactions');
jest.mock('@solana/transaction-messages');
jest.mock('@solana/codecs-core');

type InputTransaction = Parameters<TransactionModifyingSigner['modifyAndSignTransactions']>[0][number];

describe('createSignerFromWalletAccount', () => {
    const mockAddress = 'Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy' as Address;

    function createMockAccount(overrides: Partial<UiWalletAccount> = {}): UiWalletAccount {
        return {
            address: mockAddress,
            chains: ['solana:devnet'],
            features: [SolanaSignTransaction],
            ...overrides,
        } as unknown as UiWalletAccount;
    }

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(address).mockImplementation(addr => addr as Address);
    });

    it('throws if chain is unsupported', () => {
        // Given a wallet account that only supports devnet.
        const account = createMockAccount({ chains: ['solana:devnet'] });

        // When we try to create a signer for mainnet.
        const fn = () => createTransactionSignerFromWalletAccount(account, 'solana:mainnet');

        // Then we expect an error to be thrown.
        expect(fn).toThrow(WalletStandardError);
    });

    it('exposes the correct address', () => {
        // Given a wallet account with a known address.
        const account = createMockAccount({ address: mockAddress });

        // When we create a signer from the account.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer exposes the same address.
        expect(signer.address).toBe(mockAddress);
    });

    it('returns empty array when no transactions are provided', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock wallet feature.
        const mockFeature: SolanaSignTransactionFeature['solana:signTransaction'] = {
            signTransaction: jest.fn().mockResolvedValue([]),
        } as unknown as SolanaSignTransactionFeature['solana:signTransaction'];

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions with an empty array.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');

        // Then it returns an empty array.
        await expect(signer.modifyAndSignTransactions([])).resolves.toEqual([]);
    });

    it('forwards transactions to wallet feature', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const mockEncodedTransaction = new Uint8Array([1, 2, 3]);
        const mockEncode = jest.fn().mockReturnValue(mockEncodedTransaction);
        const mockDecode = jest.fn().mockReturnValue({
            messageBytes: new Uint8Array([4, 5, 6]),
            signatures: {},
        });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: mockEncode,
        } as unknown as ReturnType<typeof getTransactionCodec>);

        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});

        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockReturnValue({ lifetimeToken: 'test-blockhash' }),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);

        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage).mockResolvedValue({
            blockhash: 'test-blockhash',
            lastValidBlockHeight: 100n,
        } as TransactionBlockhashLifetime);

        // And a mock wallet feature that returns a signed transaction.
        const mockFeature = {
            signTransaction: jest.fn().mockResolvedValue([{ signedTransaction: new Uint8Array([1, 2, 3]) }]),
        };

        const mockWalletAccount: ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED> =
            {
                mockAccount: 1,
            } as unknown as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>;

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            mockWalletAccount,
        );

        // When we create a signer and call modifyAndSignTransactions.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');
        const tx = {} as unknown as InputTransaction;
        await signer.modifyAndSignTransactions([tx]);

        // Then the wallet feature's signTransaction method is called.
        expect(mockFeature.signTransaction).toHaveBeenCalledWith({
            account: mockWalletAccount,
            chain: 'solana:devnet',
            transaction: mockEncodedTransaction,
        });
    });

    it('propagates wallet errors', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: jest.fn(),
            encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        } as unknown as ReturnType<typeof getTransactionCodec>);

        // And a mock wallet feature that rejects with an error.
        const mockFeature = {
            signTransaction: jest.fn().mockRejectedValue(new Error('fail')),
        };
        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');

        // Then the wallet error is propagated.
        await expect(signer.modifyAndSignTransactions([{} as InputTransaction])).rejects.toThrow('fail');
    });

    it('returns unchanged lifetime constraint if the signed transaction has identical bytes', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const messageBytes = new Uint8Array([1, 2, 3]) as unknown as TransactionMessageBytes;
        const mockDecode = jest.fn().mockReturnValue({
            messageBytes,
            signatures: {},
        });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        } as unknown as ReturnType<typeof getTransactionCodec>);

        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});
        jest.mocked(bytesEqual).mockReturnValue(true);

        // And a mock wallet feature that returns a signed transaction.
        const mockFeature = {
            signTransaction: jest.fn().mockResolvedValue([{ signedTransaction: new Uint8Array([1, 2, 3]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions with a lifetime constraint.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');
        const lifetimeConstraint = { blockhash: 'abc', lastValidBlockHeight: 123n } as TransactionBlockhashLifetime;
        const tx = {
            lifetimeConstraint,
            messageBytes,
            signatures: {},
        } as unknown as InputTransaction;

        const result = await signer.modifyAndSignTransactions([tx]);

        // Then the result has the original lifetime constraint.
        expect(result[0].lifetimeConstraint).toBe(lifetimeConstraint);
    });

    it('returns unchanged lifetime constraint if the signed transaction has the same lifetime token', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec that returns different message bytes.
        const inputMessageBytes = new Uint8Array([1, 2, 3]) as unknown as TransactionMessageBytes;
        const outputMessageBytes = new Uint8Array([4, 5, 6]) as unknown as TransactionMessageBytes;
        const mockDecode = jest.fn().mockReturnValue({
            messageBytes: outputMessageBytes,
            signatures: {},
        });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        } as unknown as ReturnType<typeof getTransactionCodec>);

        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});
        jest.mocked(bytesEqual).mockReturnValue(false);

        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockReturnValue({ lifetimeToken: 'abc' }),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);

        // And a mock wallet feature that returns a signed transaction.
        const mockFeature = {
            signTransaction: jest.fn().mockResolvedValue([{ signedTransaction: new Uint8Array([4, 5, 6]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions with a lifetime constraint.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');
        const lifetimeConstraint = { blockhash: 'abc', lastValidBlockHeight: 123n } as TransactionBlockhashLifetime;
        const tx = {
            lifetimeConstraint,
            messageBytes: inputMessageBytes,
            signatures: {},
        } as unknown as InputTransaction;

        const result = await signer.modifyAndSignTransactions([tx]);

        // Then the result has the original lifetime constraint.
        expect(result[0].lifetimeConstraint).toBe(lifetimeConstraint);
    });

    it('returns a new lifetime constraint if the input transaction does not have one', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const mockDecode = jest.fn().mockReturnValue({
            messageBytes: new Uint8Array([4, 5, 6]),
            signatures: {},
        });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        } as unknown as ReturnType<typeof getTransactionCodec>);

        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});

        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockReturnValue({}),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);

        const newLifetimeConstraint = { blockhash: 'def', lastValidBlockHeight: 456n } as TransactionBlockhashLifetime;
        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage).mockResolvedValue(
            newLifetimeConstraint,
        );

        // And a mock wallet feature that returns a signed transaction.
        const mockFeature = {
            signTransaction: jest.fn().mockResolvedValue([{ signedTransaction: new Uint8Array([4, 5, 6]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions without a lifetime constraint.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');
        const tx = {
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as InputTransaction;

        const result = await signer.modifyAndSignTransactions([tx]);

        // Then the result has the new lifetime constraint.
        expect(result[0].lifetimeConstraint).toEqual(newLifetimeConstraint);
    });

    it('returns a new lifetime constraint if the signed transaction has a different lifetime token', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const mockDecode = jest.fn().mockReturnValue({
            messageBytes: new Uint8Array([4, 5, 6]),
            signatures: {},
        });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        } as unknown as ReturnType<typeof getTransactionCodec>);

        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});
        jest.mocked(bytesEqual).mockReturnValue(false);

        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockReturnValue({ lifetimeToken: 'def' }),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);

        const newLifetimeConstraint = { blockhash: 'def', lastValidBlockHeight: 456n } as TransactionBlockhashLifetime;
        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage).mockResolvedValue(
            newLifetimeConstraint,
        );

        // And a mock wallet feature that returns a signed transaction.
        const mockFeature = {
            signTransaction: jest.fn().mockResolvedValue([{ signedTransaction: new Uint8Array([4, 5, 6]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions with a different lifetime token.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');
        const inputLifetimeConstraint = {
            blockhash: 'abc',
            lastValidBlockHeight: 123n,
        } as TransactionBlockhashLifetime;
        const tx = {
            lifetimeConstraint: inputLifetimeConstraint,
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as InputTransaction;

        const result = await signer.modifyAndSignTransactions([tx]);

        // Then the result has the new lifetime constraint.
        expect(result[0].lifetimeConstraint).toEqual(newLifetimeConstraint);
    });

    it('throws when the signed transaction has a nonce lifetime but the nonce account is in a lookup table', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const mockDecode = jest.fn().mockReturnValue({
            messageBytes: new Uint8Array([4, 5, 6]),
            signatures: {},
        });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        } as unknown as ReturnType<typeof getTransactionCodec>);

        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});

        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockReturnValue({}),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);

        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage).mockRejectedValue(
            new SolanaError(SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE, {
                nonce: 'abc',
            }),
        );

        // And a mock wallet feature that returns a signed transaction.
        const mockFeature = {
            signTransaction: jest.fn().mockResolvedValue([{ signedTransaction: new Uint8Array([4, 5, 6]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');
        const tx = {
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as InputTransaction;

        // Then the error is propagated.
        await expect(signer.modifyAndSignTransactions([tx])).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE, {
                nonce: 'abc',
            }),
        );
    });

    it('passes minContextSlot option to wallet feature', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const mockDecode = jest.fn().mockReturnValue({
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        } as unknown as ReturnType<typeof getTransactionCodec>);

        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});
        jest.mocked(bytesEqual).mockReturnValue(true);

        // And a mock wallet feature.
        const mockFeature = {
            signTransaction: jest.fn().mockResolvedValue([{ signedTransaction: new Uint8Array([1, 2, 3]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions with options.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');
        const lifetimeConstraint = { blockhash: 'abc', lastValidBlockHeight: 123n };
        const tx = {
            lifetimeConstraint,
            messageBytes: new Uint8Array([1, 2, 3]) as unknown as TransactionMessageBytes,
            signatures: {},
        } as unknown as InputTransaction;

        await signer.modifyAndSignTransactions([tx], {
            abortSignal: AbortSignal.timeout(1_000_000),
            minContextSlot: 456n,
        });

        // Then the minContextSlot is passed to the wallet feature (converted to number).
        expect(mockFeature.signTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                options: { minContextSlot: 456 },
            }),
        );
    });

    it('rejects when aborted', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: jest.fn(),
            encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        } as unknown as ReturnType<typeof getTransactionCodec>);

        // And a mock wallet feature.
        const mockFeature = {
            signTransaction: jest.fn().mockResolvedValue([{ signedTransaction: new Uint8Array([1, 2, 3]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');
        const tx = {
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as InputTransaction;

        // And we call modifyAndSignTransactions with an already aborted signal.
        const abortController = new AbortController();
        abortController.abort(new Error('o no'));
        const alreadyAbortedSignal = abortController.signal;

        // Then it rejects with the abort error.
        await expect(signer.modifyAndSignTransactions([tx], { abortSignal: alreadyAbortedSignal })).rejects.toThrow(
            new Error('o no'),
        );
    });

    it('processes multiple transactions with different lifetime constraint scenarios independently', async () => {
        expect.assertions(5);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const tx1MessageBytes = new Uint8Array([1, 2, 3]) as unknown as TransactionMessageBytes;
        const tx2MessageBytes = new Uint8Array([4, 5, 6]) as unknown as TransactionMessageBytes;
        const tx3MessageBytes = new Uint8Array([7, 8, 9]) as unknown as TransactionMessageBytes;

        const mockEncode = jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
        const mockDecode = jest
            .fn()
            .mockReturnValueOnce({
                messageBytes: tx1MessageBytes,
                signatures: {},
            })
            .mockReturnValueOnce({
                messageBytes: tx2MessageBytes,
                signatures: {},
            })
            .mockReturnValueOnce({
                messageBytes: tx3MessageBytes,
                signatures: {},
            });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: mockEncode,
        } as unknown as ReturnType<typeof getTransactionCodec>);

        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});

        const tx1Lifetime: TransactionBlockhashLifetime = { blockhash: 'abc' as Blockhash, lastValidBlockHeight: 100n };
        const tx2Lifetime: TransactionBlockhashLifetime = { blockhash: 'xyz' as Blockhash, lastValidBlockHeight: 200n };

        // Mock bytesEqual to return true for tx1 (identical bytes), false for tx2
        jest.mocked(bytesEqual)
            .mockReturnValueOnce(true) // tx1 comparison
            .mockReturnValueOnce(false); // tx2 comparison

        // Mock decoder for tx2 to return matching lifetime token
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest
                .fn()
                .mockReturnValueOnce({ lifetimeToken: 'xyz' }) // tx2 token check
                .mockReturnValueOnce({}), // tx3 needs new lifetime
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);

        // Mock new lifetime for tx3
        const newLifetime = {
            blockhash: 'new-hash' as Blockhash,
            lastValidBlockHeight: 999n,
        } as TransactionBlockhashLifetime;
        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage).mockResolvedValue(newLifetime);

        // And a mock wallet feature.
        const mockFeature = {
            signTransaction: jest
                .fn()
                .mockResolvedValue([
                    { signedTransaction: new Uint8Array([1, 2, 3]) },
                    { signedTransaction: new Uint8Array([4, 5, 6]) },
                    { signedTransaction: new Uint8Array([7, 8, 9]) },
                ]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions with 3 transactions.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');

        const tx1 = {
            lifetimeConstraint: tx1Lifetime,
            messageBytes: tx1MessageBytes,
            signatures: {},
        } as unknown as InputTransaction;

        const tx2 = {
            lifetimeConstraint: tx2Lifetime,
            messageBytes: tx2MessageBytes,
            signatures: {},
        } as unknown as InputTransaction;

        const tx3 = {
            messageBytes: tx3MessageBytes,
            signatures: {},
        } as unknown as InputTransaction;

        const result = await signer.modifyAndSignTransactions([tx1, tx2, tx3]);

        // Then bytesEqual is called twice (for tx1 and tx2, tx3 does not have an input lifetime).
        expect(bytesEqual).toHaveBeenCalledTimes(2);

        // And the result has 3 transactions.
        expect(result).toHaveLength(3);

        // And tx1 reuses its lifetime (identical bytes path).
        expect(result[0].lifetimeConstraint).toBe(tx1Lifetime);

        // And tx2 reuses its lifetime (same token path).
        expect(result[1].lifetimeConstraint).toBe(tx2Lifetime);

        // And tx3 has the new lifetime.
        expect(result[2].lifetimeConstraint).toEqual(newLifetime);
    });

    it('calls assertIsTransactionWithinSizeLimit for each transaction in the batch', async () => {
        expect.assertions(2);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const mockEncode = jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
        const mockDecode = jest
            .fn()
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([1]) as unknown as TransactionMessageBytes,
                signatures: {},
            })
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([2]) as unknown as TransactionMessageBytes,
                signatures: {},
            })
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([3]) as unknown as TransactionMessageBytes,
                signatures: {},
            })
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([4]) as unknown as TransactionMessageBytes,
                signatures: {},
            });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: mockEncode,
        } as unknown as ReturnType<typeof getTransactionCodec>);

        const assertMock = jest.fn();
        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(assertMock);

        // Mock bytesEqual to return true for all to simplify the test.
        jest.mocked(bytesEqual).mockReturnValue(true);

        // And a mock wallet feature.
        const mockFeature = {
            signTransaction: jest
                .fn()
                .mockResolvedValue([
                    { signedTransaction: new Uint8Array([1]) },
                    { signedTransaction: new Uint8Array([2]) },
                    { signedTransaction: new Uint8Array([3]) },
                    { signedTransaction: new Uint8Array([4]) },
                ]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions with 4 transactions.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');

        const transactions = [
            {
                lifetimeConstraint: { blockhash: 'a', lastValidBlockHeight: 100n },
                messageBytes: new Uint8Array([1]) as unknown as TransactionMessageBytes,
                signatures: {},
            },
            {
                lifetimeConstraint: { blockhash: 'b', lastValidBlockHeight: 200n },
                messageBytes: new Uint8Array([2]) as unknown as TransactionMessageBytes,
                signatures: {},
            },
            {
                lifetimeConstraint: { blockhash: 'c', lastValidBlockHeight: 300n },
                messageBytes: new Uint8Array([3]) as unknown as TransactionMessageBytes,
                signatures: {},
            },
            {
                lifetimeConstraint: { blockhash: 'd', lastValidBlockHeight: 400n },
                messageBytes: new Uint8Array([4]) as unknown as TransactionMessageBytes,
                signatures: {},
            },
        ] as unknown as InputTransaction[];

        const result = await signer.modifyAndSignTransactions(transactions);

        // Then assertIsTransactionWithinSizeLimit is called exactly 4 times.
        expect(assertMock).toHaveBeenCalledTimes(4);

        // And the result has 4 transactions.
        expect(result).toHaveLength(4);
    });

    it('fetches new lifetime constraints for multiple transactions without existing lifetimes', async () => {
        expect.assertions(4);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const mockEncode = jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
        const mockDecode = jest
            .fn()
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([10, 11, 12]) as unknown as TransactionMessageBytes,
                signatures: {},
            })
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([20, 21, 22]) as unknown as TransactionMessageBytes,
                signatures: {},
            })
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([30, 31, 32]) as unknown as TransactionMessageBytes,
                signatures: {},
            });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: mockEncode,
        } as unknown as ReturnType<typeof getTransactionCodec>);

        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});

        // Mock decoder to return empty objects (no lifetime token).
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockReturnValue({}),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);

        // Mock getTransactionLifetimeConstraintFromCompiledTransactionMessage to return different lifetimes.
        const lifetime1 = { blockhash: 'new-hash-1', lastValidBlockHeight: 1000n } as TransactionBlockhashLifetime;
        const lifetime2 = { blockhash: 'new-hash-2', lastValidBlockHeight: 2000n } as TransactionBlockhashLifetime;
        const lifetime3 = { blockhash: 'new-hash-3', lastValidBlockHeight: 3000n } as TransactionBlockhashLifetime;

        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage)
            .mockResolvedValueOnce(lifetime1)
            .mockResolvedValueOnce(lifetime2)
            .mockResolvedValueOnce(lifetime3);

        // And a mock wallet feature.
        const mockFeature = {
            signTransaction: jest
                .fn()
                .mockResolvedValue([
                    { signedTransaction: new Uint8Array([10, 11, 12]) },
                    { signedTransaction: new Uint8Array([20, 21, 22]) },
                    { signedTransaction: new Uint8Array([30, 31, 32]) },
                ]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions with 3 transactions without lifetimes.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');

        const transactions = [
            { messageBytes: new Uint8Array([10, 11, 12]) as unknown as TransactionMessageBytes, signatures: {} },
            { messageBytes: new Uint8Array([20, 21, 22]) as unknown as TransactionMessageBytes, signatures: {} },
            { messageBytes: new Uint8Array([30, 31, 32]) as unknown as TransactionMessageBytes, signatures: {} },
        ] as unknown as InputTransaction[];

        const result = await signer.modifyAndSignTransactions(transactions);

        // Then getTransactionLifetimeConstraintFromCompiledTransactionMessage is called exactly 3 times.
        expect(getTransactionLifetimeConstraintFromCompiledTransactionMessage).toHaveBeenCalledTimes(3);

        // And each transaction has the correct new lifetime.
        expect(result[0].lifetimeConstraint).toEqual(lifetime1);
        expect(result[1].lifetimeConstraint).toEqual(lifetime2);
        expect(result[2].lifetimeConstraint).toEqual(lifetime3);
    });

    it('fetches new lifetime constraints when multiple transactions have different lifetime tokens', async () => {
        expect.assertions(4);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const mockEncode = jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
        const mockDecode = jest
            .fn()
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([50, 51]) as unknown as TransactionMessageBytes,
                signatures: {},
            })
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([60, 61]) as unknown as TransactionMessageBytes,
                signatures: {},
            });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: mockEncode,
        } as unknown as ReturnType<typeof getTransactionCodec>);

        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});

        // Mock bytesEqual to return false for both transactions.
        jest.mocked(bytesEqual).mockReturnValue(false);

        // Mock decoder to return different lifetime tokens.
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest
                .fn()
                .mockReturnValueOnce({ lifetimeToken: 'changed-1' }) // tx1 token check
                .mockReturnValueOnce({ lifetimeToken: 'changed-1' }) // tx1 new lifetime fetch
                .mockReturnValueOnce({ lifetimeToken: 'changed-2' }) // tx2 token check
                .mockReturnValueOnce({ lifetimeToken: 'changed-2' }), // tx2 new lifetime fetch
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);

        // Mock new lifetimes.
        const newLifetime1 = { blockhash: 'changed-1', lastValidBlockHeight: 5000n } as TransactionBlockhashLifetime;
        const newLifetime2 = {
            nonce: 'changed-2',
            nonceAccountAddress: address('11111111111111111111111111111111'),
        } as TransactionDurableNonceLifetime;

        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage)
            .mockResolvedValueOnce(newLifetime1)
            .mockResolvedValueOnce(newLifetime2);

        // And a mock wallet feature.
        const mockFeature = {
            signTransaction: jest
                .fn()
                .mockResolvedValue([
                    { signedTransaction: new Uint8Array([50, 51]) },
                    { signedTransaction: new Uint8Array([60, 61]) },
                ]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions with 2 transactions with existing but changed lifetimes.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');

        const transactions = [
            {
                lifetimeConstraint: { blockhash: 'original-1', lastValidBlockHeight: 100n },
                messageBytes: new Uint8Array([50, 51]) as unknown as TransactionMessageBytes,
                signatures: {},
            },
            {
                lifetimeConstraint: {
                    nonce: 'original-2',
                    nonceAccountAddress: address('11111111111111111111111111111111'),
                },
                messageBytes: new Uint8Array([60, 61]) as unknown as TransactionMessageBytes,
                signatures: {},
            },
        ] as unknown as InputTransaction[];

        const result = await signer.modifyAndSignTransactions(transactions);

        // Then bytesEqual is called twice.
        expect(bytesEqual).toHaveBeenCalledTimes(2);

        // And the decoder is called 4 times (2 token checks + 2 new lifetime fetches).
        expect(getCompiledTransactionMessageDecoder().decode).toHaveBeenCalledTimes(4);

        // And each transaction has the new lifetime.
        expect(result[0].lifetimeConstraint).toEqual(newLifetime1);
        expect(result[1].lifetimeConstraint).toEqual(newLifetime2);
    });

    it('propagates error when lifetime constraint fetch fails for one transaction in a batch', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const mockEncode = jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
        const mockDecode = jest
            .fn()
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([70, 71]) as unknown as TransactionMessageBytes,
                signatures: {},
            })
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([80, 81]) as unknown as TransactionMessageBytes,
                signatures: {},
            })
            .mockReturnValueOnce({
                messageBytes: new Uint8Array([90, 91]) as unknown as TransactionMessageBytes,
                signatures: {},
            });

        jest.mocked(getTransactionCodec).mockReturnValue({
            decode: mockDecode,
            encode: mockEncode,
        } as unknown as ReturnType<typeof getTransactionCodec>);

        jest.mocked(assertIsTransactionWithinSizeLimit).mockImplementation(() => {});

        // Mock decoder to return empty objects.
        jest.mocked(getCompiledTransactionMessageDecoder).mockReturnValue({
            decode: jest.fn().mockReturnValue({}),
        } as unknown as ReturnType<typeof getCompiledTransactionMessageDecoder>);

        // Mock getTransactionLifetimeConstraintFromCompiledTransactionMessage to succeed for first, fail for second.
        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage)
            .mockResolvedValueOnce({ blockhash: 'ok-hash', lastValidBlockHeight: 100n } as TransactionBlockhashLifetime)
            .mockRejectedValueOnce(
                new SolanaError(SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE, {
                    nonce: 'bad-nonce',
                }),
            );

        // And a mock wallet feature.
        const mockFeature = {
            signTransaction: jest
                .fn()
                .mockResolvedValue([
                    { signedTransaction: new Uint8Array([70, 71]) },
                    { signedTransaction: new Uint8Array([80, 81]) },
                    { signedTransaction: new Uint8Array([90, 91]) },
                ]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions with 3 transactions.
        const signer = createTransactionSignerFromWalletAccount(account, 'solana:devnet');

        const transactions = [
            { messageBytes: new Uint8Array([70, 71]) as unknown as TransactionMessageBytes, signatures: {} },
            { messageBytes: new Uint8Array([80, 81]) as unknown as TransactionMessageBytes, signatures: {} },
            { messageBytes: new Uint8Array([90, 91]) as unknown as TransactionMessageBytes, signatures: {} },
        ] as unknown as InputTransaction[];

        // Then it rejects with the nonce error.
        await expect(signer.modifyAndSignTransactions(transactions)).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE, {
                nonce: 'bad-nonce',
            }),
        );
    });
});
