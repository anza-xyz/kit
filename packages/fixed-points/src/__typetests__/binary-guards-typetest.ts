import type { BinaryFixedPoint } from '../binary/core';
import { assertIsBinaryFixedPoint, isBinaryFixedPoint } from '../binary/guards';
import type { Signedness } from '../signedness';

// [DESCRIBE] isBinaryFixedPoint.
{
    // It narrows to a fully-generic BinaryFixedPoint when no shape is provided.
    {
        const value = {} as unknown;
        if (isBinaryFixedPoint(value)) {
            value satisfies BinaryFixedPoint<Signedness, number, number>;
        }
    }

    // It narrows progressively as shape arguments are added.
    {
        const value = {} as unknown;
        if (isBinaryFixedPoint(value, 'signed')) {
            value satisfies BinaryFixedPoint<'signed', number, number>;
        }
    }
    {
        const value = {} as unknown;
        if (isBinaryFixedPoint(value, 'signed', 16)) {
            value satisfies BinaryFixedPoint<'signed', 16, number>;
        }
    }
    {
        const value = {} as unknown;
        if (isBinaryFixedPoint(value, 'signed', 16, 15)) {
            value satisfies BinaryFixedPoint<'signed', 16, 15>;
        }
    }

    // It preserves the generic default at a position when `undefined` is passed.
    {
        const value = {} as unknown;
        if (isBinaryFixedPoint(value, undefined, 16)) {
            value satisfies BinaryFixedPoint<Signedness, 16, number>;
        }
    }
    {
        const value = {} as unknown;
        if (isBinaryFixedPoint(value, undefined, undefined, 15)) {
            value satisfies BinaryFixedPoint<Signedness, number, 15>;
        }
    }
}

// [DESCRIBE] assertIsBinaryFixedPoint.
{
    // It narrows to a fully-generic BinaryFixedPoint when no shape is provided.
    {
        const value = {} as unknown;
        assertIsBinaryFixedPoint(value);
        value satisfies BinaryFixedPoint<Signedness, number, number>;
    }

    // It narrows progressively as shape arguments are added.
    {
        const value = {} as unknown;
        assertIsBinaryFixedPoint(value, 'signed');
        value satisfies BinaryFixedPoint<'signed', number, number>;
    }
    {
        const value = {} as unknown;
        assertIsBinaryFixedPoint(value, 'signed', 16);
        value satisfies BinaryFixedPoint<'signed', 16, number>;
    }
    {
        const value = {} as unknown;
        assertIsBinaryFixedPoint(value, 'signed', 16, 15);
        value satisfies BinaryFixedPoint<'signed', 16, 15>;
    }

    // It preserves the generic default at a position when `undefined` is passed.
    {
        const value = {} as unknown;
        assertIsBinaryFixedPoint(value, undefined, 16);
        value satisfies BinaryFixedPoint<Signedness, 16, number>;
    }
    {
        const value = {} as unknown;
        assertIsBinaryFixedPoint(value, undefined, undefined, 15);
        value satisfies BinaryFixedPoint<Signedness, number, 15>;
    }
}
