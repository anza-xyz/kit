import { getLifetimeTokenDecoder, getLifetimeTokenEncoder } from '../lifetime-token';

describe('getOptionalLifetimeTokenEncoder', () => {
    it('should encode a 23 byte base58 string', () => {
        const token = '3EKkiwNLWqoUbzFkPrmKbtUB4EweE6f4STzevYUmezeL';
        expect(getLifetimeTokenEncoder().encode(token)).toStrictEqual(new Uint8Array(32).fill(33));
    });

    it('should encode undefined as 32 zero bytes', () => {
        expect(getLifetimeTokenEncoder().encode(undefined)).toStrictEqual(new Uint8Array(32));
    });
});

describe('getLifetimeTokenDecoder', () => {
    it('should decode a valid base58 encoded string', () => {
        const encoded = new Uint8Array(32).fill(33);
        expect(getLifetimeTokenDecoder().decode(encoded)).toBe('3EKkiwNLWqoUbzFkPrmKbtUB4EweE6f4STzevYUmezeL');
    });
});
