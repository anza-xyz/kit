import type { DecimalFixedPoint } from '../decimal/core';
import { assertIsDecimalFixedPoint, isDecimalFixedPoint } from '../decimal/guards';
import type { Signedness } from '../signedness';

// [DESCRIBE] isDecimalFixedPoint.
{
    // It narrows to a fully-generic DecimalFixedPoint when no shape is provided.
    {
        const value = {} as unknown;
        if (isDecimalFixedPoint(value)) {
            value satisfies DecimalFixedPoint<Signedness, number, number>;
        }
    }

    // It narrows progressively as shape arguments are added.
    {
        const value = {} as unknown;
        if (isDecimalFixedPoint(value, 'unsigned')) {
            value satisfies DecimalFixedPoint<'unsigned', number, number>;
        }
    }
    {
        const value = {} as unknown;
        if (isDecimalFixedPoint(value, 'unsigned', 64)) {
            value satisfies DecimalFixedPoint<'unsigned', 64, number>;
        }
    }
    {
        const value = {} as unknown;
        if (isDecimalFixedPoint(value, 'unsigned', 64, 6)) {
            value satisfies DecimalFixedPoint<'unsigned', 64, 6>;
        }
    }

    // It preserves the generic default at a position when `undefined` is passed.
    {
        const value = {} as unknown;
        if (isDecimalFixedPoint(value, undefined, 64)) {
            value satisfies DecimalFixedPoint<Signedness, 64, number>;
        }
    }
    {
        const value = {} as unknown;
        if (isDecimalFixedPoint(value, undefined, undefined, 6)) {
            value satisfies DecimalFixedPoint<Signedness, number, 6>;
        }
    }
}

// [DESCRIBE] assertIsDecimalFixedPoint.
{
    // It narrows to a fully-generic DecimalFixedPoint when no shape is provided.
    {
        const value = {} as unknown;
        assertIsDecimalFixedPoint(value);
        value satisfies DecimalFixedPoint<Signedness, number, number>;
    }

    // It narrows progressively as shape arguments are added.
    {
        const value = {} as unknown;
        assertIsDecimalFixedPoint(value, 'unsigned');
        value satisfies DecimalFixedPoint<'unsigned', number, number>;
    }
    {
        const value = {} as unknown;
        assertIsDecimalFixedPoint(value, 'unsigned', 64);
        value satisfies DecimalFixedPoint<'unsigned', 64, number>;
    }
    {
        const value = {} as unknown;
        assertIsDecimalFixedPoint(value, 'unsigned', 64, 6);
        value satisfies DecimalFixedPoint<'unsigned', 64, 6>;
    }

    // It preserves the generic default at a position when `undefined` is passed.
    {
        const value = {} as unknown;
        assertIsDecimalFixedPoint(value, undefined, 64);
        value satisfies DecimalFixedPoint<Signedness, 64, number>;
    }
    {
        const value = {} as unknown;
        assertIsDecimalFixedPoint(value, undefined, undefined, 6);
        value satisfies DecimalFixedPoint<Signedness, number, 6>;
    }
}
