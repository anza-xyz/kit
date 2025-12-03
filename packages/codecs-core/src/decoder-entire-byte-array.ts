import { SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY, SolanaError } from '@solana/errors';

import { createDecoder, Decoder } from './codec';

/**
 * Create a {@link Decoder} that asserts that the bytes provided to `decode` or `read` are fully consumed by the inner decoder
 * @param decoder A decoder to wrap
 * @returns A new decoder that will throw if provided with a byte array that it does not fully consume
 *
 * @typeParam T - The type of the decoder
 *
 * @remarks
 * Note that this compares the offset after encoding to the length of the input byte array
 *
 * The `offset` parameter to `decode` and `read` is still considered, and will affect the new offset that is compared to the byte array length
 *
 * The error that is thrown by the returned decoder is a {@link SolanaError} with the code `SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY`
 *
 * @example
 * Create a decoder that decodes a `u32` (4 bytes) and ensures the entire byte array is consumed
 * ```ts
 * const decoder = createDecoderThatUsesExactByteArray(getU32Decoder());
 * decoder.decode(new Uint8Array([0, 0, 0, 0])); // 0
 * decoder.decode(new Uint8Array([0, 0, 0, 0, 0])); // throws
 *
 * // with an offset
 * decoder.decode(new Uint8Array([0, 0, 0, 0, 0]), 1); // 0
 * decoder.decode(new Uint8Array([0, 0, 0, 0, 0, 0]), 1); // throws
 * ```
 */
export function createDecoderThatConsumesEntireByteArray<T>(decoder: Decoder<T>): Decoder<T> {
    return createDecoder({
        ...decoder,
        read(bytes, offset) {
            const [value, newOffset] = decoder.read(bytes, offset);
            if (bytes.length > newOffset) {
                throw new SolanaError(SOLANA_ERROR__CODECS__EXPECTED_DECODER_TO_CONSUME_ENTIRE_BYTE_ARRAY, {
                    expectedLength: newOffset,
                    numExcessBytes: bytes.length - newOffset,
                });
            }
            return [value, newOffset];
        },
    });
}
