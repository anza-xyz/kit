import {
    createCodec,
    createDecoder,
    createEncoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
} from '../codec';
import { ReadonlyUint8Array } from '../readonly-uint8array';
import { tapCodecBytes, tapDecoderBytes, tapEncoderBytes } from '../tap-codec-bytes';

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

describe('tapEncoderBytes', () => {
    it('observes the encoded bytes and offsets after writing without modifying them', () => {
        const windows: number[][] = [];
        const encoder = tapEncoderBytes(numberEncoder, (bytes, preOffset, postOffset) => {
            windows.push([...bytes.slice(preOffset, postOffset)]);
        });

        expect(encoder.encode(42)).toStrictEqual(new Uint8Array([42]));
        expect(windows).toStrictEqual([[42]]);
    });

    it('reports the correct pre and post offsets', () => {
        const offsets: [number, number][] = [];
        const encoder = tapEncoderBytes(numberEncoder, (_bytes, preOffset, postOffset) => {
            offsets.push([preOffset, postOffset]);
        });

        encoder.write(42, new Uint8Array(4), 2);
        expect(offsets).toStrictEqual([[2, 3]]);
    });

    it('aborts encoding when the tap throws', () => {
        const encoder = tapEncoderBytes(numberEncoder, bytes => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (bytes[0] > 1) throw new Error('Expected a 0 or a 1');
        });

        expect(() => encoder.encode(2)).toThrow('Expected a 0 or a 1');
    });

    it('preserves the fixed size of the encoder', () => {
        const encoder = tapEncoderBytes(numberEncoder, () => {});
        expect(encoder.fixedSize).toBe(1);
    });
});

describe('tapDecoderBytes', () => {
    it('observes the raw bytes before decoding without modifying them', () => {
        const observed: number[] = [];
        const decoder = tapDecoderBytes(numberDecoder, (bytes, offset) => {
            observed.push(bytes[offset]);
        });

        expect(decoder.decode(new Uint8Array([42]))).toBe(42);
        expect(observed).toStrictEqual([42]);
    });

    it('observes the raw bytes at a non-zero offset', () => {
        const observed: number[] = [];
        const decoder = tapDecoderBytes(numberDecoder, (bytes, offset) => {
            observed.push(bytes[offset]);
        });

        expect(decoder.read(new Uint8Array([0, 0, 42]), 2)).toStrictEqual([42, 3]);
        expect(observed).toStrictEqual([42]);
    });

    it('aborts decoding when the tap throws', () => {
        const decoder = tapDecoderBytes(numberDecoder, (bytes, offset) => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (bytes[offset] > 1) throw new Error('Expected a 0 or a 1 for booleans');
        });

        expect(() => decoder.decode(new Uint8Array([2]))).toThrow('Expected a 0 or a 1 for booleans');
    });

    it('preserves the fixed size of the decoder', () => {
        const decoder = tapDecoderBytes(numberDecoder, () => {});
        expect(decoder.fixedSize).toBe(1);
    });
});

describe('tapCodecBytes', () => {
    it('observes bytes on both sides and round-trips unchanged', () => {
        const encoded: number[] = [];
        const decoded: number[] = [];
        const codec = tapCodecBytes(
            numberCodec,
            (bytes, preOffset, postOffset) => {
                encoded.push(...bytes.slice(preOffset, postOffset));
            },
            (bytes, offset) => {
                decoded.push(bytes[offset]);
            },
        );

        const bytes = codec.encode(42);
        expect(bytes).toStrictEqual(new Uint8Array([42]));
        expect(codec.decode(bytes)).toBe(42);
        expect(encoded).toStrictEqual([42]);
        expect(decoded).toStrictEqual([42]);
    });

    it('leaves decoding untouched when no decode tap is provided', () => {
        const codec = tapCodecBytes(numberCodec, () => {
            throw new Error('should not be called on decode');
        });

        expect(codec.decode(new Uint8Array([42]))).toBe(42);
    });

    it('aborts encoding when the encode tap throws', () => {
        const codec = tapCodecBytes(numberCodec, bytes => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (bytes[0] > 1) throw new Error('Expected a 0 or a 1 for booleans');
        });

        expect(() => codec.encode(2)).toThrow('Expected a 0 or a 1 for booleans');
    });

    it('aborts decoding when the decode tap throws', () => {
        const codec = tapCodecBytes(
            numberCodec,
            () => {},
            (bytes, offset) => {
                // eslint-disable-next-line jest/no-conditional-in-test
                if (bytes[offset] > 1) throw new Error('Expected a 0 or a 1 for booleans');
            },
        );

        expect(() => codec.decode(new Uint8Array([2]))).toThrow('Expected a 0 or a 1 for booleans');
    });
});
