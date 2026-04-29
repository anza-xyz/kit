/**
 * Whether a fixed-point number can represent negative values.
 *
 * - `'signed'` fixed-point numbers use two's-complement semantics and can
 *   represent both negative and non-negative values.
 * - `'unsigned'` fixed-point numbers can only represent non-negative values
 *   but get one extra bit of positive range.
 *
 * @see {@link BinaryFixedPoint}
 * @see {@link DecimalFixedPoint}
 */
export type Signedness = 'signed' | 'unsigned';
