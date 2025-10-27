import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { ReadonlyUint8Array, VariableSizeDecoder, VariableSizeEncoder } from '@solana/codecs-core';
import { getBase16Decoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__CODECS__INVALID_CONSTANT,
    SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__APPLICATION_DOMAIN_STRING_LENGTH_OUT_OF_RANGE,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__INVALID_APPLICATION_DOMAIN_BYTE_LENGTH,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_LENGTH_MISMATCH,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED,
    SolanaError,
} from '@solana/errors';

import { OffchainMessageApplicationDomain } from '../application-domain';
import { getOffchainMessageV0Decoder, getOffchainMessageV0Encoder } from '../codecs/message-v0';
import {
    OffchainMessageContentFormat,
    OffchainMessageContentRestrictedAsciiOf1232BytesMax,
    OffchainMessageContentUtf8Of1232BytesMax,
    OffchainMessageContentUtf8Of65535BytesMax,
} from '../content';
import { OffchainMessageV0 } from '../message-v0';
import { OffchainMessageVersion } from '../version';

// The string `'\xffsolana offchain'`
const OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES: ReadonlyUint8Array = new Uint8Array([
    0xff, 0x73, 0x6f, 0x6c, 0x61, 0x6e, 0x61, 0x20, 0x6f, 0x66, 0x66, 0x63, 0x68, 0x61, 0x69, 0x6e,
]);

const APPLICATION_DOMAIN = 'testdomain111111111111111111111111111111111' as OffchainMessageApplicationDomain;
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

describe('getOffchainMessageV0Decoder()', () => {
    let decoder: VariableSizeDecoder<OffchainMessageV0>;
    beforeEach(() => {
        decoder = getOffchainMessageV0Decoder();
    });
    it('decodes a well-formed ASCII encoded message according to spec', () => {
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
        expect(decoder.decode(encodedMessage)).toStrictEqual({
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: 'Hello world',
            },
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        });
    });
    it('freezes the decoded message', () => {
        expect.assertions(5);
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
        const decodedMessage = decoder.decode(encodedMessage);
        expect(decodedMessage).toBeFrozenObject();
        expect(decodedMessage.content).toBeFrozenObject();
        expect(decodedMessage.requiredSignatories).toBeFrozenObject();
        decodedMessage.requiredSignatories.forEach(signer => expect(signer).toBeFrozenObject());
    });
    it('throws when decoding an encoded message with a malformed signing domain', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain (malformed)
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES.toReversed(),
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
                // Message length (1 character)
                0x01, 0x00,
                    // Message (horizontal tab character)
                    0x09,
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_CONSTANT, {
                constant: OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                data: encodedMessage,
                hexConstant: getBase16Decoder().decode(OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES),
                hexData: getBase16Decoder().decode(encodedMessage),
                offset: 0,
            }),
        );
    });
    it('throws when decoding an ASCII encoded message whose message content is outside the restricted set', () => {
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
                // Message length (1 character)
                0x01, 0x00,
                    // Message (horizontal tab character)
                    0x09,
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE),
        );
    });
    it('throws when decoding an ASCII encoded message with a non-zero version', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x01,
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
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: 1,
            }),
        );
    });
    it('throws when decoding an ASCII encoded message with an unsupported version', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0xFF,
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
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: 255,
            }),
        );
    });
    it('throws when decoding an ASCII encoded message whose message content length is zero', () => {
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
                // Message length (0 characters)
                0x00, 0x00,
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY),
        );
    });
    it('throws when decoding an ASCII encoded message whose required signers length is zero', () => {
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
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO),
        );
    });
    it('throws when decoding an ASCII encoded message whose message content is too long', () => {
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
                // Message length (1232 + 1 characters)
                0xd1, 0x04,
                    // Message
                    ...Array.from<number>({ length: 1232 + 1 }).fill(0x21 /* exclamation point */), 
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
                actualBytes: 1232 + 1,
                maxBytes: 1232,
            }),
        );
    });
    it('throws when decoding an ASCII encoded message whose message content does not match the length specified in the preamble', () => {
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
                    // Message (12 characters)
                    ...Array.from<number>({ length: 12 }).fill(0x21 /* exclamation point */), 
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_LENGTH_MISMATCH, {
                actualLength: 12,
                specifiedLength: 11,
            }),
        );
    });
    it('decodes a well-formed 1232-byte-max UTF-8 message according to spec', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (UTF-8, 1232-byte-max)
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (✌🏿cool)
                    0xe2, 0x9c, 0x8c, 0xf0, 0x9f, 0x8f, 0xbf, 0x63, 0x6f, 0x6f, 0x6c,
            ]);
        expect(decoder.decode(encodedMessage)).toStrictEqual({
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
                text: '✌🏿cool',
            },
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        });
    });
    it('throws when decoding a 1232-byte-max UTF-8 message whose message content length is zero', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (UTF-8, 1232-byte-max)
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (0 characters)
                0x00, 0x00,
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY),
        );
    });
    it('throws when decoding a 1232-byte-max UTF-8 message whose message content is too long', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (UTF-8, 1232-byte-max)
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (1232 + 1 characters)
                0xd1, 0x04,
                    // Message
                    ...Array.from<number>({ length: 1232 + 1 }).fill(0x21 /* exclamation point */), 
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
                actualBytes: 1232 + 1,
                maxBytes: 1232,
            }),
        );
    });
    it('throws when decoding a 1232-byte-max UTF-8 message whose message content does not match the length specified in the preamble', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (UTF-8, 1232-byte-max)
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (12 characters)
                    ...Array.from<number>({ length: 12 }).fill(0x21 /* exclamation point */), 
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_LENGTH_MISMATCH, {
                actualLength: 12,
                specifiedLength: 11,
            }),
        );
    });
    it('decodes a well-formed 65535-byte-max UTF-8 message according to spec', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (UTF-8, 65535-byte-max)
                0x02,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (✌🏿cool)
                    0xe2, 0x9c, 0x8c, 0xf0, 0x9f, 0x8f, 0xbf, 0x63, 0x6f, 0x6f, 0x6c,
            ]);
        expect(decoder.decode(encodedMessage)).toStrictEqual({
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
                text: '✌🏿cool',
            },
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        });
    });
    it('throws when decoding a 65535-byte-max UTF-8 message whose message content length is zero', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (UTF-8, 65535-byte-max)
                0x02,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (0 characters)
                0x00, 0x00,
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY),
        );
    });
    it('throws when decoding a 65535-byte-max UTF-8 message whose message content does not match the length specified in the preamble', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (UTF-8, 65535-byte-max)
                0x02,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (12 characters)
                    ...Array.from<number>({ length: 12 }).fill(0x21 /* exclamation point */), 
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_LENGTH_MISMATCH, {
                actualLength: 12,
                specifiedLength: 11,
            }),
        );
    });
});

