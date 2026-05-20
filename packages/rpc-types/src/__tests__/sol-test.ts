import {
    SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS,
    SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import { lamports } from '../lamports';
import { getSolCodec, getSolDecoder, getSolEncoder, lamportsToSol, sol, solToLamports } from '../sol';

describe('sol', () => {
    it('parses whole numbers of SOL', () => {
        expect(sol('1').raw).toBe(1_000_000_000n);
    });

    it('parses fractional SOL amounts', () => {
        expect(sol('1.5').raw).toBe(1_500_000_000n);
    });

    it('parses zero', () => {
        expect(sol('0').raw).toBe(0n);
    });

    it('parses the smallest representable amount (one Lamport)', () => {
        expect(sol('0.000000001').raw).toBe(1n);
    });

    it('throws STRICT_MODE_PRECISION_LOSS by default when more than 9 decimals are supplied', () => {
        expect(() => sol('1.1234567891')).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
                kind: 'decimalFixedPoint',
                operation: 'fromString',
            }),
        );
    });

    it('rounds when a rounding mode is supplied', () => {
        expect(sol('1.1234567891', 'round').raw).toBe(1_123_456_789n);
        expect(sol('1.1234567899', 'floor').raw).toBe(1_123_456_789n);
        expect(sol('1.1234567891', 'ceil').raw).toBe(1_123_456_790n);
    });

    it('throws VALUE_OUT_OF_RANGE when the amount exceeds u64', () => {
        // u64 max / 10^9 = ~18.45 billion SOL; just above that overflows.
        expect(() => sol('18446744074')).toThrow(
            new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
                kind: 'decimalFixedPoint',
                max: 18_446_744_073_709_551_615n,
                min: 0n,
                raw: 18_446_744_074_000_000_000n,
                signedness: 'unsigned',
                totalBits: 64,
            }),
        );
    });
});

describe('solToLamports', () => {
    it('returns the raw bigint as a Lamports-branded value', () => {
        expect(solToLamports(sol('1'))).toBe(1_000_000_000n);
    });

    it('converts zero SOL to zero Lamports', () => {
        expect(solToLamports(sol('0'))).toBe(0n);
    });

    it('converts fractional SOL to the correct Lamports', () => {
        expect(solToLamports(sol('1.5'))).toBe(1_500_000_000n);
    });

    it('handles the smallest amount (1 Lamport)', () => {
        expect(solToLamports(sol('0.000000001'))).toBe(1n);
    });
});

describe('lamportsToSol', () => {
    it('converts zero Lamports to a Sol value of zero', () => {
        expect(lamportsToSol(lamports(0n)).raw).toBe(0n);
    });

    it('converts one billion Lamports to one SOL', () => {
        expect(lamportsToSol(lamports(1_000_000_000n)).raw).toBe(1_000_000_000n);
    });

    it('preserves the Sol shape metadata', () => {
        const value = lamportsToSol(lamports(1_500_000_000n));
        expect(value.kind).toBe('decimalFixedPoint');
        expect(value.signedness).toBe('unsigned');
        expect(value.totalBits).toBe(64);
        expect(value.decimals).toBe(9);
    });

    it('accepts the maximum Lamports value', () => {
        const maxU64 = 18_446_744_073_709_551_615n;
        expect(lamportsToSol(lamports(maxU64)).raw).toBe(maxU64);
    });
});

describe('round-tripping Sol and Lamports', () => {
    it.each([0n, 1n, 1_000_000_000n, 1_500_000_000n, 18_446_744_073_709_551_615n])(
        'round-trips %s Lamports through Sol',
        raw => {
            expect(solToLamports(lamportsToSol(lamports(raw)))).toBe(raw);
        },
    );
});

describe('getSolEncoder', () => {
    it('encodes a Sol value to 8 little-endian bytes', () => {
        // 1.5 SOL = 1_500_000_000 lamports = 0x59682F00 in u64 LE.
        expect(getSolEncoder().encode(sol('1.5'))).toEqual(
            new Uint8Array([0x00, 0x2f, 0x68, 0x59, 0x00, 0x00, 0x00, 0x00]),
        );
    });

    it('also accepts a Lamports value', () => {
        expect(getSolEncoder().encode(lamports(1_500_000_000n))).toEqual(
            new Uint8Array([0x00, 0x2f, 0x68, 0x59, 0x00, 0x00, 0x00, 0x00]),
        );
    });

    it('produces identical bytes for equivalent Sol and Lamports inputs', () => {
        const fromSol = getSolEncoder().encode(sol('1.5'));
        const fromLamports = getSolEncoder().encode(lamports(1_500_000_000n));
        expect(fromSol).toEqual(fromLamports);
    });

    it('reports a fixed size of 8', () => {
        expect(getSolEncoder().fixedSize).toBe(8);
    });
});

describe('getSolDecoder', () => {
    it('decodes 8 little-endian bytes into a Sol value', () => {
        const value = getSolDecoder().decode(new Uint8Array([0x00, 0x2f, 0x68, 0x59, 0x00, 0x00, 0x00, 0x00]));
        expect(value.raw).toBe(1_500_000_000n);
    });

    it('returns a Sol with the correct shape metadata', () => {
        const value = getSolDecoder().decode(new Uint8Array([0x00, 0x2f, 0x68, 0x59, 0x00, 0x00, 0x00, 0x00]));
        expect(value.kind).toBe('decimalFixedPoint');
        expect(value.signedness).toBe('unsigned');
        expect(value.totalBits).toBe(64);
        expect(value.decimals).toBe(9);
    });

    it('reports a fixed size of 8', () => {
        expect(getSolDecoder().fixedSize).toBe(8);
    });
});

describe('getSolCodec', () => {
    it('round-trips a Sol value', () => {
        const codec = getSolCodec();
        const input = sol('42.5');
        expect(codec.decode(codec.encode(input))).toEqual(input);
    });

    it('round-trips a Lamports value as Sol', () => {
        const codec = getSolCodec();
        expect(codec.decode(codec.encode(lamports(1_500_000_000n)))).toEqual(sol('1.5'));
    });
});
