import {
    SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW,
    SOLANA_ERROR__FIXED_POINTS__DIVISION_BY_ZERO,
    SOLANA_ERROR__FIXED_POINTS__FRACTIONAL_BITS_EXCEED_TOTAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_DECIMALS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_FRACTIONAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS,
    SOLANA_ERROR__FIXED_POINTS__MALFORMED_RAW_VALUE,
    SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH,
    SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED,
    SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import type { Signedness } from './signedness';

type FixedPointKind = 'binaryFixedPoint' | 'decimalFixedPoint';

/**
 * Returns the inclusive raw bigint range for a fixed-point number with the
 * given signedness and total bits.
 *
 * Signed ranges use two's-complement semantics, so an 8-bit signed value
 * spans `[-128n, 127n]` and an 8-bit unsigned value spans `[0n, 255n]`.
 *
 * This helper trusts that `totalBits` has already been validated as a
 * positive integer by the caller.
 *
 * @internal
 */
export function getRawRange(signedness: Signedness, totalBits: number): { max: bigint; min: bigint } {
    if (signedness === 'signed') {
        const half = 1n << BigInt(totalBits - 1);
        return { max: half - 1n, min: -half };
    }
    return { max: (1n << BigInt(totalBits)) - 1n, min: 0n };
}

/**
 * Asserts that `totalBits` is a positive integer. Throws
 * `SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS` otherwise.
 *
 * @internal
 */
export function assertValidTotalBits(kind: FixedPointKind, totalBits: unknown): asserts totalBits is number {
    if (typeof totalBits !== 'number' || !Number.isInteger(totalBits) || totalBits <= 0) {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_TOTAL_BITS, {
            kind,
            totalBits,
        });
    }
}

/**
 * Asserts that `fractionalBits` is a non-negative integer. Throws
 * `SOLANA_ERROR__FIXED_POINTS__INVALID_FRACTIONAL_BITS` otherwise.
 *
 * @internal
 */
export function assertValidFractionalBits(fractionalBits: unknown): asserts fractionalBits is number {
    if (typeof fractionalBits !== 'number' || !Number.isInteger(fractionalBits) || fractionalBits < 0) {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_FRACTIONAL_BITS, {
            fractionalBits,
        });
    }
}

/**
 * Asserts that `decimals` is a non-negative integer. Throws
 * `SOLANA_ERROR__FIXED_POINTS__INVALID_DECIMALS` otherwise.
 *
 * @internal
 */
export function assertValidDecimals(decimals: unknown): asserts decimals is number {
    if (typeof decimals !== 'number' || !Number.isInteger(decimals) || decimals < 0) {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_DECIMALS, {
            decimals,
        });
    }
}

/**
 * Asserts that `fractionalBits` does not exceed `totalBits` for a binary
 * fixed-point shape. Throws
 * `SOLANA_ERROR__FIXED_POINTS__FRACTIONAL_BITS_EXCEED_TOTAL_BITS` otherwise.
 *
 * @internal
 */
export function assertFractionalBitsFitInTotalBits(fractionalBits: number, totalBits: number): void {
    if (fractionalBits > totalBits) {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__FRACTIONAL_BITS_EXCEED_TOTAL_BITS, {
            fractionalBits,
            totalBits,
        });
    }
}

/**
 * Asserts that `totalBits` is a multiple of 8. Throws
 * `SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED` otherwise.
 *
 * This is a codec-only constraint: fixed-point values themselves accept
 * any positive `totalBits`, but the byte-oriented codec can only serialize
 * sizes that are exact multiples of 8 bits.
 *
 * @internal
 */
export function assertTotalBitsIsByteAligned(kind: FixedPointKind, totalBits: number): void {
    if (totalBits % 8 !== 0) {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED, {
            kind,
            totalBits,
        });
    }
}

/**
 * Asserts that a raw bigint fits the range claimed by the given signedness
 * and total bits. Throws `SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE`
 * otherwise.
 *
 * @internal
 */
export function assertRawFitsInRange(
    kind: FixedPointKind,
    signedness: Signedness,
    totalBits: number,
    raw: bigint,
): void {
    const { max, min } = getRawRange(signedness, totalBits);
    if (raw < min || raw > max) {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE, {
            kind,
            max,
            min,
            raw,
            signedness,
            totalBits,
        });
    }
}

/**
 * Describes the concrete shape of a fixed-point value for `SHAPE_MISMATCH`
 * error context. The `scale` is `fractionalBits` for binary values and
 * `decimals` for decimal values; `scaleLabel` is the matching
 * human-readable label.
 *
 * @internal
 */
export type FixedPointShape = {
    kind: string;
    scale: number;
    scaleLabel: string;
    signedness: string;
    totalBits: number;
};

