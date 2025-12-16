import { toArrayBuffer } from '../array-buffers';

describe('toArrayBuffer', () => {
    it('converts shared array buffers to non-shared copies', () => {
        const sharedArrayBuffer = new SharedArrayBuffer(1024);
        const byteArray = new Uint8Array(sharedArrayBuffer);
        const arrayBuffer = toArrayBuffer(byteArray);
        expect(arrayBuffer).not.toBeInstanceOf(SharedArrayBuffer);
    });
    it('returns the buffer without modification when no slice is specified', () => {
        const byteArray = new Uint8Array([1, 2, 3]);
        expect(toArrayBuffer(byteArray)).toBe(byteArray.buffer);
    });
    it.each([
        [0, 3],
        [-3, 3],
    ])(
        'returns the buffer without modification when the specified slice encompasses the entire data (offset: %d, length: %d)',
        (offset, length) => {
            const byteArray = new Uint8Array([1, 2, 3]);
            expect(toArrayBuffer(byteArray, offset, length)).toBe(byteArray.buffer);
        },
    );
    it.each([
        [-3, 0],
        [-3, 1],
        [-3, 2],
        [-3, 2],
        [-1, 0],
        [-1, 1],
        [-1, 2],
        [-2, 0],
        [-2, 1],
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 0],
        [2, 1],
        [2, 2],
    ])('returns a new buffer when the slice reduces the data set (offset: %d, length: %d)', (offset, length) => {
        const byteArray = new Uint8Array([1, 2, 3]);
        expect(toArrayBuffer(byteArray, offset, length)).not.toBe(byteArray.buffer);
    });
});
