import {
    createCodec,
    createDecoder,
    createEncoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
} from '../codec';
import { ReadonlyUint8Array } from '../readonly-uint8array';
import { tapCodec, tapDecoder, tapEncoder } from '../tap-codec';

const numberCodec: FixedSizeCodec<number, number, 1> = createCodec({
    fixedSize: 1,
    read: (bytes: ReadonlyUint8Array | Uint8Array, offset = 0): [number, number] => [bytes[offset], offset + 1],
    write: (value: number, bytes, offset) => {
        bytes.set([value], offset);
        return offset + 1;
    },
});

const numberEncoder: FixedSizeEncoder<number, 1> = createEncoder({
    fixedSize: 1,
    write: (value: number, bytes, offset) => {
        bytes.set([value], offset);
        return offset + 1;
    },
});

const numberDecoder: FixedSizeDecoder<number, 1> = createDecoder({
    fixedSize: 1,
    read: (bytes: ReadonlyUint8Array | Uint8Array, offset = 0): [number, number] => [bytes[offset], offset + 1],
});

describe('tapEncoder', () => {
    it('observes the input value before encoding without modifying it', () => {
        const observed: number[] = [];
        const encoder = tapEncoder(numberEncoder, value => {
            observed.push(value);
        });

        expect(encoder.encode(42)).toStrictEqual(new Uint8Array([42]));
        expect(observed).toStrictEqual([42]);
    });

    it('aborts encoding when the tap throws', () => {
        const encoder = tapEncoder(numberEncoder, value => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (value > 100) throw new Error('Value must not exceed 100');
        });

        expect(() => encoder.encode(200)).toThrow('Value must not exceed 100');
    });

    it('preserves the fixed size of the encoder', () => {
        const encoder = tapEncoder(numberEncoder, () => {});
        expect(encoder.fixedSize).toBe(1);
    });
});

describe('tapDecoder', () => {
    it('observes the decoded value without modifying it', () => {
        const observed: number[] = [];
        const decoder = tapDecoder(numberDecoder, value => {
            observed.push(value);
        });

        expect(decoder.decode(new Uint8Array([42]))).toBe(42);
        expect(observed).toStrictEqual([42]);
    });

    it('observes the decoded value at a non-zero offset', () => {
        const observed: number[] = [];
        const decoder = tapDecoder(numberDecoder, value => {
            observed.push(value);
        });

        expect(decoder.read(new Uint8Array([0, 0, 42]), 2)).toStrictEqual([42, 3]);
        expect(observed).toStrictEqual([42]);
    });

    it('aborts decoding when the tap throws', () => {
        const decoder = tapDecoder(numberDecoder, value => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (value === 0) throw new Error('Value must not be zero');
        });

        expect(() => decoder.decode(new Uint8Array([0]))).toThrow('Value must not be zero');
    });

    it('preserves the fixed size of the decoder', () => {
        const decoder = tapDecoder(numberDecoder, () => {});
        expect(decoder.fixedSize).toBe(1);
    });
});

describe('tapCodec', () => {
    it('observes values on both sides and round-trips unchanged', () => {
        const encoded: number[] = [];
        const decoded: number[] = [];
        const codec = tapCodec(
            numberCodec,
            value => {
                encoded.push(value);
            },
            value => {
                decoded.push(value);
            },
        );

        const bytes = codec.encode(42);
        expect(bytes).toStrictEqual(new Uint8Array([42]));
        expect(codec.decode(bytes)).toBe(42);
        expect(encoded).toStrictEqual([42]);
        expect(decoded).toStrictEqual([42]);
    });

    it('leaves decoding untouched when no decode tap is provided', () => {
        const codec = tapCodec(numberCodec, () => {
            throw new Error('should not be called on decode');
        });

        expect(codec.decode(new Uint8Array([42]))).toBe(42);
    });

    it('aborts encoding when the encode tap throws', () => {
        const codec = tapCodec(numberCodec, value => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (value > 100) throw new Error('Value must not exceed 100');
        });

        expect(() => codec.encode(200)).toThrow('Value must not exceed 100');
    });

    it('aborts decoding when the decode tap throws', () => {
        const codec = tapCodec(
            numberCodec,
            () => {},
            value => {
                // eslint-disable-next-line jest/no-conditional-in-test
                if (value === 0) throw new Error('Value must not be zero');
            },
        );

        expect(() => codec.decode(new Uint8Array([0]))).toThrow('Value must not be zero');
    });
});
