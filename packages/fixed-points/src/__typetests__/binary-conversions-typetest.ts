import {
    type BinaryFixedPoint,
    rescaleBinaryFixedPoint,
    toSignedBinaryFixedPoint,
    toUnsignedBinaryFixedPoint,
} from '../binary';

// [DESCRIBE] toUnsignedBinaryFixedPoint.
{
    // It returns an unsigned value regardless of the input's signedness.
    {
        const fromSigned = {} as BinaryFixedPoint<'signed', 16, 15>;
        toUnsignedBinaryFixedPoint(fromSigned) satisfies BinaryFixedPoint<'unsigned', 16, 15>;
        const fromUnsigned = {} as BinaryFixedPoint<'unsigned', 16, 15>;
        toUnsignedBinaryFixedPoint(fromUnsigned) satisfies BinaryFixedPoint<'unsigned', 16, 15>;
    }

    // It preserves totalBits and fractionalBits in the return type.
    {
        const value = {} as BinaryFixedPoint<'signed', 8, 4>;
        toUnsignedBinaryFixedPoint(value) satisfies BinaryFixedPoint<'unsigned', 8, 4>;
    }
}

// [DESCRIBE] toSignedBinaryFixedPoint.
{
    // It returns a signed value regardless of the input's signedness.
    {
        const fromSigned = {} as BinaryFixedPoint<'signed', 16, 15>;
        toSignedBinaryFixedPoint(fromSigned) satisfies BinaryFixedPoint<'signed', 16, 15>;
        const fromUnsigned = {} as BinaryFixedPoint<'unsigned', 16, 15>;
        toSignedBinaryFixedPoint(fromUnsigned) satisfies BinaryFixedPoint<'signed', 16, 15>;
    }

    // It preserves totalBits and fractionalBits in the return type.
    {
        const value = {} as BinaryFixedPoint<'unsigned', 8, 4>;
        toSignedBinaryFixedPoint(value) satisfies BinaryFixedPoint<'signed', 8, 4>;
    }
}

// [DESCRIBE] rescaleBinaryFixedPoint.
{
    // It preserves the input signedness and picks up the new totalBits and fractionalBits.
    {
        const value = {} as BinaryFixedPoint<'signed', 128, 64>;
        rescaleBinaryFixedPoint(value, 16, 8) satisfies BinaryFixedPoint<'signed', 16, 8>;
    }
    {
        const value = {} as BinaryFixedPoint<'unsigned', 8, 4>;
        rescaleBinaryFixedPoint(value, 32, 16) satisfies BinaryFixedPoint<'unsigned', 32, 16>;
    }

    // It accepts an optional RoundingMode as its fourth argument.
    {
        const value = {} as BinaryFixedPoint<'signed', 32, 16>;
        rescaleBinaryFixedPoint(value, 16, 8, 'floor') satisfies BinaryFixedPoint<'signed', 16, 8>;
    }
}
