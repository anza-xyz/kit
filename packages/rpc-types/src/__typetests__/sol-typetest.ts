import { FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder, ReadonlyUint8Array } from '@solana/codecs-core';
import { type DecimalFixedPoint } from '@solana/fixed-points';

import { type Lamports } from '../lamports';
import { getSolCodec, getSolDecoder, getSolEncoder, lamportsToSol, type Sol, sol, solToLamports } from '../sol';

// Sol is the canonical unsigned 64-bit decimal fixed-point with 9 decimals.
{
    const value = {} as Sol;
    value satisfies DecimalFixedPoint<'unsigned', 64, 9>;
}

// sol() returns a Sol.
{
    sol('1') satisfies Sol;
    sol('1', 'round') satisfies Sol;
}

// solToLamports returns a Lamports.
{
    solToLamports({} as Sol) satisfies Lamports;
}

// lamportsToSol returns a Sol.
{
    lamportsToSol({} as Lamports) satisfies Sol;
}

// getSolEncoder accepts both Sol and Lamports.
{
    const encoder = getSolEncoder();
    encoder satisfies FixedSizeEncoder<Lamports | Sol, 8>;
    encoder.fixedSize satisfies 8;
    encoder.encode({} as Sol) satisfies ReadonlyUint8Array;
    encoder.encode({} as Lamports) satisfies ReadonlyUint8Array;
}

// getSolDecoder always returns Sol.
{
    const decoder = getSolDecoder();
    decoder satisfies FixedSizeDecoder<Sol, 8>;
    decoder.fixedSize satisfies 8;
    decoder.decode(null as unknown as ReadonlyUint8Array) satisfies Sol;
}

// getSolCodec encodes from Sol | Lamports, decodes to Sol.
{
    const codec = getSolCodec();
    codec satisfies FixedSizeCodec<Lamports | Sol, Sol, 8>;
    codec.fixedSize satisfies 8;
    codec.encode({} as Sol) satisfies ReadonlyUint8Array;
    codec.encode({} as Lamports) satisfies ReadonlyUint8Array;
    codec.decode(null as unknown as ReadonlyUint8Array) satisfies Sol;
}
