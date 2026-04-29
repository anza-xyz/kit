import {
    absoluteBinaryFixedPoint,
    addBinaryFixedPoint,
    type BinaryFixedPoint,
    divideBinaryFixedPoint,
    multiplyBinaryFixedPoint,
    negateBinaryFixedPoint,
    subtractBinaryFixedPoint,
} from '../binary';

// [DESCRIBE] addBinaryFixedPoint.
{
    // It preserves the full shape of both operands.
    {
        const a = {} as BinaryFixedPoint<'signed', 16, 15>;
        const b = {} as BinaryFixedPoint<'signed', 16, 15>;
        addBinaryFixedPoint(a, b) satisfies BinaryFixedPoint<'signed', 16, 15>;
    }

    // It rejects operands whose shapes differ at the type level.
    {
        const a = {} as BinaryFixedPoint<'signed', 16, 15>;
        const b = {} as BinaryFixedPoint<'signed', 16, 8>;
        // @ts-expect-error Operands must share the same shape.
        addBinaryFixedPoint(a, b);
    }
}

// [DESCRIBE] subtractBinaryFixedPoint.
{
    // It preserves the full shape of both operands.
    {
        const a = {} as BinaryFixedPoint<'unsigned', 32, 16>;
        const b = {} as BinaryFixedPoint<'unsigned', 32, 16>;
        subtractBinaryFixedPoint(a, b) satisfies BinaryFixedPoint<'unsigned', 32, 16>;
    }

    // It rejects operands whose shapes differ at the type level.
    {
        const a = {} as BinaryFixedPoint<'unsigned', 32, 16>;
        const b = {} as BinaryFixedPoint<'unsigned', 32, 8>;
        // @ts-expect-error Operands must share the same shape.
        subtractBinaryFixedPoint(a, b);
    }
}

// [DESCRIBE] multiplyBinaryFixedPoint.
{
    // It returns the shape of the first operand, regardless of the second.
    {
        const a = {} as BinaryFixedPoint<'signed', 16, 15>;
        const sameShape = {} as BinaryFixedPoint<'signed', 16, 15>;
        multiplyBinaryFixedPoint(a, sameShape) satisfies BinaryFixedPoint<'signed', 16, 15>;
    }
    {
        const a = {} as BinaryFixedPoint<'signed', 16, 15>;
        const differentShape = {} as BinaryFixedPoint<'signed', 32, 8>;
        multiplyBinaryFixedPoint(a, differentShape) satisfies BinaryFixedPoint<'signed', 16, 15>;
    }

    // It accepts a bigint as the second operand.
    {
        const a = {} as BinaryFixedPoint<'signed', 16, 15>;
        multiplyBinaryFixedPoint(a, 3n) satisfies BinaryFixedPoint<'signed', 16, 15>;
    }

    // It rejects a plain `number` as the second operand.
    {
        const a = {} as BinaryFixedPoint<'signed', 16, 15>;
        // @ts-expect-error Second operand must be a BinaryFixedPoint or bigint, not a number.
        multiplyBinaryFixedPoint(a, 3);
    }

    // It rejects a second operand whose signedness differs.
    {
        const a = {} as BinaryFixedPoint<'signed', 16, 15>;
        const wrongSignedness = {} as BinaryFixedPoint<'unsigned', 16, 15>;
        // @ts-expect-error Second operand must share the first operand's signedness.
        multiplyBinaryFixedPoint(a, wrongSignedness);
    }
}

// [DESCRIBE] divideBinaryFixedPoint.
{
    // It behaves like multiply for the return-type shape and second-operand rules.
    {
        const a = {} as BinaryFixedPoint<'signed', 16, 15>;
        const different = {} as BinaryFixedPoint<'signed', 32, 8>;
        divideBinaryFixedPoint(a, different) satisfies BinaryFixedPoint<'signed', 16, 15>;
        divideBinaryFixedPoint(a, 3n) satisfies BinaryFixedPoint<'signed', 16, 15>;
    }
}

// [DESCRIBE] negateBinaryFixedPoint.
{
    // It accepts a signed operand.
    {
        const a = {} as BinaryFixedPoint<'signed', 16, 15>;
        negateBinaryFixedPoint(a) satisfies BinaryFixedPoint<'signed', 16, 15>;
    }

    // It rejects an unsigned operand at the type level.
    {
        const a = {} as BinaryFixedPoint<'unsigned', 16, 15>;
        // @ts-expect-error Only signed values can be negated.
        negateBinaryFixedPoint(a);
    }
}

// [DESCRIBE] absoluteBinaryFixedPoint.
{
    // It accepts both signednesses and preserves the shape.
    {
        const signed = {} as BinaryFixedPoint<'signed', 16, 15>;
        absoluteBinaryFixedPoint(signed) satisfies BinaryFixedPoint<'signed', 16, 15>;
        const unsigned = {} as BinaryFixedPoint<'unsigned', 16, 15>;
        absoluteBinaryFixedPoint(unsigned) satisfies BinaryFixedPoint<'unsigned', 16, 15>;
    }
}
