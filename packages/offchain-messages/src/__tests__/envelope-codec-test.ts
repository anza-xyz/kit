import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { ReadonlyUint8Array, VariableSizeDecoder, VariableSizeEncoder } from '@solana/codecs-core';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__ENVELOPE_SIGNERS_MISMATCH,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_SIGNATURES_MISMATCH,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED,
    SolanaError,
} from '@solana/errors';
import { SignatureBytes } from '@solana/keys';

import { getOffchainMessageEnvelopeDecoder, getOffchainMessageEnvelopeEncoder } from '../codecs/envelope';
import { OffchainMessageEnvelope } from '../envelope';
import { OffchainMessageBytes } from '../message';

// The string `'\xffsolana offchain'`
const OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES: ReadonlyUint8Array = new Uint8Array([
    0xff, 0x73, 0x6f, 0x6c, 0x61, 0x6e, 0x61, 0x20, 0x6f, 0x66, 0x66, 0x63, 0x68, 0x61, 0x69, 0x6e,
]);

const APPLICATION_DOMAIN_BYTES = new Uint8Array([
    0x0d, 0x3b, 0x73, 0x0b, 0x9e, 0x88, 0x9b, 0x4b, 0x66, 0x1e, 0xd2, 0xa3, 0xce, 0x19, 0x1f, 0x68, 0xd3, 0x7d, 0xa7,
    0x44, 0x32, 0x06, 0xa1, 0x82, 0xb9, 0x46, 0x89, 0x1e, 0x00, 0x00, 0x00, 0x00,
]);

const SIGNER_A =
    'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address<'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'>;
const SIGNER_A_BYTES = new Uint8Array([
    0x0c, 0xfe, 0x2c, 0xc9, 0x52, 0x55, 0x0e, 0x94, 0xc7, 0x25, 0x63, 0x9a, 0x4b, 0xd1, 0x1d, 0x4e, 0xa5, 0xa6, 0x38,
    0x36, 0x51, 0xc3, 0x08, 0xb7, 0x18, 0xc3, 0xae, 0xf2, 0x86, 0xbc, 0xa1, 0xaf,
]);
const SIGNER_B =
    'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address<'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'>;
const SIGNER_B_BYTES = new Uint8Array([
    0x0c, 0xfe, 0x2c, 0xc9, 0x52, 0x5c, 0x95, 0xef, 0xb9, 0x72, 0xc0, 0xc5, 0xb7, 0xae, 0x0f, 0xd5, 0x20, 0xd9, 0x7e,
    0x94, 0x8f, 0xd8, 0xbb, 0x2c, 0x10, 0xa1, 0x01, 0x02, 0xce, 0x98, 0xb3, 0xa6,
]);

describe('getOffchainMessageEnvelopeDecoder()', () => {
    let decoder: VariableSizeDecoder<OffchainMessageEnvelope>;
    beforeEach(() => {
        decoder = getOffchainMessageEnvelopeDecoder();
    });
    it('decodes a well-formed encoded message envelope according to spec', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (Restricted ASCII, 1232-byte-max)
                0x00,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (Hello world)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        const encodedMessageEnvelope =
            // prettier-ignore
            new Uint8Array([
                // Signer count
                0x02,
                    // Signatures
                    ...new Uint8Array(64).fill(0x00),
                    ...new Uint8Array(64).fill(0x02),
                ...encodedMessage,
            ]);
        expect(decoder.decode(encodedMessageEnvelope)).toStrictEqual({
            content: encodedMessage,
            signatures: {
                [SIGNER_A]: null,
                [SIGNER_B]: new Uint8Array(64).fill(0x02),
            },
        });
    });
    it('freezes the decoded envelope', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (Restricted ASCII, 1232-byte-max)
                0x00,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (Hello world)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        const encodedMessageEnvelope =
            // prettier-ignore
            new Uint8Array([
                // Signer count
                0x02,
                    // Signatures
                    ...new Uint8Array(64).fill(0x00),
                    ...new Uint8Array(64).fill(0x02),
                ...encodedMessage,
            ]);
        const decodedEnvelope = decoder.decode(encodedMessageEnvelope);
        expect(decodedEnvelope).toBeFrozenObject();
        expect(decodedEnvelope.signatures).toBeFrozenObject();
    });
    it('orders the keys in the signatures map in the order they are specified by the message', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (Restricted ASCII, 1232-byte-max)
                0x00,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_B_BYTES,
                    ...SIGNER_A_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (Hello world)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        const encodedMessageEnvelope =
            // prettier-ignore
            new Uint8Array([
                // Signer count
                0x02,
                    // Signatures
                    ...new Uint8Array(64).fill(0x02),
                    ...new Uint8Array(64).fill(0x01),
                ...encodedMessage,
            ]);
        const offchainMessageEnvelope = decoder.decode(encodedMessageEnvelope);
        expect(Object.keys(offchainMessageEnvelope.signatures)).toStrictEqual([SIGNER_B, SIGNER_A]);
    });
    it('throws when the message specfifies no signers', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (Restricted ASCII, 1232-byte-max)
                0x00,
                // Signer count
                0x00,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (Hello world)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        const encodedMessageEnvelope =
            // prettier-ignore
            new Uint8Array([
                // Signer count
                0x02,
                    // Signatures
                    ...new Uint8Array(64).fill(0x02),
                    ...new Uint8Array(64).fill(0x01),
                ...encodedMessage,
            ]);
        expect(() => {
            decoder.decode(encodedMessageEnvelope);
        }).toThrow(new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO));
    });
    it('throws when the envelope has no signatures', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (Restricted ASCII, 1232-byte-max)
                0x00,
                // Signer count
                0x00,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (Hello world)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        const encodedMessageEnvelope =
            // prettier-ignore
            new Uint8Array([
                // Signer count
                0x00,
                ...encodedMessage,
            ]);
        expect(() => {
            decoder.decode(encodedMessageEnvelope);
        }).toThrow(new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO));
    });
    it('throws when the number of required signatures specified by the message and the number of signatures in the envelope mismatch', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (Restricted ASCII, 1232-byte-max)
                0x00,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (Hello world)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        const encodedMessageEnvelope =
            // prettier-ignore
            new Uint8Array([
                // Signer count
                0x01,
                    // Signatures
                    ...new Uint8Array(64),
                ...encodedMessage,
            ]);
        expect(() => {
            decoder.decode(encodedMessageEnvelope);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_SIGNATURES_MISMATCH, {
                numRequiredSignatures: 2,
                signatoryAddresses: [SIGNER_A, SIGNER_B],
                signaturesLength: 1,
            }),
        );
    });
    it.each(
        Array.from({ length: 255 - 0 /* highest supported version */ })
            .map((_, ii) => 255 - ii)
            .reverse(),
    )('throws if the preamble is of version `%s`', putativeVersion => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version (unrecognized)
                putativeVersion,
            ]);
        const encodedMessageEnvelope =
            // prettier-ignore
            new Uint8Array([
                // Signer count
                0x01,
                    // Signatures
                    ...new Uint8Array(64),
                ...encodedMessage,
            ]);
        expect(() => {
            decoder.decode(encodedMessageEnvelope);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: putativeVersion,
            }),
        );
    });
});

