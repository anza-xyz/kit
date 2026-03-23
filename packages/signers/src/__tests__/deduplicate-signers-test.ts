import { Address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS, SolanaError } from '@solana/errors';

import { deduplicateSigners } from '../deduplicate-signers';
import { createNoopSigner } from '../noop-signer';
import {
    createMockMessagePartialSigner,
    createMockTransactionModifyingSigner,
    createMockTransactionPartialSigner,
    createMockTransactionSendingSigner,
} from './__setup__';

describe('deduplicateSigners', () => {
    it('removes duplicated signers by address', () => {
        // Given two signers A and B.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockMessagePartialSigner('2222' as Address);

        // And an array of them with some duplicates.
        const signers = [signerA, signerB, signerA, signerA, signerB, signerB];

        // When we deduplicate them.
        const deduplicatedSigners = deduplicateSigners(signers);

        // Then we expect only two signers to remain: one for Signer A and one for Signer B.
        expect(deduplicatedSigners).toHaveLength(2);
        expect(deduplicatedSigners.map(signer => signer.address).sort()).toStrictEqual(['1111', '2222']);
    });

    it('fails to duplicated disctint signers for the same address', () => {
        // Given a list of signers with some distinct duplicates for the same address.
        const addressA = '1111' as Address;
        const addressB = '2222' as Address;
        const signers = [
            createMockTransactionPartialSigner(addressA),
            createMockMessagePartialSigner(addressB),
            createMockTransactionModifyingSigner(addressA),
            createMockTransactionSendingSigner(addressA),
        ];

        // When we try deduplicate them.
        const fn = () => deduplicateSigners(signers);

        // Then we expect an error to be thrown.
        expect(fn).toThrow(
            new SolanaError(SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS, {
                address: addressA,
            }),
        );
    });

    it('deduplicates equivalent noop signers with the same address', () => {
        // Given two separately created noop signers for the same address.
        const addressA = '1111' as Address;
        const noopSignerA = createNoopSigner(addressA);
        const noopSignerB = createNoopSigner(addressA);

        // When we deduplicate them.
        const deduplicatedSigners = deduplicateSigners([noopSignerA, noopSignerB]);

        // Then we expect only one signer to remain and it should be the first one.
        expect(deduplicatedSigners).toHaveLength(1);
        expect(deduplicatedSigners[0]).toBe(noopSignerA);
    });

    it('fails when a noop signer and a real signer share the same address', () => {
        // Given a noop signer and a real signer for the same address.
        const addressA = '1111' as Address;
        const signers = [createNoopSigner(addressA), createMockTransactionPartialSigner(addressA)];

        // When we try deduplicate them.
        const fn = () => deduplicateSigners(signers);

        // Then we expect an error to be thrown.
        expect(fn).toThrow(
            new SolanaError(SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS, {
                address: addressA,
            }),
        );
    });

    it('filters signers without cloning them', () => {
        // Given a list of signers with no duplicates.
        const signerA = createMockTransactionPartialSigner('1111' as Address);
        const signerB = createMockMessagePartialSigner('2222' as Address);
        const signers = [signerA, signerB];

        // When we deduplicate them.
        const deduplicatedSigners = deduplicateSigners(signers);

        // Then we expect the exact same signer objects to remain.
        expect(deduplicatedSigners).toHaveLength(2);
        expect(deduplicatedSigners[0]).toBe(signerA);
        expect(deduplicatedSigners[1]).toBe(signerB);
    });
});
