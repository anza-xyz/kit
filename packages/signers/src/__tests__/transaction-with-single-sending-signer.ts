import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__SIGNER__TRANSACTION_CANNOT_HAVE_MULTIPLE_SENDING_SIGNERS,
    SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING,
    SolanaError,
} from '@solana/errors';

import {
    assertContainsResolvableTransactionSendingSigner,
    assertIsTransactionMessageWithSingleSendingSigner,
    isTransactionMessageWithSingleSendingSigner,
} from '../transaction-with-single-sending-signer';
import {
    createMockTransactionCompositeSigner,
    createMockTransactionMessageWithSigners,
    createMockTransactionModifyingSigner,
    createMockTransactionPartialSigner,
    createMockTransactionSendingSigner,
} from './__setup__';

describe('isTransactionMessageWithSingleSendingSigner', () => {
    it('returns true if a transaction message contains a single sending only signer', () => {
        // Given a transaction message with a single sending signer.
        const signer = createMockTransactionSendingSigner('2222' as Address);
        const transaction = createMockTransactionMessageWithSigners([signer]);

        // Then we expect it to be a valid `TransactionWithSingleSendingSigner`.
        expect(isTransactionMessageWithSingleSendingSigner(transaction)).toBe(true);
    });

    it('returns true if a transaction message contains multiple sending signer composites', () => {
        // Given a transaction message with two sending signers that can also be used as other signer interfaces.
        const signerA = createMockTransactionCompositeSigner('1111' as Address);
        const signerB = createMockTransactionCompositeSigner('2222' as Address);
        const transaction = createMockTransactionMessageWithSigners([signerA, signerB]);

        // Then we expect it to be a valid `TransactionMessageWithSingleSendingSigner` because we can use
        // one of them as a sending signer and the other as a modifying or partial signer.
        expect(isTransactionMessageWithSingleSendingSigner(transaction)).toBe(true);
    });

    it('returns false if a transaction message contains multiple sending only signers', () => {
        // Given a transaction message with two sending only signers.
        const signerA = createMockTransactionSendingSigner('1111' as Address);
        const signerB = createMockTransactionSendingSigner('2222' as Address);
        const transaction = createMockTransactionMessageWithSigners([signerA, signerB]);

        // Then we expect it not to be a valid `TransactionMessageWithSingleSendingSigner`.
        expect(isTransactionMessageWithSingleSendingSigner(transaction)).toBe(false);
    });

    it('returns false if a transaction message contains no sending signer at all', () => {
        // Given a transaction message with no sending signer.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);
        const transaction = createMockTransactionMessageWithSigners([signerA, signerB]);

        // Then we expect it not to be a valid `TransactionMessageWithSingleSendingSigner`.
        expect(isTransactionMessageWithSingleSendingSigner(transaction)).toBe(false);
    });
});

describe('assertIsTransactionMessageWithSingleSendingSigner', () => {
    it('succeeds if a transaction message contains a single sending only signer', () => {
        // Given a transaction message with a single sending signer.
        const signer = createMockTransactionSendingSigner('2222' as Address);
        const transaction = createMockTransactionMessageWithSigners([signer]);

        // Then we expect the assertion to succeed.
        expect(() => assertIsTransactionMessageWithSingleSendingSigner(transaction)).not.toThrow();
    });

    it('succeeds if a transaction contains multiple sending signer composites', () => {
        // Given a transaction message with two sending signers that can also be used as other signer interfaces.
        const signerA = createMockTransactionCompositeSigner('1111' as Address);
        const signerB = createMockTransactionCompositeSigner('2222' as Address);
        const transaction = createMockTransactionMessageWithSigners([signerA, signerB]);

        // Then we expect the assertion to succeed because we can use one of them
        // as a sending signer and the other as a modifying or partial signer.
        expect(() => assertIsTransactionMessageWithSingleSendingSigner(transaction)).not.toThrow();
    });

    it('fails if a transaction message contains multiple sending only signers', () => {
        // Given a transaction message with a two sending only signers.
        const signerA = createMockTransactionSendingSigner('1111' as Address);
        const signerB = createMockTransactionSendingSigner('2222' as Address);
        const transaction = createMockTransactionMessageWithSigners([signerA, signerB]);

        // Then we expect the assertion to fail.
        expect(() => assertIsTransactionMessageWithSingleSendingSigner(transaction)).toThrow(
            new SolanaError(SOLANA_ERROR__SIGNER__TRANSACTION_CANNOT_HAVE_MULTIPLE_SENDING_SIGNERS),
        );
    });

    it('fails if a transaction message contains no sending signer at all', () => {
        // Given a transaction message with no sending signer.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);
        const transaction = createMockTransactionMessageWithSigners([signerA, signerB]);

        // Then we expect the assertion to fail.
        expect(() => assertIsTransactionMessageWithSingleSendingSigner(transaction)).toThrow(
            new SolanaError(SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING),
        );
    });
});

describe('assertContainsResolvableTransactionSendingSigner', () => {
    it('succeeds if the signers contain a single sending only signer', () => {
        // Given a single sending signer.
        const signer = createMockTransactionSendingSigner('1111' as Address);

        // Then we expect the assertion to succeed.
        expect(() => assertContainsResolvableTransactionSendingSigner([signer])).not.toThrow();
    });

    it('succeeds if the signers contain multiple sending signer composites', () => {
        // Given two sending signers that can also be used as other signer interfaces.
        const signerA = createMockTransactionCompositeSigner('1111' as Address);
        const signerB = createMockTransactionCompositeSigner('2222' as Address);

        // Then we expect the assertion to succeed because we can use one of them
        // as a sending signer and the other as a modifying or partial signer.
        expect(() => assertContainsResolvableTransactionSendingSigner([signerA, signerB])).not.toThrow();
    });

    it('fails if the signers contain multiple sending only signers', () => {
        // Given two sending only signers.
        const signerA = createMockTransactionSendingSigner('1111' as Address);
        const signerB = createMockTransactionSendingSigner('2222' as Address);

        // Then we expect the assertion to fail.
        expect(() => assertContainsResolvableTransactionSendingSigner([signerA, signerB])).toThrow(
            new SolanaError(SOLANA_ERROR__SIGNER__TRANSACTION_CANNOT_HAVE_MULTIPLE_SENDING_SIGNERS),
        );
    });

    it('fails if the signers contain no sending signer at all', () => {
        // Given only partial and modifying signers.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockTransactionModifyingSigner('2222' as Address);

        // Then we expect the assertion to fail.
        expect(() => assertContainsResolvableTransactionSendingSigner([signerA, signerB])).toThrow(
            new SolanaError(SOLANA_ERROR__SIGNER__TRANSACTION_SENDING_SIGNER_MISSING),
        );
    });
});
