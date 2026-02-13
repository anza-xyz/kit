import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS,
    SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_SIGNATURES,
    SolanaError,
} from '@solana/errors';
import { SignatureBytes } from '@solana/keys';

import { SignaturesMap } from '../../transaction';
import { getSignaturesEncoderWithLength, getSignaturesEncoderWithSizePrefix } from '../signatures-encoder';

describe('getSignaturesEncoderWithSizePrefix', () => {
    const encoder = getSignaturesEncoderWithSizePrefix();

    it('should throw if the signatures map is empty', () => {
        const signatures: SignaturesMap = {};
        expect(() => encoder.encode(signatures)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_SIGNATURES),
        );
    });

    describe('when the signatures map contains one entry', () => {
        const address = 'abc' as Address;

        it('should return the bytes of a single signature if it is defined', () => {
            const signature = new Uint8Array(64).fill(1) as SignatureBytes;
            const signatures: SignaturesMap = { [address]: signature };
            const encoded = encoder.encode(signatures);

            expect(encoded).toStrictEqual(
                new Uint8Array([
                    /* length of signatures */
                    1,
                    /* signature */
                    ...signature,
                ]),
            );
        });

        it('should return all 0 bytes for the signature if it is not defined', () => {
            const signatures: SignaturesMap = { [address]: null };
            const encoded = encoder.encode(signatures);

            expect(encoded).toStrictEqual(
                new Uint8Array([
                    /* length of signatures */
                    1,
                    /* null signature */
                    ...new Uint8Array(64).fill(0),
                ]),
            );
        });
    });

    describe('when the signatures map contains multiple entries', () => {
        // intentionally out of order
        const address1 = 'fff' as Address;
        const address2 = 'eee' as Address;
        const address3 = 'ddd' as Address;

        const signature1 = new Uint8Array(64).fill(1) as SignatureBytes;
        const signature2 = new Uint8Array(64).fill(2) as SignatureBytes;
        const signature3 = new Uint8Array(64).fill(3) as SignatureBytes;

        it('should return the bytes of multiple signatures if all are defined', () => {
            const signatures: SignaturesMap = {
                [address1]: signature1,
                [address2]: signature2,
                [address3]: signature3,
            };
            const encoded = encoder.encode(signatures);

            expect(encoded).toStrictEqual(
                new Uint8Array([
                    /* length of signatures */
                    3,
                    /* signatures */
                    ...signature1,
                    ...signature2,
                    ...signature3,
                ]),
            );
        });

        it('should return multiple all 0 byte signatures if all are not defined', () => {
            const signatures: SignaturesMap = {
                [address1]: null,
                [address2]: null,
                [address3]: null,
            };
            const encoded = encoder.encode(signatures);

            expect(encoded).toStrictEqual(
                new Uint8Array([
                    /* length of signatures */
                    3,
                    /* signatures */
                    ...new Uint8Array(64).fill(0),
                    ...new Uint8Array(64).fill(0),
                    ...new Uint8Array(64).fill(0),
                ]),
            );
        });

        it('should return a mixture of defined and not defined signatures', () => {
            const signatures: SignaturesMap = {
                [address1]: signature1,
                [address2]: null,
                [address3]: signature3,
            };
            const encoded = encoder.encode(signatures);

            expect(encoded).toStrictEqual(
                new Uint8Array([
                    /* length of signatures */
                    3,
                    /* signatures */
                    ...signature1,
                    ...new Uint8Array(64).fill(0),
                    ...signature3,
                ]),
            );
        });
    });
});

describe('getSignaturesEncoderWithLength', () => {
    it('should throw if the signatures map is empty', () => {
        const signatures: SignaturesMap = {};
        const encoder = getSignaturesEncoderWithLength(1);
        expect(() => encoder.encode(signatures)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__CANNOT_ENCODE_WITH_EMPTY_SIGNATURES),
        );
    });

    describe('when the signatures map contains one entry', () => {
        const address = 'abc' as Address;

        it('should return the bytes of a single signature if it is defined', () => {
            const signature = new Uint8Array(64).fill(1) as SignatureBytes;
            const signatures: SignaturesMap = { [address]: signature };
            const encoder = getSignaturesEncoderWithLength(1);
            const encoded = encoder.encode(signatures);

            expect(encoded).toStrictEqual(
                new Uint8Array([
                    /* no size prefix */
                    /* signature */
                    ...signature,
                ]),
            );
        });

        it('should return all 0 bytes for the signature if it is not defined', () => {
            const signatures: SignaturesMap = { [address]: null };
            const encoder = getSignaturesEncoderWithLength(1);
            const encoded = encoder.encode(signatures);

            expect(encoded).toStrictEqual(
                new Uint8Array([
                    /* no size prefix */
                    /* null signature */
                    ...new Uint8Array(64).fill(0),
                ]),
            );
        });
    });

    describe('when the signatures map contains multiple entries', () => {
        // intentionally out of order
        const address1 = 'fff' as Address;
        const address2 = 'eee' as Address;
        const address3 = 'ddd' as Address;

        const signature1 = new Uint8Array(64).fill(1) as SignatureBytes;
        const signature2 = new Uint8Array(64).fill(2) as SignatureBytes;
        const signature3 = new Uint8Array(64).fill(3) as SignatureBytes;

        it('should return the bytes of multiple signatures if all are defined', () => {
            const signatures: SignaturesMap = {
                [address1]: signature1,
                [address2]: signature2,
                [address3]: signature3,
            };
            const encoder = getSignaturesEncoderWithLength(3);
            const encoded = encoder.encode(signatures);

            expect(encoded).toStrictEqual(
                new Uint8Array([
                    /* no size prefix */
                    /* signatures */
                    ...signature1,
                    ...signature2,
                    ...signature3,
                ]),
            );
        });

        it('should return multiple all 0 byte signatures if all are not defined', () => {
            const signatures: SignaturesMap = {
                [address1]: null,
                [address2]: null,
                [address3]: null,
            };
            const encoder = getSignaturesEncoderWithLength(3);
            const encoded = encoder.encode(signatures);

            expect(encoded).toStrictEqual(
                new Uint8Array([
                    /* no size prefix */
                    /* signatures */
                    ...new Uint8Array(64).fill(0),
                    ...new Uint8Array(64).fill(0),
                    ...new Uint8Array(64).fill(0),
                ]),
            );
        });

        it('should return a mixture of defined and not defined signatures', () => {
            const signatures: SignaturesMap = {
                [address1]: signature1,
                [address2]: null,
                [address3]: signature3,
            };
            const encoder = getSignaturesEncoderWithLength(3);
            const encoded = encoder.encode(signatures);

            expect(encoded).toStrictEqual(
                new Uint8Array([
                    /* no size prefix */
                    /* signatures */
                    ...signature1,
                    ...new Uint8Array(64).fill(0),
                    ...signature3,
                ]),
            );
        });

        it('should throw if the number of signatures is more than the expected size', () => {
            const signatures: SignaturesMap = {
                [address1]: signature1,
                [address2]: signature2,
                [address3]: signature3,
            };
            const encoder = getSignaturesEncoderWithLength(2);
            expect(() => encoder.encode(signatures)).toThrow(
                new SolanaError(SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS, {
                    actual: 3,
                    codecDescription: 'signatures',
                    expected: 2,
                }),
            );
        });
    });
});
