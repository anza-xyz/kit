import { combineCodec, createDecoder, createEncoder } from '@solana/codecs-core';

import { getPredicateCodec, getPredicateDecoder, getPredicateEncoder } from '../predicate';

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

describe('getPredicateEncoder', () => {
    it('encodes using the true encoder when the predicate is true', () => {
        const encoder = getPredicateEncoder(() => true, encodeToOne, encodeToZero);
        expect(encoder.encode(42)).toEqual(new Uint8Array([1]));
    });

    it('encodes using the false encoder when the predicate is false', () => {
        const encoder = getPredicateEncoder(() => false, encodeToOne, encodeToZero);
        expect(encoder.encode(42)).toEqual(new Uint8Array([0]));
    });
});

describe('getPredicateDecoder', () => {
    it('decodes using the true decoder when the predicate is true', () => {
        const decoder = getPredicateDecoder<number>(() => true, decodeToOne, decodeToZero);
        expect(decoder.decode(new Uint8Array([42]))).toBe(1);
    });

    it('decodes using the false decoder when the predicate is false', () => {
        const decoder = getPredicateDecoder<number>(() => false, decodeToOne, decodeToZero);
        expect(decoder.decode(new Uint8Array([42]))).toBe(0);
    });
});

describe('getPredicateCodec', () => {
    const codecZero = combineCodec(encodeToZero, decodeToZero);
    const codecOne = combineCodec(encodeToOne, decodeToOne);

    it('encodes using the true encoder when the predicate is true', () => {
        const codec = getPredicateCodec(
            () => true /* encoder predicate */,
            () => true /* decoder predicate */,
            codecOne,
            codecZero,
        );
        expect(codec.encode(42)).toEqual(new Uint8Array([1]));
    });

    it('encodes using the false encoder when the predicate is false', () => {
        const codec = getPredicateCodec(
            () => false /* encoder predicate */,
            () => true /* decoder predicate */,
            codecOne,
            codecZero,
        );
        expect(codec.encode(42)).toEqual(new Uint8Array([0]));
    });

    it('decodes using the true decoder when the predicate is true', () => {
        const codec = getPredicateCodec(
            () => true /* encoder predicate */,
            () => true /* decoder predicate */,
            codecOne,
            codecZero,
        );
        expect(codec.decode(new Uint8Array([42]))).toBe(1);
    });

    it('decodes using the false decoder when the predicate is false', () => {
        const codec = getPredicateCodec(
            () => true /* encoder predicate */,
            () => false /* decoder predicate */,
            codecOne,
            codecZero,
        );
        expect(codec.decode(new Uint8Array([42]))).toBe(0);
    });
});