/**
 * Expected shape for {@link assertShapeMatches}. Each field except `kind`
 * and `scaleLabel` is optional: `undefined` means "don't constrain this
 * field". `kind` is always required because mismatched kinds are always
 * mismatches; `scaleLabel` is always required because it appears in the
 * expected side of the error message even when `scale` is not pinned.
 *
 * @internal
 */
export type ExpectedFixedPointShape = {
    kind: string;
    scale?: number;
    scaleLabel: string;
    signedness?: string;
    totalBits?: number;
};

/**
 * Best-effort {@link FixedPointShape} description for an unknown value.
 * Used to populate the `actual*` half of `SHAPE_MISMATCH` contexts when
 * the input may not be a valid fixed-point value at all.
 *
 * @internal
 */
export function describeShape(value: unknown): FixedPointShape {
    const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
    const kind = typeof record.kind === 'string' ? record.kind : 'unknown';
    const signedness = typeof record.signedness === 'string' ? record.signedness : 'unknown';
    const totalBits = typeof record.totalBits === 'number' ? record.totalBits : 0;
    let scale: number;
    let scaleLabel: string;
    if (kind === 'decimalFixedPoint') {
        scale = typeof record.decimals === 'number' ? record.decimals : 0;
        scaleLabel = 'decimals';
    } else if (kind === 'binaryFixedPoint') {
        scale = typeof record.fractionalBits === 'number' ? record.fractionalBits : 0;
        scaleLabel = 'fractional bits';
    } else {
        scale = 0;
        scaleLabel = 'unknown';
    }
    return { kind, scale, scaleLabel, signedness, totalBits };
}

/**
 * Asserts that `actual` matches the `expected` shape. Throws
 * `SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH` otherwise.
 *
 * Fields left `undefined` on `expected` are not constrained — the actual
 * value may carry any value for that field. This is how partial shape
 * checks (e.g. "any signed value" without pinning `totalBits`) are
 * expressed.
 *
 * @internal
 */
export function assertShapeMatches(
    operation: string,
    actual: FixedPointShape,
    expected: ExpectedFixedPointShape,
): void {
    const actualIsStructurallyValid =
        (actual.signedness === 'signed' || actual.signedness === 'unsigned') &&
        Number.isInteger(actual.totalBits) &&
        actual.totalBits > 0 &&
        Number.isInteger(actual.scale) &&
        actual.scale >= 0;
    if (
        !actualIsStructurallyValid ||
        actual.kind !== expected.kind ||
        (expected.signedness !== undefined && actual.signedness !== expected.signedness) ||
        (expected.totalBits !== undefined && actual.totalBits !== expected.totalBits) ||
        (expected.scale !== undefined && actual.scale !== expected.scale)
    ) {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH, {
            actualKind: actual.kind,
            actualScale: actual.scale,
            actualScaleLabel: actual.scaleLabel,
            actualSignedness: actual.signedness,
            actualTotalBits: actual.totalBits,
            expectedKind: expected.kind,
            expectedScale: expected.scale ?? actual.scale,
            expectedScaleLabel: expected.scaleLabel,
            expectedSignedness: expected.signedness ?? actual.signedness,
            expectedTotalBits: expected.totalBits ?? actual.totalBits,
            operation,
        });
    }
}

/**
 * Asserts that `value.raw` is a bigint, so that downstream range checks
 * can compare it against the claimed signedness and total bits. Throws
 * `SOLANA_ERROR__FIXED_POINTS__MALFORMED_RAW_VALUE` otherwise.
 *
 * @internal
 */
export function assertRawIsBigint(kind: FixedPointKind, value: unknown): asserts value is { raw: bigint } {
    const raw = value && typeof value === 'object' ? (value as { raw?: unknown }).raw : undefined;
    if (typeof raw !== 'bigint') {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__MALFORMED_RAW_VALUE, {
            kind,
            raw,
        });
    }
}

/**
 * Asserts that a bigint `result` produced by an arithmetic operation fits
 * the range claimed by the given signedness and total bits. Throws
 * `SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW` otherwise, carrying
 * the operation name so the error message can identify which op overflowed.
 *
 * @internal
 */
export function assertNoArithmeticOverflow(
    kind: FixedPointKind,
    operation: string,
    signedness: Signedness,
    totalBits: number,
    result: bigint,
): void {
    const { max, min } = getRawRange(signedness, totalBits);
    if (result < min || result > max) {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW, {
            kind,
            max,
            min,
            operation,
            result,
            signedness,
            totalBits,
        });
    }
}

/**
 * Asserts that a divisor is non-zero. Throws
 * `SOLANA_ERROR__FIXED_POINTS__DIVISION_BY_ZERO` otherwise.
 *
 * @internal
 */
export function assertNoDivisionByZero(
    kind: FixedPointKind,
    signedness: Signedness,
    totalBits: number,
    denominator: bigint,
): void {
    if (denominator === 0n) {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__DIVISION_BY_ZERO, {
            kind,
            signedness,
            totalBits,
        });
    }
}
