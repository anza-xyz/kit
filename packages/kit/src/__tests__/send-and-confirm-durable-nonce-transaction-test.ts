import { Address } from '@solana/addresses';
import { SOLANA_ERROR__INVALID_NONCE, SolanaError } from '@solana/errors';
import { SignatureBytes } from '@solana/keys';
import type { GetAccountInfoApi, GetSignatureStatusesApi, Rpc, SendTransactionApi } from '@solana/rpc';
import type { AccountNotificationsApi, RpcSubscriptions, SignatureNotificationsApi } from '@solana/rpc-subscriptions';
import {
    createNonceInvalidationPromiseFactory,
    createRecentSignatureConfirmationPromiseFactory,
} from '@solana/transaction-confirmation';
import { Nonce } from '@solana/transaction-messages';
import { SendableTransaction, Transaction, TransactionWithDurableNonceLifetime } from '@solana/transactions';

import { sendAndConfirmDurableNonceTransactionFactory } from '../send-and-confirm-durable-nonce-transaction';

// Partially mock the transaction-confirmation module - keep the real waitForDurableNonceTransactionConfirmation
jest.mock('@solana/transaction-confirmation', () => ({
    ...jest.requireActual('@solana/transaction-confirmation'),
    createNonceInvalidationPromiseFactory: jest.fn(),
    createRecentSignatureConfirmationPromiseFactory: jest.fn(),
}));

jest.mock('@solana/transactions', () => ({
    ...jest.requireActual('@solana/transactions'),
    getBase64EncodedWireTransaction: jest.fn().mockReturnValue('MOCK_WIRE_TRANSACTION'),
}));

const FOREVER_PROMISE = new Promise(() => {
    /* never resolve */
});

const DELAYED_SIGNATURE_INTERVAL = 1000;

