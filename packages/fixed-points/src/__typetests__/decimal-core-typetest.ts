import type { DecimalFixedPoint } from '../decimal/core';

// [DESCRIBE] DecimalFixedPoint.
{
    // It preserves the Signedness, TotalBits, and Decimals type parameters.
    {
        const value = {} as DecimalFixedPoint<'unsigned', 64, 6>;
        value.signedness satisfies 'unsigned';
        value.totalBits satisfies 64;
        value.decimals satisfies 6;
        value.kind satisfies 'decimalFixedPoint';
        value.raw satisfies bigint;
    }

    // A concretely-parameterised value satisfies a generically-parameterised type.
    {
        const value = {} as DecimalFixedPoint<'unsigned', 64, 6>;
        value satisfies DecimalFixedPoint<'unsigned', number, number>;
    }

    // Fields are readonly.
    {
        const value = {} as DecimalFixedPoint<'unsigned', 64, 6>;
        // @ts-expect-error decimals is readonly.
        value.decimals = 16;
        // @ts-expect-error kind is readonly.
        value.kind = 'binaryFixedPoint';
        // @ts-expect-error raw is readonly.
        value.raw = 1n;
        // @ts-expect-error signedness is readonly.
        value.signedness = 'signed';
        // @ts-expect-error totalBits is readonly.
        value.totalBits = 32;
    }
}
