import { getSignatoriesComparator } from '../codecs/preamble-common';

describe('getSignatoriesComparator', () => {
    function arr(a: ArrayLike<number>) {
        return new Uint8Array(a);
    }
    it('sorts byte arrays lexicographically', () => {
        expect(
            [
                arr([0, 0]),
                arr([1]),
                arr([1, 1, 0]),
                arr([0, 1, 0]),
                arr([0, 0, 0]),
                arr([1, 1, 1]),
                arr([0]),
                arr([0, 1, 1]),
                arr([0, 0, 1]),
            ].toSorted(getSignatoriesComparator()),
        ).toEqual([
            arr([0]),
            arr([1]),
            arr([0, 0]),
            arr([0, 0, 0]),
            arr([0, 0, 1]),
            arr([0, 1, 0]),
            arr([0, 1, 1]),
            arr([1, 1, 0]),
            arr([1, 1, 1]),
        ]);
    });
});