describe('sendAndConfirmDurableNonceTransactionFactory', () => {
    const MOCK_DURABLE_NONCE_TRANSACTION = {
        lifetimeConstraint: { nonce: 'abc' as Nonce },
        signatures: {
            ['1234' as Address]: new Uint8Array() as SignatureBytes,
        },
    } as SendableTransaction & Transaction & TransactionWithDurableNonceLifetime;

    let mockGetNonceInvalidationPromise: jest.Mock;
    let mockGetRecentSignatureConfirmationPromise: jest.Mock;
    let getSignatureStatusesMock: jest.Mock;
    let sendTransactionMock: jest.Mock;
    let rpc: Rpc<GetAccountInfoApi & GetSignatureStatusesApi & SendTransactionApi>;
    let rpcSubscriptions: RpcSubscriptions<AccountNotificationsApi & SignatureNotificationsApi>;

    beforeEach(() => {
        jest.useFakeTimers();

        // Setup mock for nonce invalidation promise factory
        mockGetNonceInvalidationPromise = jest.fn();
        jest.mocked(createNonceInvalidationPromiseFactory).mockReturnValue(mockGetNonceInvalidationPromise);

        // Setup mock for signature confirmation promise factory
        mockGetRecentSignatureConfirmationPromise = jest.fn().mockReturnValue(FOREVER_PROMISE);
        jest.mocked(createRecentSignatureConfirmationPromiseFactory).mockReturnValue(
            mockGetRecentSignatureConfirmationPromise,
        );

        // Mock RPC methods
        getSignatureStatusesMock = jest.fn();
        sendTransactionMock = jest.fn();

        rpc = {
            getAccountInfo: jest.fn().mockReturnValue({ send: jest.fn() }),
            getSignatureStatuses: jest.fn().mockReturnValue({ send: getSignatureStatusesMock }),
            sendTransaction: jest.fn().mockReturnValue({ send: sendTransactionMock }),
        } as unknown as Rpc<GetAccountInfoApi & GetSignatureStatusesApi & SendTransactionApi>;

        rpcSubscriptions = {} as unknown as RpcSubscriptions<AccountNotificationsApi & SignatureNotificationsApi>;
    });

    describe('race condition handling', () => {
        it('resolves when nonce invalidation rejects but transaction exists with sufficient commitment', async () => {
            expect.assertions(1);

            // Setup: nonce invalidation throws INVALID_NONCE
            mockGetNonceInvalidationPromise.mockRejectedValue(
                new SolanaError(SOLANA_ERROR__INVALID_NONCE, {
                    actualNonceValue: 'xyz',
                    expectedNonceValue: 'abc',
                }),
            );

            // Setup: getSignatureStatuses shows transaction exists with finalized commitment
            getSignatureStatusesMock.mockResolvedValue({
                value: [
                    {
                        confirmationStatus: 'finalized',
                        err: null,
                    },
                ],
            });

            const sendAndConfirm = sendAndConfirmDurableNonceTransactionFactory({
                rpc,
                rpcSubscriptions,
            });

            const resultPromise = sendAndConfirm(MOCK_DURABLE_NONCE_TRANSACTION, {
                commitment: 'finalized',
            });

            await jest.runAllTimersAsync();

            // Should resolve without throwing because tx exists with sufficient commitment
            await expect(resultPromise).resolves.toBeUndefined();
        });

        it('continues waiting for signature confirmation when transaction exists but commitment not met', async () => {
            expect.assertions(2);

            // Setup: nonce invalidation throws INVALID_NONCE
            mockGetNonceInvalidationPromise.mockRejectedValue(
                new SolanaError(SOLANA_ERROR__INVALID_NONCE, {
                    actualNonceValue: 'xyz',
                    expectedNonceValue: 'abc',
                }),
            );

            // Setup: getSignatureStatuses shows transaction exists but only 'confirmed' (not 'finalized')
            getSignatureStatusesMock.mockResolvedValue({
                value: [
                    {
                        confirmationStatus: 'confirmed',
                        err: null,
                    },
                ],
            });

            // Setup: signature confirmation resolves AFTER nonce invalidation rejects
            // Using a delayed promise to ensure proper ordering
            mockGetRecentSignatureConfirmationPromise.mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, DELAYED_SIGNATURE_INTERVAL)),
            );

            const sendAndConfirm = sendAndConfirmDurableNonceTransactionFactory({
                rpc,
                rpcSubscriptions,
            });

            const resultPromise = sendAndConfirm(MOCK_DURABLE_NONCE_TRANSACTION, {
                commitment: 'finalized',
            });

            // First, let the nonce invalidation reject and our wrapper check getSignatureStatuses
            await jest.advanceTimersByTimeAsync(0);

            // Verify getSignatureStatuses was called to check tx status
            expect(rpc.getSignatureStatuses).toHaveBeenCalled();

            // Now advance time to let signature confirmation resolve
            await jest.advanceTimersByTimeAsync(DELAYED_SIGNATURE_INTERVAL);

            // Should resolve when signature confirmation completes
            await expect(resultPromise).resolves.toBeUndefined();
        });

        it('throws INVALID_NONCE when nonce invalidation rejects and transaction does not exist', async () => {
            expect.assertions(1);

            // Setup: nonce invalidation throws INVALID_NONCE
            const invalidNonceError = new SolanaError(SOLANA_ERROR__INVALID_NONCE, {
                actualNonceValue: 'xyz',
                expectedNonceValue: 'abc',
            });
            mockGetNonceInvalidationPromise.mockRejectedValue(invalidNonceError);

            // Setup: getSignatureStatuses returns null (transaction doesn't exist)
            getSignatureStatusesMock.mockResolvedValue({
                value: [null],
            });

            const sendAndConfirm = sendAndConfirmDurableNonceTransactionFactory({
                rpc,
                rpcSubscriptions,
            });

            // Should throw INVALID_NONCE because transaction doesn't exist
            await expect(
                sendAndConfirm(MOCK_DURABLE_NONCE_TRANSACTION, {
                    commitment: 'finalized',
                }),
            ).rejects.toThrow(invalidNonceError);
        });

        it('throws transaction error when transaction exists but failed on-chain', async () => {
            expect.assertions(1);

            // Setup: nonce invalidation throws INVALID_NONCE
            mockGetNonceInvalidationPromise.mockRejectedValue(
                new SolanaError(SOLANA_ERROR__INVALID_NONCE, {
                    actualNonceValue: 'xyz',
                    expectedNonceValue: 'abc',
                }),
            );

            // Setup: getSignatureStatuses shows transaction exists but has error
            getSignatureStatusesMock.mockResolvedValue({
                value: [
                    {
                        confirmationStatus: 'finalized',
                        err: { InstructionError: [0, 'InvalidAccountData'] },
                    },
                ],
            });

            const sendAndConfirm = sendAndConfirmDurableNonceTransactionFactory({
                rpc,
                rpcSubscriptions,
            });

            // Should throw the transaction error (not INVALID_NONCE)
            await expect(
                sendAndConfirm(MOCK_DURABLE_NONCE_TRANSACTION, {
                    commitment: 'finalized',
                }),
            ).rejects.toThrow(SolanaError);
        });

        it('does not throw when transaction exists with an error at an earlier commitment', async () => {
            expect.assertions(2);

            // Setup: nonce invalidation throws INVALID_NONCE
            mockGetNonceInvalidationPromise.mockRejectedValue(
                new SolanaError(SOLANA_ERROR__INVALID_NONCE, {
                    actualNonceValue: 'xyz',
                    expectedNonceValue: 'abc',
                }),
            );

            // Setup: getSignatureStatuses shows transaction exists and has an error, but only 'confirmed' (not 'finalized')
            getSignatureStatusesMock.mockResolvedValue({
                value: [
                    {
                        confirmationStatus: 'processed',
                        err: { InstructionError: [0, 'InvalidAccountData'] },
                    },
                ],
            });

            // Setup: signature confirmation resolves (without an error) AFTER nonce invalidation rejects
            // Using a delayed promise to ensure proper ordering
            mockGetRecentSignatureConfirmationPromise.mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, DELAYED_SIGNATURE_INTERVAL)),
            );

            const sendAndConfirm = sendAndConfirmDurableNonceTransactionFactory({
                rpc,
                rpcSubscriptions,
            });

            const resultPromise = sendAndConfirm(MOCK_DURABLE_NONCE_TRANSACTION, {
                commitment: 'finalized',
            });

            // First, let the nonce invalidation reject and our wrapper check getSignatureStatuses
            await jest.advanceTimersByTimeAsync(0);

            // Verify getSignatureStatuses was called to check tx status
            expect(rpc.getSignatureStatuses).toHaveBeenCalled();

            // Now advance time to let signature confirmation resolve
            await jest.advanceTimersByTimeAsync(DELAYED_SIGNATURE_INTERVAL);

            // Should resolve when signature confirmation completes
            await expect(resultPromise).resolves.toBeUndefined();
        });
    });
});
