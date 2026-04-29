import {
    type DecimalFixedPoint,
    rescaleDecimalFixedPoint,
    toSignedDecimalFixedPoint,
    toUnsignedDecimalFixedPoint,
} from '../decimal';

// [DESCRIBE] toUnsignedDecimalFixedPoint.
{
    // It returns an unsigned value regardless of the input's signedness.
    {
        const fromSigned = {} as DecimalFixedPoint<'signed', 64, 2>;
        toUnsignedDecimalFixedPoint(fromSigned) satisfies DecimalFixedPoint<'unsigned', 64, 2>;
        const fromUnsigned = {} as DecimalFixedPoint<'unsigned', 64, 2>;
        toUnsignedDecimalFixedPoint(fromUnsigned) satisfies DecimalFixedPoint<'unsigned', 64, 2>;
    }

    // It preserves totalBits and decimals in the return type.
    {
        const value = {} as DecimalFixedPoint<'signed', 8, 2>;
        toUnsignedDecimalFixedPoint(value) satisfies DecimalFixedPoint<'unsigned', 8, 2>;
    }
}

// [DESCRIBE] toSignedDecimalFixedPoint.
{
    // It returns a signed value regardless of the input's signedness.
    {
        const fromSigned = {} as DecimalFixedPoint<'signed', 64, 2>;
        toSignedDecimalFixedPoint(fromSigned) satisfies DecimalFixedPoint<'signed', 64, 2>;
        const fromUnsigned = {} as DecimalFixedPoint<'unsigned', 64, 2>;
        toSignedDecimalFixedPoint(fromUnsigned) satisfies DecimalFixedPoint<'signed', 64, 2>;
    }

    // It preserves totalBits and decimals in the return type.
    {
        const value = {} as DecimalFixedPoint<'unsigned', 8, 2>;
        toSignedDecimalFixedPoint(value) satisfies DecimalFixedPoint<'signed', 8, 2>;
    }
}

// [DESCRIBE] rescaleDecimalFixedPoint.
{
    // It preserves the input signedness and picks up the new totalBits and decimals.
    {
        const value = {} as DecimalFixedPoint<'unsigned', 128, 18>;
        rescaleDecimalFixedPoint(value, 64, 6) satisfies DecimalFixedPoint<'unsigned', 64, 6>;
    }
    {
        const value = {} as DecimalFixedPoint<'signed', 16, 2>;
        rescaleDecimalFixedPoint(value, 64, 9) satisfies DecimalFixedPoint<'signed', 64, 9>;
    }

    // It accepts an optional RoundingMode as its fourth argument.
    {
        const value = {} as DecimalFixedPoint<'unsigned', 128, 18>;
        rescaleDecimalFixedPoint(value, 64, 6, 'floor') satisfies DecimalFixedPoint<'unsigned', 64, 6>;
    }
}
