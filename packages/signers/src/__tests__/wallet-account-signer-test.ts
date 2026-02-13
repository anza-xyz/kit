import { address } from '@solana/addresses';
import { getCompiledTransactionMessageDecoder } from '@solana/transaction-messages';
import {
    assertIsTransactionWithinSizeLimit,
    getTransactionCodec,
    getTransactionLifetimeConstraintFromCompiledTransactionMessage,
} from '@solana/transactions';
import { SolanaSignTransaction, SolanaSignTransactionFeature } from '@solana/wallet-standard-features';
import { WalletStandardError } from '@wallet-standard/errors';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';

import { createSignerFromWalletAccount } from '../wallet-account-signer';

jest.mock('@wallet-standard/ui');
jest.mock('@wallet-standard/ui-registry');
jest.mock('@solana/transactions');
jest.mock('@solana/transaction-messages');

describe('createSignerFromWalletAccount', () => {
    const mockAddress = address('Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy');

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
});
