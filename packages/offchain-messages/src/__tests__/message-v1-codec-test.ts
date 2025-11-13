import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { ReadonlyUint8Array, VariableSizeDecoder, VariableSizeEncoder } from '@solana/codecs-core';
import { getBase16Decoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__CODECS__INVALID_CONSTANT,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_UNIQUE,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__UNEXPECTED_VERSION,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED,
    SolanaError,
} from '@solana/errors';

import { getOffchainMessageV1Decoder, getOffchainMessageV1Encoder } from '../codecs/message-v1';
import { OffchainMessageV1 } from '../message-v1';

// The string `'\xffsolana offchain'`
const OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES: ReadonlyUint8Array = new Uint8Array([
    0xff, 0x73, 0x6f, 0x6c, 0x61, 0x6e, 0x61, 0x20, 0x6f, 0x66, 0x66, 0x63, 0x68, 0x61, 0x69, 0x6e,
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

describe('getOffchainMessageV1Decoder()', () => {
    let decoder: VariableSizeDecoder<OffchainMessageV1>;
    beforeEach(() => {
        decoder = getOffchainMessageV1Decoder();
    });
    it('decodes a well-formed message according to spec', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message (Hello\nworld)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0A, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        expect(decoder.decode(encodedMessage)).toStrictEqual({
            content: 'Hello\nworld',
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 1,
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
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message (Hello\nworld)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0A, 0x77, 0x6f, 0x72, 0x6c, 0x64,
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
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
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
    it('throws when decoding an message with a version other than 1', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x00,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message (Hello\nworld)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0A, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__UNEXPECTED_VERSION, {
                actualVersion: 0,
                expectedVersion: 1,
            }),
        );
    });
    it('throws when decoding an message with duplicate signatories', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_A_BYTES,
                // Message (Hello\nworld)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0A, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_UNIQUE),
        );
    });
    it('throws when decoding an message with an unsupported version', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0xFF,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message (Hello\nworld)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0A, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: 255,
            }),
        );
    });
    it('throws when decoding an message whose required signers length is zero', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x01,
                // Signer count
                0x00,
                // Message (Hello\nworld)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0A, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO),
        );
    });
    it('throws when decoding a message whose message content length is zero', () => {
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
            ]);
        expect(() => decoder.decode(encodedMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY),
        );
    });
});

describe('getOffchainMessageEncoder()', () => {
    let encoder: VariableSizeEncoder<OffchainMessageV1>;
    beforeEach(() => {
        encoder = getOffchainMessageV1Encoder();
    });
    it('encodes a well-formed message according to spec', () => {
        const offchainMessage: OffchainMessageV1 = {
            content: 'Hello\nworld',
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 1,
        };
        expect(encoder.encode(offchainMessage)).toStrictEqual(
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message (Hello\nworld)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0A, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]),
        );
    });
    it('encodes a well-formed UTF-8 message according to spec', () => {
        const offchainMessage: OffchainMessageV1 = {
            content: '✌🏿cool',
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 1,
        };
        expect(encoder.encode(offchainMessage)).toStrictEqual(
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message (✌🏿cool)
                    0xe2, 0x9c, 0x8c, 0xf0, 0x9f, 0x8f, 0xbf, 0x63, 0x6f, 0x6f, 0x6c,
            ]),
        );
    });
    it('throws when encoding an message with a version other than 1', () => {
        const offchainMessage = {
            content: 'Hello\nworld',
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 0,
        };
        expect(() => encoder.encode(offchainMessage as unknown as OffchainMessageV1)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__UNEXPECTED_VERSION, {
                actualVersion: 0,
                expectedVersion: 1,
            }),
        );
    });
    it('throws when encoding an message with an unsupported version', () => {
        const offchainMessage = {
            content: 'Hello\nworld',
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 255,
        };
        expect(() => encoder.encode(offchainMessage as unknown as OffchainMessageV1)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: 255,
            }),
        );
    });
    it('throws when encoding an message with no required signers', () => {
        const offchainMessage: OffchainMessageV1 = {
            content: 'Hello\nworld',
            requiredSignatories: [],
            version: 1,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO),
        );
    });
    it('throws when encoding an message whose message content length is zero', () => {
        const offchainMessage: OffchainMessageV1 = {
            content: '',
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_B }],
            version: 1,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY),
        );
    });
    it('throws when there are duplicate signatories', () => {
        const offchainMessage: OffchainMessageV1 = {
            content: 'Hello\nworld',
            requiredSignatories: [{ address: SIGNER_A }, { address: SIGNER_A }],
            version: 1,
        };
        expect(() => encoder.encode(offchainMessage)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_UNIQUE),
        );
    });
    it('sorts the signatories in lexicographical order in the output', () => {
        const offchainMessage: OffchainMessageV1 = {
            content: 'Hello\nworld',
            requiredSignatories:
                // Out of order in the JS array
                [{ address: SIGNER_B }, { address: SIGNER_A }],
            version: 1,
        };
        expect(encoder.encode(offchainMessage)).toStrictEqual(
            // prettier-ignore
            new Uint8Array([
                // Signing domain
                ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                // Version
                0x01,
                // Signer count
                0x02,
                    // Signer addresses
                    ...SIGNER_A_BYTES,
                    ...SIGNER_B_BYTES,
                // Message (Hello\nWorld)
                    0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0A, 0x77, 0x6f, 0x72, 0x6c, 0x64,
            ]),
        );
    });
});
