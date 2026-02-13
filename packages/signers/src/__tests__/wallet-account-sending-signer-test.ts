import { address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED, SolanaError } from '@solana/errors';
import { getTransactionEncoder } from '@solana/transactions';
import { SolanaSignAndSendTransaction } from '@solana/wallet-standard-features';
import { WalletStandardError } from '@wallet-standard/errors';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';

import { createSendingSignerFromWalletAccount } from '../wallet-account-sending-signer';

jest.mock('@wallet-standard/ui');
jest.mock('@wallet-standard/ui-registry');
jest.mock('@solana/transactions');

describe('createSendingSignerFromWalletAccount', () => {
    const mockAddress = address('Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy');

    function createMockAccount(overrides: Partial<UiWalletAccount> = {}): UiWalletAccount {
        return {
            address: mockAddress,
            chains: ['solana:devnet'],
            features: [SolanaSignAndSendTransaction],
            ...overrides,
        } as unknown as UiWalletAccount;
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('throws if chain is unsupported', () => {
        // Given a wallet account that only supports devnet.
        const account = createMockAccount({ chains: ['solana:devnet'] });

        // When we try to create a sending signer for mainnet.
        const fn = () => createSendingSignerFromWalletAccount(account, 'solana:mainnet');

        // Then we expect an error to be thrown.
        expect(fn).toThrow(WalletStandardError);
    });

    it('exposes the correct address', () => {
        // Given a wallet account with a known address.
        const account = createMockAccount();

        // When we create a sending signer from the account.
        const signer = createSendingSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer exposes the same address.
        expect(signer.address).toBe(mockAddress);
    });

    it('returns empty array when no transactions provided', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // When we create a sending signer and call signAndSendTransactions with an empty array.
        const signer = createSendingSignerFromWalletAccount(account, 'solana:devnet');

        // Then it returns an empty array.
        await expect(signer.signAndSendTransactions([])).resolves.toEqual([]);
    });

    it('throws on multiple transactions', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // When we create a sending signer and try to sign and send multiple transactions.
        const signer = createSendingSignerFromWalletAccount(account, 'solana:devnet');

        // Then we expect an error to be thrown.
        await expect(
            signer.signAndSendTransactions([
                {} as Parameters<typeof signer.signAndSendTransactions>[0][0],
                {} as Parameters<typeof signer.signAndSendTransactions>[0][0],
            ]),
        ).rejects.toThrow(new SolanaError(SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED));
    });

    it('encodes transaction and forwards to wallet feature', async () => {
        expect.assertions(4);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction encoder.
        const mockEncode = jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]));

        jest.mocked(getTransactionEncoder).mockReturnValue({
            encode: mockEncode,
        } as unknown as ReturnType<typeof getTransactionEncoder>);

        // And a mock wallet feature that returns a signed transaction.
        const mockFeature = {
            signAndSendTransaction: jest.fn().mockResolvedValue([{ signature: new Uint8Array([9]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a sending signer and call signAndSendTransactions.
        const signer = createSendingSignerFromWalletAccount(account, 'solana:devnet');

        const tx = {} as Parameters<typeof signer.signAndSendTransactions>[0][0];

        const result = await signer.signAndSendTransactions([tx]);

        // Then the transaction is encoded and forwarded to the wallet feature.
        expect(mockEncode).toHaveBeenCalledWith(tx);
        expect(mockFeature.signAndSendTransaction).toHaveBeenCalled();

        // And the result is frozen.
        expect(result).toHaveLength(1);
        expect(Object.isFrozen(result)).toBe(true);
    });

    it('throws if wallet returns unexpected number of outputs', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction encoder.
        jest.mocked(getTransactionEncoder).mockReturnValue({
            encode: jest.fn().mockReturnValue(new Uint8Array([1])),
        } as unknown as ReturnType<typeof getTransactionEncoder>);

        // And a mock wallet feature that returns an empty array.
        const mockFeature = {
            signAndSendTransaction: jest.fn().mockResolvedValue([]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a sending signer and call signAndSendTransactions.
        const signer = createSendingSignerFromWalletAccount(account, 'solana:devnet');

        // Then we expect an error to be thrown.
        await expect(
            signer.signAndSendTransactions([{} as Parameters<typeof signer.signAndSendTransactions>[0][0]]),
        ).rejects.toThrow(new SolanaError(SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED));
    });

    it('propagates wallet errors', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction encoder.
        jest.mocked(getTransactionEncoder).mockReturnValue({
            encode: jest.fn().mockReturnValue(new Uint8Array([1])),
        } as unknown as ReturnType<typeof getTransactionEncoder>);

        // And a mock wallet feature that rejects with an error.
        const mockFeature = {
            signAndSendTransaction: jest.fn().mockRejectedValue(new Error('fail')),
        };
        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a sending signer and call signAndSendTransactions.
        const signer = createSendingSignerFromWalletAccount(account, 'solana:devnet');

        // Then the wallet error is propagated.
        await expect(
            signer.signAndSendTransactions([{} as Parameters<typeof signer.signAndSendTransactions>[0][0]]),
        ).rejects.toThrow('fail');
    });
});
