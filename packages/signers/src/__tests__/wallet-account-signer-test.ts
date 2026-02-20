import type { Address } from '@solana/addresses';
import { address } from '@solana/addresses';
import { bytesEqual } from '@solana/codecs-core';
import { SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE, SolanaError } from '@solana/errors';
import { getCompiledTransactionMessageDecoder } from '@solana/transaction-messages';
import {
    assertIsTransactionWithinSizeLimit,
    getTransactionCodec,
    getTransactionLifetimeConstraintFromCompiledTransactionMessage,
    TransactionMessageBytes,
} from '@solana/transactions';
import { SolanaSignTransaction, SolanaSignTransactionFeature } from '@solana/wallet-standard-features';
import { WalletStandardError } from '@wallet-standard/errors';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';

import { createSignerFromWalletAccount } from '../wallet-account-signer';

jest.mock('@solana/addresses');
jest.mock('@wallet-standard/ui');
jest.mock('@wallet-standard/ui-registry');
jest.mock('@solana/transactions');
jest.mock('@solana/transaction-messages');
jest.mock('@solana/codecs-core');

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
        const fn = () => createSignerFromWalletAccount(account, 'solana:mainnet');

        // Then we expect an error to be thrown.
        expect(fn).toThrow(WalletStandardError);
    });

    it('exposes the correct address', () => {
        // Given a wallet account with a known address.
        const account = createMockAccount();

        // When we create a signer from the account.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

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
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then it returns an empty array.
        await expect(signer.modifyAndSignTransactions([])).resolves.toEqual([]);
    });

    it('forwards transactions to wallet feature', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction codec.
        const mockEncode = jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
        const mockDecode = jest.fn().mockReturnValue({
            messageBytes: new Uint8Array([1, 2, 3]),
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
            blockhash: 'test-blockhash' as string,
            lastValidBlockHeight: 100n,
        } as Awaited<ReturnType<typeof getTransactionLifetimeConstraintFromCompiledTransactionMessage>>);

        // And a mock wallet feature that returns a signed transaction.
        const mockFeature = {
            signTransaction: jest.fn().mockResolvedValue([{ signedTransaction: new Uint8Array([1, 2, 3]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a signer and call modifyAndSignTransactions.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');
        const tx = {} as Parameters<typeof signer.modifyAndSignTransactions>[0][0];
        await signer.modifyAndSignTransactions([tx]);

        // Then the wallet feature's signTransaction method is called.
        expect(mockFeature.signTransaction).toHaveBeenCalled();
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
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the wallet error is propagated.
        await expect(
            signer.modifyAndSignTransactions([{} as Parameters<typeof signer.modifyAndSignTransactions>[0][0]]),
        ).rejects.toThrow('fail');
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
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');
        const lifetimeConstraint = { blockhash: 'abc', lastValidBlockHeight: 123n };
        const tx = {
            lifetimeConstraint,
            messageBytes,
            signatures: {},
        } as unknown as Parameters<typeof signer.modifyAndSignTransactions>[0][0];

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
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');
        const lifetimeConstraint = { blockhash: 'abc', lastValidBlockHeight: 123n };
        const tx = {
            lifetimeConstraint,
            messageBytes: inputMessageBytes,
            signatures: {},
        } as unknown as Parameters<typeof signer.modifyAndSignTransactions>[0][0];

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

        const newLifetimeConstraint = { blockhash: 'def', lastValidBlockHeight: 456n };
        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage).mockResolvedValue(
            newLifetimeConstraint as Awaited<
                ReturnType<typeof getTransactionLifetimeConstraintFromCompiledTransactionMessage>
            >,
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
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');
        const tx = {
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as Parameters<typeof signer.modifyAndSignTransactions>[0][0];

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

        const newLifetimeConstraint = { blockhash: 'def', lastValidBlockHeight: 456n };
        jest.mocked(getTransactionLifetimeConstraintFromCompiledTransactionMessage).mockResolvedValue(
            newLifetimeConstraint as Awaited<
                ReturnType<typeof getTransactionLifetimeConstraintFromCompiledTransactionMessage>
            >,
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
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');
        const inputLifetimeConstraint = { blockhash: 'abc', lastValidBlockHeight: 123n };
        const tx = {
            lifetimeConstraint: inputLifetimeConstraint,
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as Parameters<typeof signer.modifyAndSignTransactions>[0][0];

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
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');
        const tx = {
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as Parameters<typeof signer.modifyAndSignTransactions>[0][0];

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
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');
        const lifetimeConstraint = { blockhash: 'abc', lastValidBlockHeight: 123n };
        const tx = {
            lifetimeConstraint,
            messageBytes: new Uint8Array([1, 2, 3]) as unknown as TransactionMessageBytes,
            signatures: {},
        } as unknown as Parameters<typeof signer.modifyAndSignTransactions>[0][0];

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
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');
        const tx = {
            messageBytes: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as unknown as Parameters<typeof signer.modifyAndSignTransactions>[0][0];

        // And we call modifyAndSignTransactions with an already aborted signal.
        const abortController = new AbortController();
        abortController.abort(new Error('o no'));
        const alreadyAbortedSignal = abortController.signal;

        // Then it rejects with the abort error.
        await expect(
            signer.modifyAndSignTransactions([tx], { abortSignal: alreadyAbortedSignal }),
        ).rejects.toThrow(new Error('o no'));
    });
});
