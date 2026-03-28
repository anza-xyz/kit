import type { GetAccountInfoApi } from '@solana/rpc-api';
import type { Rpc } from '@solana/rpc-spec';
import type { Lamports } from '@solana/rpc-types';

import { fetchSysvarRent, getSysvarRentCodec } from '../rent';
import { createLocalhostSolanaRpc } from './__setup__';

describe('rent', () => {
    let rpc: Rpc<GetAccountInfoApi>;
    beforeEach(() => {
        rpc = createLocalhostSolanaRpc();
    });
    it('decode', () => {
        // prettier-ignore
        const rentState = new Uint8Array([
            0, 225, 245, 5, 0, 0, 0, 0, // lamportsPerByteYear
            0, 225, 245, 5, 0, 0, 0, 0, // exemptionThreshold
            8,                          // burnPercent
        ]);
        expect(getSysvarRentCodec().decode(rentState)).toMatchObject({
            burnPercent: 8,
            exemptionThreshold: 4.94065646e-316,
            lamportsPerByteYear: 100_000_000n,
        });
    });
    it('maintains backward compatibility by aliasing lamportsPerByteYear', () => {
        const rentState = new Uint8Array([
            0, 225, 245, 5, 0, 0, 0, 0, // lamportsPerByte
            0, 0, 0, 0, 0, 0, 0, 0,     // exemptionThreshold (ignored)
            0,                          // burnPercent (ignored)
        ]);
        const decoded = getSysvarRentCodec().decode(rentState);
        expect(decoded.lamportsPerByteYear).toBeDefined();
        expect(decoded.lamportsPerByteYear).toStrictEqual(decoded.lamportsPerByte);
    });
    it('encode and decode roundtrip produces consistent data', () => {
        const rent = {
            burnPercent: 50,
            exemptionThreshold: 1.0,
            lamportsPerByte: 6_960n as Lamports,
        };
        const codec = getSysvarRentCodec();
        const encoded = codec.encode(rent);
        const decoded = codec.decode(encoded);
        expect(decoded.lamportsPerByte).toBe(6_960n);
        expect(decoded.exemptionThreshold).toBe(1.0);
        expect(decoded.burnPercent).toBe(50);
        expect(decoded.lamportsPerByteYear).toBe(decoded.lamportsPerByte);
    });
    it('binary layout is exactly 17 bytes (u64 + f64 + u8)', () => {
        const rent = {
            burnPercent: 0,
            exemptionThreshold: 1.0,
            lamportsPerByte: 6_960n as Lamports,
        };
        const encoded = getSysvarRentCodec().encode(rent);
        expect(encoded.byteLength).toBe(17);
    });
    it('decodes post-SIMD-0194 mainnet values (lamportsPerByte=6960, exemptionThreshold=1.0)', () => {
        // prettier-ignore
        const postSimd194State = new Uint8Array([
            48, 27, 0, 0, 0, 0, 0, 0,       // lamportsPerByte = 6960 (little-endian u64)
            0, 0, 0, 0, 0, 0, 240, 63,      // exemptionThreshold = 1.0 (IEEE 754 f64)
            50,                              // burnPercent = 50
        ]);
        const decoded = getSysvarRentCodec().decode(postSimd194State);
        expect(decoded.lamportsPerByte).toBe(6_960n);
        expect(decoded.exemptionThreshold).toBe(1.0);
        expect(decoded.burnPercent).toBe(50);
        expect(decoded.lamportsPerByteYear).toBe(6_960n);
    });
    it('fetch', async () => {
        expect.assertions(1);
        const rent = await fetchSysvarRent(rpc);
        expect(rent).toMatchObject({
            burnPercent: expect.any(Number),
            exemptionThreshold: expect.any(Number),
            lamportsPerByte: expect.any(BigInt),
            lamportsPerByteYear: expect.any(BigInt),
        });
    });
});