describe('getOffchainMessageEnvelopeEncoder()', () => {
    let encoder: VariableSizeEncoder<OffchainMessageEnvelope>;
    beforeEach(() => {
        encoder = getOffchainMessageEnvelopeEncoder();
    });
    it('encodes a well-formed message envelope according to spec', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (Restricted ASCII, 1232-byte-max)
                0x00,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (Hello world)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        const envelope: OffchainMessageEnvelope = {
            content: encodedMessage as unknown as OffchainMessageBytes,
            signatures: {
                [SIGNER_A]: null,
                [SIGNER_B]: new Uint8Array(64).fill(0x02) as SignatureBytes,
            },
        };
        expect(encoder.encode(envelope)).toStrictEqual(
            // prettier-ignore
            new Uint8Array([
                // Signer count
                0x02,
                // Signatures
                    ...new Uint8Array(64).fill(0x00),
                    ...new Uint8Array(64).fill(0x02),
                ...encodedMessage,
            ]),
        );
    });
    it('encodes the signatures in the order specified by the preable, regardless of the order in the signatures map', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (Restricted ASCII, 1232-byte-max)
                0x00,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (Hello world)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        const envelope: OffchainMessageEnvelope = {
            content: encodedMessage as unknown as OffchainMessageBytes,
            signatures: {
                [SIGNER_B]: new Uint8Array(64).fill(0x02) as SignatureBytes,
                // eslint-disable-next-line sort-keys-fix/sort-keys-fix
                [SIGNER_A]: null,
            },
        };
        expect(encoder.encode(envelope)).toStrictEqual(
            // prettier-ignore
            new Uint8Array([
                // Signer count
                0x02,
                // Signatures
                    ...new Uint8Array(64).fill(0x00),
                    ...new Uint8Array(64).fill(0x02),
                ...encodedMessage,
            ]),
        );
    });
    it('throws when the envelope has no signatures', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (Restricted ASCII, 1232-byte-max)
                0x00,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (Hello world)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        const envelope: OffchainMessageEnvelope = {
            content: encodedMessage as unknown as OffchainMessageBytes,
            signatures: {},
        };
        expect(() => {
            encoder.encode(envelope);
        }).toThrow(new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO));
    });
    it('throws when the signature addresses in the envelope do not match the required signatures in the preamble', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (Restricted ASCII, 1232-byte-max)
                0x00,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (Hello world)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        const SIGNER_C =
            'signerCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address<'signerCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'>;
        const envelope: OffchainMessageEnvelope = {
            content: encodedMessage as unknown as OffchainMessageBytes,
            signatures: {
                [SIGNER_C]: null,
                // eslint-disable-next-line sort-keys-fix/sort-keys-fix
                [SIGNER_A]: null,
            },
        };
        expect(() => {
            encoder.encode(envelope);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__ENVELOPE_SIGNERS_MISMATCH, {
                missingRequiredSigners: [SIGNER_B],
                unexpectedSigners: [SIGNER_C],
            }),
        );
    });
    it.each(
        Array.from({ length: 255 - 0 /* highest supported version */ })
            .map((_, ii) => 255 - ii)
            .reverse(),
    )('throws if the envelope is of version `%s`', putativeVersion => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version (unrecognized)
                putativeVersion,
            ]);
        expect(() => {
            encoder.encode({
                content: encodedMessage as unknown as OffchainMessageBytes,
                signatures: {
                    [SIGNER_A]: null,
                },
            });
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: putativeVersion,
            }),
        );
    });
});
