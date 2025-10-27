import { ReadonlyUint8Array, VariableSizeDecoder, VariableSizeEncoder } from '@solana/codecs-core';
import { SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, SolanaError } from '@solana/errors';

import { getOffchainMessageDecoder, getOffchainMessageEncoder } from '../codecs/message';
import { getOffchainMessageV0Decoder, getOffchainMessageV0Encoder } from '../codecs/message-v0';
import { OffchainMessage } from '../message';
import { OffchainMessageV0 } from '../message-v0';

jest.mock('../codecs/message-v0');

// The string `'\xffsolana offchain'`
const OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES: ReadonlyUint8Array = new Uint8Array([
    0xff, 0x73, 0x6f, 0x6c, 0x61, 0x6e, 0x61, 0x20, 0x6f, 0x66, 0x66, 0x63, 0x68, 0x61, 0x69, 0x6e,
]);

describe('getOffchainMessageDecoder', () => {
    let decoder: VariableSizeDecoder<OffchainMessage>;
    beforeEach(() => {
        decoder = getOffchainMessageDecoder();
    });
    it('delegates to the version 0 message decoder when the preamble is of version 0', () => {
        const expectedResult = 123;
        const mockDecoder = jest.fn().mockReturnValue(expectedResult);
        const mockReader = jest.fn().mockReturnValue([
            expectedResult,
            OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES.byteLength +
                // Version
                1 +
                // Padding
                1,
        ]);
        jest.mocked(getOffchainMessageV0Decoder).mockReturnValue({ decode: mockDecoder, read: mockReader });
        const encodedMessage =
            // prettier-ignore
            new Uint8Array([
                    // Padding
                    0xff,
                    // Signing domain
                    ...OFFCHAIN_MESSAGE_SIGNING_DOMAIN_BYTES,
                    // Version
                    0x00,
                ]);
        const result = decoder.decode(encodedMessage, 1);
        expect(mockReader).toHaveBeenCalledWith(encodedMessage, 1);
        expect(result).toBe(expectedResult);
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
        expect(() => {
            decoder.decode(encodedMessage);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: putativeVersion,
            }),
        );
    });
});

describe('getOffchainMessageEncoder', () => {
    let encoder: VariableSizeEncoder<OffchainMessage>;
    beforeEach(() => {
        encoder = getOffchainMessageEncoder();
    });
    it('delegates to the version 0 message encoder when the message is of version 0', () => {
        const mockMessage = { version: 0 };
        const mockWriter = jest.fn().mockImplementation((_message, bytes, offset) => {
            bytes.set([1, 2, 3], offset);
        });
        jest.mocked(getOffchainMessageV0Encoder).mockReturnValue({
            encode: jest.fn(),
            getSizeFromValue: jest.fn().mockReturnValue(3),
            write: mockWriter,
        });
        const result = encoder.encode(mockMessage as OffchainMessageV0);
        expect(mockWriter).toHaveBeenCalledWith(mockMessage, expect.any(Uint8Array), 0 /* offset */);
        expect(result).toStrictEqual(new Uint8Array([1, 2, 3]));
    });
    it.each(
        Array.from({ length: 255 - 0 /* highest supported version */ })
            .map((_, ii) => 255 - ii)
            .reverse(),
    )('throws if the preamble is of version `%s`', putativeVersion => {
        expect(() => {
            encoder.encode({ version: putativeVersion } as OffchainMessage);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: putativeVersion,
            }),
        );
    });
});
