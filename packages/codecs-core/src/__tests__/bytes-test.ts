import { fixBytes, mergeBytes, padBytes } from '../bytes';

describe('mergeBytes', () => {
    it('can merge multiple arrays of bytes together', () => {
        const merged = mergeBytes([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5]), new Uint8Array([6, 7, 8, 9])]);
        expect(merged).toStrictEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });
    it('reuses the original byte array when applicable', () => {
        const emptyBytesA = new Uint8Array();
        const emptyBytesB = new Uint8Array();
        const nonEmptyBytesA = new Uint8Array([1, 2, 3]);
        const nonEmptyBytesB = new Uint8Array([4, 5, 6]);

        // A new byte array is created when merging an empty array.
        expect(mergeBytes([])).toStrictEqual(new Uint8Array(0));

        // The first empty byte array is returned when merging multiple empty byte arrays.
        expect(mergeBytes([emptyBytesA])).toBe(emptyBytesA);
        expect(mergeBytes([emptyBytesA, emptyBytesB])).toBe(emptyBytesA);
        expect(mergeBytes([emptyBytesB, emptyBytesA])).toBe(emptyBytesB);

        // The first non-empty byte array is returned when merging multiple byte arrays such that only one is non-empty.
        expect(mergeBytes([nonEmptyBytesA, emptyBytesA, emptyBytesB])).toBe(nonEmptyBytesA);
        expect(mergeBytes([emptyBytesA, emptyBytesB, nonEmptyBytesA])).toBe(nonEmptyBytesA);

        // A new byte array is created when merging multiple non-empty byte arrays.
        expect(mergeBytes([nonEmptyBytesA, nonEmptyBytesB, emptyBytesA])).not.toBe(nonEmptyBytesA);
        expect(mergeBytes([nonEmptyBytesA, nonEmptyBytesB, emptyBytesA])).not.toBe(nonEmptyBytesB);
    });
});

describe('padBytes', () => {
    it('can pad an array of bytes to the specified length', () => {
        expect(padBytes(new Uint8Array([1, 2, 3]), 5)).toStrictEqual(new Uint8Array([1, 2, 3, 0, 0]));
        expect(padBytes(new Uint8Array([1, 2, 3]), 2)).toStrictEqual(new Uint8Array([1, 2, 3]));
    });
    it('reuses the original byte array when applicable', () => {
        const bytes = new Uint8Array([1, 2, 3, 4, 5]);
        expect(padBytes(bytes, 5)).toBe(bytes);
        expect(padBytes(bytes, 2)).toBe(bytes);
        expect(padBytes(bytes, 10)).not.toBe(bytes);
    });
});

describe('fixBytes', () => {
    it('can fix an array of bytes to the specified length', () => {
        expect(fixBytes(new Uint8Array([1, 2, 3]), 5)).toStrictEqual(new Uint8Array([1, 2, 3, 0, 0]));
        expect(fixBytes(new Uint8Array([1, 2, 3]), 2)).toStrictEqual(new Uint8Array([1, 2]));
    });
    it('reuses the original byte array when applicable', () => {
        const bytes = new Uint8Array([1, 2, 3, 4, 5]);
        expect(fixBytes(bytes, 5)).toBe(bytes);
        expect(fixBytes(bytes, 2)).not.toBe(bytes);
        expect(fixBytes(bytes, 10)).not.toBe(bytes);
    });
});

describe('equalBytes', () => {
    it('returns true for equal byte arrays', () => {
        const bytes1 = new Uint8Array([0x01, 0x02, 0x03]);
        const bytes2 = new Uint8Array([0x01, 0x02, 0x03]);
        expect(equalBytes(bytes1, bytes2)).toBe(true);
    });

    it('returns false for arrays with different lengths', () => {
        const bytes1 = new Uint8Array([0x01, 0x02]);
        const bytes2 = new Uint8Array([0x01, 0x02, 0x03]);
        expect(equalBytes(bytes1, bytes2)).toBe(false);
    });

    it('returns false for arrays with different contents', () => {
        const bytes1 = new Uint8Array([0x01, 0x02, 0x03]);
        const bytes2 = new Uint8Array([0x01, 0x02, 0x04]);
        expect(equalBytes(bytes1, bytes2)).toBe(false);
    });

    it('returns true for empty arrays', () => {
        const bytes1 = new Uint8Array([]);
        const bytes2 = new Uint8Array([]);
        expect(equalBytes(bytes1, bytes2)).toBe(true);
    });
});
