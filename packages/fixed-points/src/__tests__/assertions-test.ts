import { getRawRange } from '../assertions';

describe('getRawRange', () => {
    it('returns the range for signed widths', () => {
        expect(getRawRange('signed', 8)).toEqual({ max: 127n, min: -128n });
        expect(getRawRange('signed', 16)).toEqual({ max: 32767n, min: -32768n });
        expect(getRawRange('signed', 64)).toEqual({
            max: 9223372036854775807n,
            min: -9223372036854775808n,
        });
    });

    it('returns the range for unsigned widths', () => {
        expect(getRawRange('unsigned', 8)).toEqual({ max: 255n, min: 0n });
        expect(getRawRange('unsigned', 16)).toEqual({ max: 65535n, min: 0n });
        expect(getRawRange('unsigned', 64)).toEqual({
            max: 18446744073709551615n,
            min: 0n,
        });
    });

    it('supports any arbitrary bit widths', () => {
        expect(getRawRange('unsigned', 123)).toEqual({
            max: (1n << 123n) - 1n,
            min: 0n,
        });
        expect(getRawRange('signed', 123)).toEqual({
            max: (1n << 122n) - 1n,
            min: -(1n << 122n),
        });
    });
});
