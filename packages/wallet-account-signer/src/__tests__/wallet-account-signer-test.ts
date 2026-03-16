import { address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__WALLET_ACCOUNT_CANNOT_SIGN_TRANSACTION, SolanaError } from '@solana/errors';
import {
    SolanaSignAndSendTransaction,
    SolanaSignMessage,
    SolanaSignTransaction,
} from '@solana/wallet-standard-features';
import { WalletStandardError } from '@wallet-standard/errors';
import { UiWalletAccount } from '@wallet-standard/ui';

import { createMessageSignerFromWalletAccount } from '../wallet-account-message-signer';
import { createSignerFromWalletAccount } from '../wallet-account-signer';
import { createTransactionSendingSignerFromWalletAccount } from '../wallet-account-transaction-sending-signer';
import { createTransactionSignerFromWalletAccount } from '../wallet-account-transaction-signer';

jest.mock('../wallet-account-transaction-signer');
jest.mock('../wallet-account-transaction-sending-signer');
jest.mock('../wallet-account-message-signer');

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

    const mockModifyAndSignTransactions = jest.fn();
    const mockSignAndSendTransactions = jest.fn();
    const mockModifyAndSignMessages = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        jest.mocked(createTransactionSignerFromWalletAccount).mockReturnValue({
            address: mockAddress,
            modifyAndSignTransactions: mockModifyAndSignTransactions,
        });

        jest.mocked(createTransactionSendingSignerFromWalletAccount).mockReturnValue({
            address: mockAddress,
            signAndSendTransactions: mockSignAndSendTransactions,
        });

        jest.mocked(createMessageSignerFromWalletAccount).mockReturnValue({
            address: mockAddress,
            modifyAndSignMessages: mockModifyAndSignMessages,
        });
    });

    it('throws if chain is unsupported', () => {
        // Given a wallet account that only supports devnet.
        const account = createMockAccount({ chains: ['solana:devnet'] });

        // When we try to create a signer for mainnet.
        const fn = () => createSignerFromWalletAccount(account, 'solana:mainnet');

        // Then we expect an error to be thrown.
        expect(fn).toThrow(WalletStandardError);
    });

    it('throws if neither signTransaction nor signAndSendTransaction feature is available', () => {
        // Given a wallet account that only supports message signing.
        const account = createMockAccount({ features: [SolanaSignMessage] });

        // When we try to create a signer.
        const fn = () => createSignerFromWalletAccount(account, 'solana:devnet');

        // Then we expect a SolanaError to be thrown (not a wallet-standard error).
        expect(fn).toThrow(
            new SolanaError(SOLANA_ERROR__SIGNER__WALLET_ACCOUNT_CANNOT_SIGN_TRANSACTION, {
                address: account.address,
                supportedFeatures: account.features as string[],
            }),
        );
    });

    it('exposes the correct address', () => {
        // Given a wallet account with a known address.
        const account = createMockAccount();

        // When we create a signer from the account.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer exposes the same address.
        expect(signer.address).toBe(mockAddress);
    });

    it('includes modifyAndSignTransactions when signTransaction feature is available', () => {
        // Given a wallet account with the signTransaction feature.
        const account = createMockAccount({ features: [SolanaSignTransaction] });

        // When we create a signer.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer has modifyAndSignTransactions.
        expect('modifyAndSignTransactions' in signer).toBe(true);
    });

    it('does not include modifyAndSignTransactions when signTransaction feature is absent', () => {
        // Given a wallet account without the signTransaction feature.
        const account = createMockAccount({ features: [SolanaSignAndSendTransaction] });

        // When we create a signer.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer does not have modifyAndSignTransactions.
        expect('modifyAndSignTransactions' in signer).toBe(false);
    });

    it('includes signAndSendTransactions when signAndSendTransaction feature is available', () => {
        // Given a wallet account with the signAndSendTransaction feature.
        const account = createMockAccount({ features: [SolanaSignAndSendTransaction] });

        // When we create a signer.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer has signAndSendTransactions.
        expect('signAndSendTransactions' in signer).toBe(true);
    });

    it('does not include signAndSendTransactions when signAndSendTransaction feature is absent', () => {
        // Given a wallet account without the signAndSendTransaction feature.
        const account = createMockAccount({ features: [SolanaSignTransaction] });

        // When we create a signer.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer does not have signAndSendTransactions.
        expect('signAndSendTransactions' in signer).toBe(false);
    });

    it('includes modifyAndSignMessages when signMessage feature is available', () => {
        // Given a wallet account with the signMessage feature in addition to a tx feature.
        const account = createMockAccount({ features: [SolanaSignTransaction, SolanaSignMessage] });

        // When we create a signer.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer has modifyAndSignMessages.
        expect('modifyAndSignMessages' in signer).toBe(true);
    });

    it('does not include modifyAndSignMessages when signMessage feature is absent', () => {
        // Given a wallet account without the signMessage feature.
        const account = createMockAccount({ features: [SolanaSignTransaction] });

        // When we create a signer.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer does not have modifyAndSignMessages.
        expect('modifyAndSignMessages' in signer).toBe(false);
    });

    it('includes all three methods when all features are available', () => {
        // Given a wallet account with all three features.
        const account = createMockAccount({
            features: [SolanaSignTransaction, SolanaSignAndSendTransaction, SolanaSignMessage],
        });

        // When we create a signer.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer has all three methods.
        expect('modifyAndSignTransactions' in signer).toBe(true);
        expect('signAndSendTransactions' in signer).toBe(true);
        expect('modifyAndSignMessages' in signer).toBe(true);
    });

    it('uses the method from createTransactionSignerFromWalletAccount', () => {
        // Given a wallet account with the signTransaction feature.
        const account = createMockAccount({ features: [SolanaSignTransaction] });

        // When we create a signer.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the modifyAndSignTransactions method is the one from the delegate.
        expect((signer as { modifyAndSignTransactions: unknown }).modifyAndSignTransactions).toBe(
            mockModifyAndSignTransactions,
        );
    });

    it('uses the method from createTransactionSendingSignerFromWalletAccount', () => {
        // Given a wallet account with the signAndSendTransaction feature.
        const account = createMockAccount({ features: [SolanaSignAndSendTransaction] });

        // When we create a signer.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signAndSendTransactions method is the one from the delegate.
        expect((signer as { signAndSendTransactions: unknown }).signAndSendTransactions).toBe(
            mockSignAndSendTransactions,
        );
    });

    it('uses the method from createMessageSignerFromWalletAccount', () => {
        // Given a wallet account with the signMessage feature.
        const account = createMockAccount({ features: [SolanaSignTransaction, SolanaSignMessage] });

        // When we create a signer.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the modifyAndSignMessages method is the one from the delegate.
        expect((signer as { modifyAndSignMessages: unknown }).modifyAndSignMessages).toBe(mockModifyAndSignMessages);
    });

    it('returns a frozen object', () => {
        // Given a wallet account.
        const account = createMockAccount();

        // When we create a signer.
        const signer = createSignerFromWalletAccount(account, 'solana:devnet');

        // Then the signer is frozen.
        expect(Object.isFrozen(signer)).toBe(true);
    });

    it('passes the chain to createTransactionSignerFromWalletAccount', () => {
        // Given a wallet account on mainnet.
        const account = createMockAccount({ chains: ['solana:mainnet'], features: [SolanaSignTransaction] });

        // When we create a signer for mainnet.
        createSignerFromWalletAccount(account, 'solana:mainnet');

        // Then the chain is forwarded to the delegate.
        expect(createTransactionSignerFromWalletAccount).toHaveBeenCalledWith(account, 'solana:mainnet');
    });

    it('passes the chain to createTransactionSendingSignerFromWalletAccount', () => {
        // Given a wallet account on mainnet.
        const account = createMockAccount({ chains: ['solana:mainnet'], features: [SolanaSignAndSendTransaction] });

        // When we create a signer for mainnet.
        createSignerFromWalletAccount(account, 'solana:mainnet');

        // Then the chain is forwarded to the delegate.
        expect(createTransactionSendingSignerFromWalletAccount).toHaveBeenCalledWith(account, 'solana:mainnet');
    });
});