describe('getOffchainMessageEncoder()', () => {
    let encoder: VariableSizeEncoder<OffchainMessageV0>;
    beforeEach(() => {
        encoder = getOffchainMessageV0Encoder();
    });
    it('encodes a well-formed ASCII encoded message according to spec', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: 'Hello world',
            } as OffchainMessageContentRestrictedAsciiOf1232BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(encoder.encode(offchainMessage)).toStrictEqual(
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
            ]),
        );
    });
    it('throws when encoding an ASCII encoded message whose application domain is not base58', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: '0'.repeat(32) as OffchainMessageApplicationDomain,
            content: {
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: 'Hello world',
            } as OffchainMessageContentRestrictedAsciiOf1232BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, {
                alphabet: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
                base: 58,
                value: '0'.repeat(32),
            }),
        );
    });
    it.each([31, 45])(
        'throws when encoding an ASCII encoded message whose application domain is %s characters',
        length => {
            const offchainMessage: OffchainMessageV0 = {
                applicationDomain: '1'.repeat(length) as OffchainMessageApplicationDomain,
                content: {
                    format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                    text: 'Hello world',
                } as OffchainMessageContentRestrictedAsciiOf1232BytesMax,
                requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
                version: 0,
            };
            expect(() => encoder.encode(offchainMessage)).toThrow(
                new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__APPLICATION_DOMAIN_STRING_LENGTH_OUT_OF_RANGE, {
                    actualLength: length,
                }),
            );
        },
    );
    it.each([
        [31, 'tVojvhToWjQ8Xvo4UPx2Xz9eRy7auyYMmZBjc2XfN'],
        [33, 'JJEfe6DcPM2ziB2vfUWDV6aHVerXRGkv3TcyvJUNGHZz'],
    ])(
        'throws when encoding an ASCII encoded message whose application domain encodes to have %s bytes',
        (actualLength, applicationDomain) => {
            const offchainMessage: OffchainMessageV0 = {
                applicationDomain: applicationDomain as OffchainMessageApplicationDomain,
                content: {
                    format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                    text: 'Hello world',
                } as OffchainMessageContentRestrictedAsciiOf1232BytesMax,
                requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
                version: 0,
            };
            expect(() => encoder.encode(offchainMessage)).toThrow(
                new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__INVALID_APPLICATION_DOMAIN_BYTE_LENGTH, {
                    actualLength,
                }),
            );
        },
    );
    it('throws when encoding an ASCII encoded message with a non-zero version', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: 'Hello world',
            } as OffchainMessageContentRestrictedAsciiOf1232BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 1 as OffchainMessageVersion,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: 1,
            }),
        );
    });
    it('throws when encoding an ASCII encoded message with an unsupported version', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: 'Hello world',
            } as OffchainMessageContentRestrictedAsciiOf1232BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 255 as OffchainMessageVersion,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: 255,
            }),
        );
    });
    it('throws when encoding an ASCII encoded message with no required signers', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: 'Hello world',
            } as OffchainMessageContentRestrictedAsciiOf1232BytesMax,
            requiredSignatories: [],
            version: 0,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO),
        );
    });
    it('throws when encoding an ASCII encoded message whose message content is outside the restricted set', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: '\t',
            } as OffchainMessageContentRestrictedAsciiOf1232BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE),
        );
    });
    it('throws when encoding an ASCII encoded message whose message content length is zero', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: '',
            } as OffchainMessageContentRestrictedAsciiOf1232BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY),
        );
    });
    it('throws when encoding an ASCII encoded message whose message content is too long', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: '!'.repeat(1232 + 1),
            } as OffchainMessageContentRestrictedAsciiOf1232BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
                actualBytes: 1232 + 1,
                maxBytes: 1232,
            }),
        );
    });
    it('encodes a well-formed 1232-byte-max UTF-8 message according to spec', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
                text: '✌🏿cool',
            } as OffchainMessageContentUtf8Of1232BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(encoder.encode(offchainMessage)).toStrictEqual(
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (UTF-8, 1232-byte-max)
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (✌🏿cool)
                    0xe2, 0x9c, 0x8c, 0xf0, 0x9f, 0x8f, 0xbf, 0x63, 0x6f, 0x6f, 0x6c,
            ]),
        );
    });
    it('throws when encoding a 1232-byte-max UTF-8 message whose message content length is zero', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
                text: '',
            } as OffchainMessageContentUtf8Of1232BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY),
        );
    });
    it('throws when encoding a 1232-byte-max UTF-8 message whose message content is too long', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
                text: '\t'.repeat(1232 + 1),
            } as OffchainMessageContentUtf8Of1232BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
                actualBytes: 1232 + 1,
                maxBytes: 1232,
            }),
        );
    });
    it('encodes a well-formed 65535-byte-max UTF-8 message according to spec', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
                text: '✌🏿cool',
            } as OffchainMessageContentUtf8Of65535BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(encoder.encode(offchainMessage)).toStrictEqual(
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Application domain
                ...APPLICATION_DOMAIN_BYTES,
                // Message format (UTF-8, 65535-byte-max)
                0x02,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message length (11 characters)
                0x0b, 0x00,
                    // Message (✌🏿cool)
                    0xe2, 0x9c, 0x8c, 0xf0, 0x9f, 0x8f, 0xbf, 0x63, 0x6f, 0x6f, 0x6c,
            ]),
        );
    });
    it('throws when encoding a 65535-byte-max UTF-8 message whose message content length is zero', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
                text: '',
            } as OffchainMessageContentUtf8Of65535BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY),
        );
    });
    it('throws when encoding a 65535-byte-max UTF-8 message whose message content is too long', () => {
        const offchainMessage: OffchainMessageV0 = {
            applicationDomain: APPLICATION_DOMAIN,
            content: {
                format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
                text: '\t'.repeat(65535 + 1),
            } as OffchainMessageContentUtf8Of65535BytesMax,
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
                actualBytes: 65535 + 1,
                maxBytes: 65535,
            }),
        );
    });
});
