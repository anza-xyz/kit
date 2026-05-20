import {
    absoluteDecimalFixedPoint,
    addDecimalFixedPoint,
    type DecimalFixedPoint,
    divideDecimalFixedPoint,
    multiplyDecimalFixedPoint,
    negateDecimalFixedPoint,
    subtractDecimalFixedPoint,
} from '../decimal';

// [DESCRIBE] addDecimalFixedPoint.
{
    // It preserves the full shape of both operands.
    {
        const a = {} as DecimalFixedPoint<'unsigned', 64, 6>;
        const b = {} as DecimalFixedPoint<'unsigned', 64, 6>;
        addDecimalFixedPoint(a, b) satisfies DecimalFixedPoint<'unsigned', 64, 6>;
    }

    // It rejects operands whose shapes differ at the type level.
    {
        const a = {} as DecimalFixedPoint<'unsigned', 64, 6>;
        const b = {} as DecimalFixedPoint<'unsigned', 64, 2>;
        // @ts-expect-error Operands must share the same shape.
        addDecimalFixedPoint(a, b);
    }
}

// [DESCRIBE] subtractDecimalFixedPoint.
{
    // It preserves the full shape of both operands.
    {
        const a = {} as DecimalFixedPoint<'signed', 32, 4>;
        const b = {} as DecimalFixedPoint<'signed', 32, 4>;
        subtractDecimalFixedPoint(a, b) satisfies DecimalFixedPoint<'signed', 32, 4>;
    }

    // It rejects operands whose shapes differ at the type level.
    {
        const a = {} as DecimalFixedPoint<'signed', 32, 4>;
        const b = {} as DecimalFixedPoint<'signed', 32, 2>;
        // @ts-expect-error Operands must share the same shape.
        subtractDecimalFixedPoint(a, b);
    }
}

// [DESCRIBE] multiplyDecimalFixedPoint.
{
    // It returns the shape of the first operand, regardless of the second.
    {
        const a = {} as DecimalFixedPoint<'unsigned', 64, 2>;
        const sameShape = {} as DecimalFixedPoint<'unsigned', 64, 2>;
        multiplyDecimalFixedPoint(a, sameShape) satisfies DecimalFixedPoint<'unsigned', 64, 2>;
    }
    {
        const a = {} as DecimalFixedPoint<'unsigned', 64, 2>;
        const differentShape = {} as DecimalFixedPoint<'unsigned', 128, 4>;
        multiplyDecimalFixedPoint(a, differentShape) satisfies DecimalFixedPoint<'unsigned', 64, 2>;
    }

    // It accepts a bigint as the second operand.
    {
        const a = {} as DecimalFixedPoint<'unsigned', 64, 2>;
        multiplyDecimalFixedPoint(a, 3n) satisfies DecimalFixedPoint<'unsigned', 64, 2>;
    }

    // It rejects a plain `number` as the second operand.
    {
        const a = {} as DecimalFixedPoint<'unsigned', 64, 2>;
        // @ts-expect-error Second operand must be a DecimalFixedPoint or bigint, not a number.
        multiplyDecimalFixedPoint(a, 3);
    }

    // It rejects a second operand whose signedness differs.
    {
        const a = {} as DecimalFixedPoint<'signed', 64, 2>;
        const wrongSignedness = {} as DecimalFixedPoint<'unsigned', 64, 2>;
        // @ts-expect-error Second operand must share the first operand's signedness.
        multiplyDecimalFixedPoint(a, wrongSignedness);
    }
}

// [DESCRIBE] divideDecimalFixedPoint.
{
    // It behaves like multiply for the return-type shape and second-operand rules.
    {
        const a = {} as DecimalFixedPoint<'unsigned', 64, 2>;
        const different = {} as DecimalFixedPoint<'unsigned', 128, 4>;
        divideDecimalFixedPoint(a, different) satisfies DecimalFixedPoint<'unsigned', 64, 2>;
        divideDecimalFixedPoint(a, 3n) satisfies DecimalFixedPoint<'unsigned', 64, 2>;
    }
}

// [DESCRIBE] negateDecimalFixedPoint.
{
    // It accepts a signed operand.
    {
        const a = {} as DecimalFixedPoint<'signed', 32, 4>;
        negateDecimalFixedPoint(a) satisfies DecimalFixedPoint<'signed', 32, 4>;
    }

    // It rejects an unsigned operand at the type level.
    {
        const a = {} as DecimalFixedPoint<'unsigned', 64, 6>;
        // @ts-expect-error Only signed values can be negated.
        negateDecimalFixedPoint(a);
    }
}

// [DESCRIBE] absoluteDecimalFixedPoint.
{
    // It accepts both signednesses and preserves the shape.
    {
        const signed = {} as DecimalFixedPoint<'signed', 32, 4>;
        absoluteDecimalFixedPoint(signed) satisfies DecimalFixedPoint<'signed', 32, 4>;
        const unsigned = {} as DecimalFixedPoint<'unsigned', 64, 6>;
        absoluteDecimalFixedPoint(unsigned) satisfies DecimalFixedPoint<'unsigned', 64, 6>;
    }
}
