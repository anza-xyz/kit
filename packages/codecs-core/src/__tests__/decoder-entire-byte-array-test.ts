import { SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY, SolanaError } from '@solana/errors';

import { createDecoder, Decoder } from '../codec';
import { createDecoderThatConsumesEntireByteArray } from '../decoder-entire-byte-array';

describe('createDecoderThatConsumesEntireByteArray', () => {
    // Given: a decoder that consumes exactly 4 bytes
    const outputNumber = 1234;
    const innerDecoder: Decoder<number> = createDecoder({
        fixedSize: 4,
        read: (_bytes, offset) => [outputNumber, offset + 4],
    });

    describe('decode function', () => {
        describe('with no offset', () => {
            it('returns the same value as the inner decoder when the entire byte array is consumed', () => {
                const decoder = createDecoderThatConsumesEntireByteArray(innerDecoder);
                const bytes = new Uint8Array(4);
                const value = decoder.decode(bytes);
                expect(value).toBe(outputNumber);
            });

            it('fatals when the inner decoder does not consume the entire byte array', () => {
                const decoder = createDecoderThatConsumesEntireByteArray(innerDecoder);
                const bytes = new Uint8Array(5);
                expect(() => decoder.decode(bytes)).toThrow(
                    new SolanaError(SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY, {
                        expectedLength: 4,
                        numExcessBytes: 1,
                    }),
                );
            });
        });

        describe('with an offset', () => {
            it('returns the same value as the inner decoder when the entire byte array is consumed', () => {
                const decoder = createDecoderThatConsumesEntireByteArray(innerDecoder);
                const bytes = new Uint8Array(6);
                const value = decoder.decode(bytes, 2);
                expect(value).toBe(outputNumber);
            });

            it('fatals when the inner decoder does not consume the entire byte array', () => {
                const decoder = createDecoderThatConsumesEntireByteArray(innerDecoder);
                const bytes = new Uint8Array(7);
                expect(() => decoder.decode(bytes, 2)).toThrow(
                    new SolanaError(SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY, {
                        expectedLength: 6,
                        numExcessBytes: 1,
                    }),
                );
            });
        });
    });

    describe('read function', () => {
        describe('with no offset', () => {
            it('returns the same value as the inner decoder when the entire byte array is consumed', () => {
                const decoder = createDecoderThatConsumesEntireByteArray(innerDecoder);
                const bytes = new Uint8Array(4);
                const [value] = decoder.read(bytes, 0);
                expect(value).toBe(outputNumber);
            });

            it('returns the same offset as the inner decoder when the entire byte array is consumed', () => {
                const decoder = createDecoderThatConsumesEntireByteArray(innerDecoder);
                const bytes = new Uint8Array(4);
                const [, offset] = decoder.read(bytes, 0);
                expect(offset).toBe(4);
            });

            it('fatals when the inner decoder does not consume the entire byte array', () => {
                const decoder = createDecoderThatConsumesEntireByteArray(innerDecoder);
                const bytes = new Uint8Array(5);
                expect(() => decoder.read(bytes, 0)).toThrow(
                    new SolanaError(SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY, {
                        expectedLength: 4,
                        numExcessBytes: 1,
                    }),
                );
            });
        });

        describe('with an offset', () => {
            it('returns the same value as the inner decoder when the entire byte array is consumed', () => {
                const decoder = createDecoderThatConsumesEntireByteArray(innerDecoder);
                const bytes = new Uint8Array(6);
                const [value] = decoder.read(bytes, 2);
                expect(value).toBe(outputNumber);
            });

            it('returns the same offset as the inner decoder when the entire byte array is consumed', () => {
                const decoder = createDecoderThatConsumesEntireByteArray(innerDecoder);
                const bytes = new Uint8Array(6);
                const [, offset] = decoder.read(bytes, 2);
                expect(offset).toBe(6);
            });

            it('fatals when the inner decoder does not consume the entire byte array', () => {
                const decoder = createDecoderThatConsumesEntireByteArray(innerDecoder);
                const bytes = new Uint8Array(7);
                expect(() => decoder.read(bytes, 2)).toThrow(
                    new SolanaError(SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY, {
                        expectedLength: 6,
                        numExcessBytes: 1,
                    }),
                );
            });
        });
    });
});
