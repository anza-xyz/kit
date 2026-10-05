import { isSmallOrderPointEncoding } from '../small-order';

function hexToBytes(hex: string): Uint8Array {
    return new Uint8Array(hex.match(/../g)!.map(byte => parseInt(byte, 16)));
}

describe('isSmallOrderPointEncoding', () => {
    it.each([
        // The canonical encodings of the 8 small-order points.
        '0100000000000000000000000000000000000000000000000000000000000000',
        'ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f',
        '0000000000000000000000000000000000000000000000000000000000000000',
        '0000000000000000000000000000000000000000000000000000000000000080',
        '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05',
        '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc85',
        'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a',
        'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac03fa',
        // Non-canonical encodings of small-order points.
        '0100000000000000000000000000000000000000000000000000000000000080', // Identity, x sign bit set
        'ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // Order 2, x sign bit set
        'edffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f', // y = p
        'edffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // y = p, x sign bit set
        'eeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f', // y = p + 1
        'eeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // y = p + 1, x sign bit set
    ])('returns `true` for `%s`', hex => {
        expect(isSmallOrderPointEncoding(hexToBytes(hex))).toBe(true);
    });
    it.each([
        // The base point.
        '5866666666666666666666666666666666666666666666666666666666666666',
        // An ordinary public key.
        '1d0e93864dcc815fc3f286180911d00a3fd206de31a1c94287cb43f05fc9f2b5',
    ])('returns `false` for `%s`', hex => {
        expect(isSmallOrderPointEncoding(hexToBytes(hex))).toBe(false);
    });
    it('returns `false` for inputs that are not 32 bytes long', () => {
        expect(isSmallOrderPointEncoding(new Uint8Array(31))).toBe(false);
        expect(isSmallOrderPointEncoding(new Uint8Array(33))).toBe(false);
    });
});
