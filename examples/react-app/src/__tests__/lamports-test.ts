import { lamports } from '@solana/kit';

import { solStringToLamports } from '../lamports';

describe('solStringToLamports', () => {
    it('converts a whole-SOL string to lamports', () => {
        expect(solStringToLamports('1')).toBe(lamports(1_000_000_000n));
    });

    it('converts a fractional-SOL string to lamports', () => {
        expect(solStringToLamports('1.5')).toBe(lamports(1_500_000_000n));
    });

    it('converts a string at the full 9 decimal places of precision', () => {
        expect(solStringToLamports('0.000000001')).toBe(lamports(1n));
    });

    it('throws a friendly error when the SOL amount has more than 9 decimal places', () => {
        expect(() => solStringToLamports('0.0000000001')).toThrow('Invalid SOL amount: use at most 9 decimal places.');
    });
});
