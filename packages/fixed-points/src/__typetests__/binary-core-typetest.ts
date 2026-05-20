import type { BinaryFixedPoint } from '../binary/core';

// [DESCRIBE] BinaryFixedPoint.
{
    // It preserves the Signedness, TotalBits, and FractionalBits type parameters.
    {
        const value = {} as BinaryFixedPoint<'signed', 16, 15>;
        value.signedness satisfies 'signed';
        value.totalBits satisfies 16;
        value.fractionalBits satisfies 15;
        value.kind satisfies 'binaryFixedPoint';
        value.raw satisfies bigint;
    }

    // A concretely-parameterised value satisfies a generically-parameterised type.
    {
        const value = {} as BinaryFixedPoint<'signed', 16, 15>;
        value satisfies BinaryFixedPoint<'signed', number, number>;
    }

    // Fields are readonly.
    {
        const value = {} as BinaryFixedPoint<'signed', 16, 8>;
        // @ts-expect-error fractionalBits is readonly.
        value.fractionalBits = 16;
        // @ts-expect-error kind is readonly.
        value.kind = 'decimalFixedPoint';
        // @ts-expect-error raw is readonly.
        value.raw = 1n;
        // @ts-expect-error signedness is readonly.
        value.signedness = 'unsigned';
        // @ts-expect-error totalBits is readonly.
        value.totalBits = 32;
    }
}
