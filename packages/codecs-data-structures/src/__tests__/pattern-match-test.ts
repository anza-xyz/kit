import { combineCodec, createDecoder, createEncoder } from '@solana/codecs-core';
import {
    SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES,
    SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE,
    SolanaError,
} from '@solana/errors';

import { getPatternMatchCodec, getPatternMatchDecoder, getPatternMatchEncoder } from '../pattern-match';

// An encoder that encodes any value to [0]
const encodeToZero = createEncoder<number>({
    fixedSize: 1,
    write: (_value, bytes, offset) => {
        bytes[offset] = 0;
        return offset + 1;
    },
});

// An encoder that encodes any value to [1]
const encodeToOne = createEncoder<number>({
    fixedSize: 1,
    write: (_value, bytes, offset) => {
        bytes[offset] = 1;
        return offset + 1;
    },
});

// An encoder that encodes any value to [2]
const encodeToTwo = createEncoder<number>({
    fixedSize: 1,
    write: (_value, bytes, offset) => {
        bytes[offset] = 2;
        return offset + 1;
    },
});

// A decoder that decodes any byte array to 0
const decodeToZero = createDecoder<number>({
    fixedSize: 1,
    read() {
        return [0, 1];
    },
});

// A decoder that decodes any byte array to 1
const decodeToOne = createDecoder<number>({
    fixedSize: 1,
    read() {
        return [1, 1];
    },
});

// A decoder that decodes any byte array to 2
const decodeToTwo = createDecoder<number>({
    fixedSize: 1,
    read() {
        return [2, 1];
    },
});

describe('getPatternMatchEncoder', () => {
    it('encodes using the first encoder when the first pattern matches', () => {
        const encoder = getPatternMatchEncoder([
            [() => true, encodeToZero],
            [() => false, encodeToOne],
            [() => false, encodeToTwo],
        ]);
        expect(encoder.encode(42)).toEqual(new Uint8Array([0]));
    });

    it('encodes using the second encoder when the second pattern matches', () => {
        const encoder = getPatternMatchEncoder([
            [() => false, encodeToZero],
            [() => true, encodeToOne],
            [() => false, encodeToTwo],
        ]);
        expect(encoder.encode(42)).toEqual(new Uint8Array([1]));
    });

    it('encodes using the third encoder when the third pattern matches', () => {
        const encoder = getPatternMatchEncoder([
            [() => false, encodeToZero],
            [() => false, encodeToOne],
            [() => true, encodeToTwo],
        ]);
        expect(encoder.encode(42)).toEqual(new Uint8Array([2]));
    });

    it('throws an error when no pattern matches', () => {
        const encoder = getPatternMatchEncoder([
            [() => false, encodeToZero],
            [() => false, encodeToOne],
            [() => false, encodeToTwo],
        ]);
        expect(() => encoder.encode(42)).toThrow(new SolanaError(SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE));
    });
});

describe('getPatternMatchDecoder', () => {
    it('decodes using the first decoder when the first pattern matches', () => {
        const decoder = getPatternMatchDecoder([
            [() => true, decodeToZero],
            [() => false, decodeToOne],
            [() => false, decodeToTwo],
        ]);
        expect(decoder.decode(new Uint8Array([42]))).toBe(0);
    });

    it('decodes using the second decoder when the second pattern matches', () => {
        const decoder = getPatternMatchDecoder([
            [() => false, decodeToZero],
            [() => true, decodeToOne],
            [() => false, decodeToTwo],
        ]);
        expect(decoder.decode(new Uint8Array([42]))).toBe(1);
    });

    it('decodes using the third decoder when the third pattern matches', () => {
        const decoder = getPatternMatchDecoder([
            [() => false, decodeToZero],
            [() => false, decodeToOne],
            [() => true, decodeToTwo],
        ]);
        expect(decoder.decode(new Uint8Array([42]))).toBe(2);
    });

    it('throws an error when no pattern matches', () => {
        const decoder = getPatternMatchDecoder([
            [() => false, decodeToZero],
            [() => false, decodeToOne],
            [() => false, decodeToTwo],
        ]);
        const bytes = new Uint8Array([42]);
        expect(() => decoder.decode(bytes)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES, { bytes }),
        );
    });
});

describe('getPatternMatchCodec', () => {
    const codecZero = combineCodec(encodeToZero, decodeToZero);
    const codecOne = combineCodec(encodeToOne, decodeToOne);
    const codecTwo = combineCodec(encodeToTwo, decodeToTwo);

    it('encodes using the first codec when the first encoder pattern matches', () => {
        const codec = getPatternMatchCodec([
            [() => true /* encoder predicate */, () => true /* decoder predicate */, codecZero],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecOne],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecTwo],
        ]);
        expect(codec.encode(42)).toEqual(new Uint8Array([0]));
    });

    it('encodes using the second codec when the second encoder pattern matches', () => {
        const codec = getPatternMatchCodec([
            [() => false /* encoder predicate */, () => true /* decoder predicate */, codecZero],
            [() => true /* encoder predicate */, () => false /* decoder predicate */, codecOne],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecTwo],
        ]);
        expect(codec.encode(42)).toEqual(new Uint8Array([1]));
    });

    it('encodes using the third codec when the third encoder pattern matches', () => {
        const codec = getPatternMatchCodec([
            [() => false /* encoder predicate */, () => true /* decoder predicate */, codecZero],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecOne],
            [() => true /* encoder predicate */, () => false /* decoder predicate */, codecTwo],
        ]);
        expect(codec.encode(42)).toEqual(new Uint8Array([2]));
    });

    it('throws an error when encoding and no encoder pattern matches', () => {
        const codec = getPatternMatchCodec([
            [() => false /* encoder predicate */, () => true /* decoder predicate */, codecZero],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecOne],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecTwo],
        ]);
        expect(() => codec.encode(42)).toThrow(new SolanaError(SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE));
    });

    it('decodes using the first codec when the first decoder pattern matches', () => {
        const codec = getPatternMatchCodec([
            [() => true /* encoder predicate */, () => true /* decoder predicate */, codecZero],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecOne],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecTwo],
        ]);
        expect(codec.decode(new Uint8Array([42]))).toBe(0);
    });

    it('decodes using the second codec when the second decoder pattern matches', () => {
        const codec = getPatternMatchCodec([
            [() => true /* encoder predicate */, () => false /* decoder predicate */, codecZero],
            [() => false /* encoder predicate */, () => true /* decoder predicate */, codecOne],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecTwo],
        ]);
        expect(codec.decode(new Uint8Array([42]))).toBe(1);
    });

    it('decodes using the third codec when the third decoder pattern matches', () => {
        const codec = getPatternMatchCodec([
            [() => true /* encoder predicate */, () => false /* decoder predicate */, codecZero],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecOne],
            [() => false /* encoder predicate */, () => true /* decoder predicate */, codecTwo],
        ]);
        expect(codec.decode(new Uint8Array([42]))).toBe(2);
    });

    it('throws an error when decoding and no decoder pattern matches', () => {
        const codec = getPatternMatchCodec([
            [() => true /* encoder predicate */, () => false /* decoder predicate */, codecZero],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecOne],
            [() => false /* encoder predicate */, () => false /* decoder predicate */, codecTwo],
        ]);
        const bytes = new Uint8Array([42]);
        expect(() => codec.decode(bytes)).toThrow(
            new SolanaError(SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES, { bytes }),
        );
    });
});
