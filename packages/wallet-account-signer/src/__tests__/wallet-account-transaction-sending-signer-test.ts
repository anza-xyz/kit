import { address } from '@solana/addresses';
import { TransactionSendingSigner } from '@solana/signers';
import { getTransactionEncoder } from '@solana/transactions';
import { SolanaSignAndSendTransaction } from '@solana/wallet-standard-features';
import { WalletStandardError } from '@wallet-standard/errors';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';

import { createTransactionSendingSignerFromWalletAccount } from '../wallet-account-transaction-sending-signer';

jest.mock('@wallet-standard/ui');
jest.mock('@wallet-standard/ui-registry');
jest.mock('@solana/transactions');

type InputTransaction = Parameters<TransactionSendingSigner['signAndSendTransactions']>[0][number];

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
        const fn = () => createTransactionSendingSignerFromWalletAccount(account, 'solana:mainnet');

        // Then we expect an error to be thrown.
        expect(fn).toThrow(WalletStandardError);
    });

    it('exposes the correct address', () => {
        // Given a wallet account with a known address.
        const account = createMockAccount();

        // When we create a sending signer from the account.
        const signer = createTransactionSendingSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer exposes the same address.
        expect(signer.address).toBe(mockAddress);
    });

    it('returns empty array when no transactions provided', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // When we create a sending signer and call signAndSendTransactions with an empty array.
        const signer = createTransactionSendingSignerFromWalletAccount(account, 'solana:devnet');

        // Then it returns an empty array.
        await expect(signer.signAndSendTransactions([])).resolves.toEqual([]);
    });

    it('handles multiple transactions', async () => {
        expect.assertions(2);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction encoder.
        const mockEncodedTransaction1 = new Uint8Array([1, 2, 3]);
        const mockEncodedTransaction2 = new Uint8Array([4, 5, 6]);
        const mockEncode = jest
            .fn()
            .mockReturnValueOnce(mockEncodedTransaction1)
            .mockReturnValueOnce(mockEncodedTransaction2);

        jest.mocked(getTransactionEncoder).mockReturnValue({
            encode: mockEncode,
        } as unknown as ReturnType<typeof getTransactionEncoder>);

        // And a mock wallet feature that returns signatures for all transactions at once.
        const mockFeature = {
            signAndSendTransaction: jest
                .fn()
                .mockResolvedValue([{ signature: new Uint8Array([9]) }, { signature: new Uint8Array([10]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);

        const mockWalletAccount = { mockWallet: 1 } as unknown as ReturnType<
            typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        >;
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            mockWalletAccount,
        );

        // When we create a sending signer and call signAndSendTransactions with multiple transactions.
        const signer = createTransactionSendingSignerFromWalletAccount(account, 'solana:devnet');

        const tx1 = {} as InputTransaction;
        const tx2 = {} as InputTransaction;

        const result = await signer.signAndSendTransactions([tx1, tx2]);

        // Then the wallet feature is called once with all transactions.
        expect(mockFeature.signAndSendTransaction).toHaveBeenCalledWith(
            { account: mockWalletAccount, chain: 'solana:devnet', transaction: mockEncodedTransaction1 },
            { account: mockWalletAccount, chain: 'solana:devnet', transaction: mockEncodedTransaction2 },
        );

        // And the result contains both signatures.
        expect(result).toHaveLength(2);
    });

    it('encodes transaction and forwards to wallet feature', async () => {
        expect.assertions(2);

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
        const signer = createTransactionSendingSignerFromWalletAccount(account, 'solana:devnet');

        const tx = {} as InputTransaction;

        await signer.signAndSendTransactions([tx]);

        // Then the transaction is encoded and forwarded to the wallet feature.
        expect(mockEncode).toHaveBeenCalledWith(tx);
        expect(mockFeature.signAndSendTransaction).toHaveBeenCalled();
    });

    it('returns the correct signatures from wallet', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction encoder.
        jest.mocked(getTransactionEncoder).mockReturnValue({
            encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        } as unknown as ReturnType<typeof getTransactionEncoder>);

        // And a mock wallet feature that returns specific signatures.
        const expectedSignature = new Uint8Array([1, 2, 3, 4, 5]);
        const mockFeature = {
            signAndSendTransaction: jest.fn().mockResolvedValue([{ signature: expectedSignature }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a sending signer and call signAndSendTransactions.
        const signer = createTransactionSendingSignerFromWalletAccount(account, 'solana:devnet');
        const tx = {} as InputTransaction;

        const result = await signer.signAndSendTransactions([tx]);

        // Then the returned signature matches what the wallet returned.
        expect(result).toEqual([expectedSignature]);
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
        const signer = createTransactionSendingSignerFromWalletAccount(account, 'solana:devnet');

        // Then the wallet error is propagated.
        await expect(signer.signAndSendTransactions([{} as InputTransaction])).rejects.toThrow('fail');
    });

    it('passes minContextSlot option to wallet feature', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction encoder.
        jest.mocked(getTransactionEncoder).mockReturnValue({
            encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        } as unknown as ReturnType<typeof getTransactionEncoder>);

        // And a mock wallet feature.
        const mockFeature = {
            signAndSendTransaction: jest.fn().mockResolvedValue([{ signature: new Uint8Array([9]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a sending signer and call signAndSendTransactions with options.
        const signer = createTransactionSendingSignerFromWalletAccount(account, 'solana:devnet');
        const tx = {} as InputTransaction;

        await signer.signAndSendTransactions([tx], {
            abortSignal: AbortSignal.timeout(1_000_000),
            minContextSlot: 123n,
        });

        // Then the minContextSlot is passed to the wallet feature (converted to number).
        expect(mockFeature.signAndSendTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                options: { minContextSlot: 123 },
            }),
        );
    });

    it('rejects when aborted', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock transaction encoder.
        jest.mocked(getTransactionEncoder).mockReturnValue({
            encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
        } as unknown as ReturnType<typeof getTransactionEncoder>);

        // And a mock wallet feature.
        const mockFeature = {
            signAndSendTransaction: jest.fn().mockResolvedValue([{ signature: new Uint8Array([9]) }]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
        );

        // When we create a sending signer.
        const signer = createTransactionSendingSignerFromWalletAccount(account, 'solana:devnet');
        const tx = {} as InputTransaction;

        // And we call signAndSendTransactions with an already aborted signal.
        const abortController = new AbortController();
        abortController.abort(new Error('o no'));
        const alreadyAbortedSignal = abortController.signal;

        // Then it rejects with the abort error.
        await expect(signer.signAndSendTransactions([tx], { abortSignal: alreadyAbortedSignal })).rejects.toThrow(
            new Error('o no'),
        );
    });
});
