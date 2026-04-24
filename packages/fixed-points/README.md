[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/fixed-points?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/fixed-points?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/fixed-points

# @solana/fixed-points

This package provides fixed-point number types for JavaScript without relying on floating-point arithmetic. It can be used standalone, but it is also exported as part of Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).

This package is also part of the [`@solana/codecs` package](https://github.com/anza-xyz/kit/tree/main/packages/codecs) which acts as an entry point for all codec packages as well as for their documentation.

Two flavors are provided: **decimal** fixed-points (scale is a power of 10) and **binary** fixed-points (scale is a power of 2). Use decimal fixed-points to represent prices, token amounts, and any quantity whose precision aligns with decimal digits. Use binary fixed-points when the scale can align with bits — such as audio samples, graphics, or probabilities — and you want to trade base-10 ergonomics for faster arithmetic.

```ts
// Track a USDC balance without losing pennies to floating-point rounding.
const usdc = decimalFixedPoint('unsigned', 64, 6);
const balance = addDecimalFixedPoint(usdc('1234.56'), usdc('10.00'));
decimalFixedPointToString(balance); // "1244.56"
```

Both kinds share the same mental model. A value is a frozen object carrying a `bigint` `raw` and some shape metadata (signedness, total bits, scale). A decimal fixed-point represents `raw / 10 ** decimals`; a binary fixed-point represents `raw / 2 ** fractionalBits`.

## Creating fixed-points

The `decimalFixedPoint` and `binaryFixedPoint` functions each validate a shape once and return a factory you can call many times to build values of that shape.

```ts
const usdc = decimalFixedPoint('unsigned', 64, 6); // u64 with 6 decimals
usdc('42.5'); // raw === 42_500_000n, exact
usdc('0.1234567'); // throws STRICT_MODE_PRECISION_LOSS (8th decimal is lossy)

const audioSample = binaryFixedPoint('signed', 16, 15); // Q1.15
audioSample('0.5'); // raw === 16384n, exact
audioSample('0.1', 'round'); // raw === 3277n, rounded
```

Use the `raw*` factories when the raw bigint is already known — for instance when you already have the value stored in its lowest denomination.

```ts
const cents = rawDecimalFixedPoint('unsigned', 32, 2);
cents(4250n); // represents 42.50
```

Use the `ratio*` factories for values defined as a numerator over a denominator.

```ts
const probability = ratioBinaryFixedPoint('signed', 16, 15);
probability(1n, 4n); // represents 0.25 exactly
probability(1n, 3n, 'round'); // represents ~0.333, rounded
```

## Rounding modes

Any operation that could lose precision accepts a `RoundingMode`.

| Mode     | Behavior                                                          |
| -------- | ----------------------------------------------------------------- |
| `strict` | Throws `STRICT_MODE_PRECISION_LOSS` when the result is not exact. |
| `floor`  | Rounds towards negative infinity.                                 |
| `ceil`   | Rounds towards positive infinity.                                 |
| `trunc`  | Rounds towards zero.                                              |
| `round`  | Rounds half values away from zero.                                |

The default is `'strict'`, so precision loss is always explicit. Pass a mode whenever you are willing to accept a rounded result.

## Arithmetic

Every arithmetic helper preserves the shape of its first operand and throws `ARITHMETIC_OVERFLOW` if the result doesn't fit.

```ts
addDecimalFixedPoint(usdc('10'), usdc('3.25')); // represents 13.25
subtractDecimalFixedPoint(usdc('10'), usdc('3.25')); // represents 6.75
negateBinaryFixedPoint(audioSample('0.5')); // represents -0.5 (signed only)
absoluteBinaryFixedPoint(audioSample('-0.5')); // represents 0.5
```

`multiply` and `divide` accept either another fixed-point of the same signedness (any total bits or scale) or a bare `bigint`. The result always has the first operand's shape. They consult the rounding mode when the operation is inexact; `divide` throws `DIVISION_BY_ZERO` on a zero denominator.

```ts
multiplyBinaryFixedPoint(audioSample('0.6'), audioSample('0.8')); // ~0.48
divideDecimalFixedPoint(usdc('100'), 4n); // represents 25
divideDecimalFixedPoint(usdc('1'), usdc('3'), 'floor'); // represents 0.333333
```

## Comparisons

Comparison helpers return a `boolean`, or `-1 | 0 | 1` for `cmp`. Only `kind` and scale must match; `signedness` and `totalBits` may differ.

```ts
cmpBinaryFixedPoint(audioSample('0.25'), audioSample('0.5')); // -1
eqBinaryFixedPoint(audioSample('0.5'), audioSample('0.5')); // true
ltDecimalFixedPoint(usdc('10'), usdc('20')); // true
lteDecimalFixedPoint(usdc('20'), usdc('20')); // true
gtDecimalFixedPoint(usdc('20'), usdc('10')); // true
gteDecimalFixedPoint(usdc('20'), usdc('20')); // true
```

## Shape conversions

Use `toSigned*` and `toUnsigned*` to change a value's signedness without touching its total bits or scale.

```ts
const signedByte = rawBinaryFixedPoint('signed', 8, 4);
const unsignedByte = rawBinaryFixedPoint('unsigned', 8, 4);

toUnsignedBinaryFixedPoint(signedByte(100n)); // unsigned, raw === 100n
toSignedBinaryFixedPoint(unsignedByte(200n)); // throws: 200 > i8 max
```

Use `rescale*` to change the total bits and scale in one call. Scale-up is always exact; scale-down consults the rounding mode.

```ts
// Bridge EVM USDC (u128 with 18 decimals) down to SPL USDC (u64 with 6 decimals).
const evmUsdc = decimalFixedPoint('unsigned', 128, 18);
rescaleDecimalFixedPoint(evmUsdc('100.123456789012345678'), 64, 6, 'floor');
// represents 100.123456
```

## Formatting

`*ToString` returns the canonical decimal string. Trailing zeros are trimmed by default.

```ts
decimalFixedPointToString(usdc('42.5')); // "42.5"
decimalFixedPointToString(usdc('-0.05')); // "-0.05"
binaryFixedPointToString(audioSample('0.5')); // "0.5"
```

Binary fixed-points always have a finite decimal expansion, but that expansion can be long (up to `fractionalBits` digits). Pass `options.decimals` with a `RoundingMode` to cap the output.

```ts
binaryFixedPointToString(audioSample('0.1')); // "0.0999755859375"
binaryFixedPointToString(audioSample('0.1'), { decimals: 4, rounding: 'round' }); // "0.1"
```

Set `options.padTrailingZeros` to emit exactly that many fractional digits.

```ts
decimalFixedPointToString(usdc('42.5'), { padTrailingZeros: true }); // "42.500000"
```

`*ToNumber` returns a JavaScript `number`. It is inherently lossy — prefer `*ToString` when exactness matters.

```ts
decimalFixedPointToNumber(usdc('42.5')); // 42.5
```

## Type guards

The `is*` and `assertIs*` guards narrow an unknown value to a fixed-point. All shape arguments are optional — pass `undefined` for any dimension you don't care about.

```ts
isDecimalFixedPoint(value); // any decimal fixed-point?
isBinaryFixedPoint(value, 'signed', 16, 15); // specifically an `audioSample`?
assertIsDecimalFixedPoint(value); // throws SHAPE_MISMATCH if not a decimal fixed-point
```

## Codecs

Fixed-points also come with byte-level codecs compatible with the rest of the [`@solana/codecs`](https://github.com/anza-xyz/kit/tree/main/packages/codecs) ecosystem. The codec is a `FixedSizeCodec` whose size is `totalBits / 8` — `totalBits` must therefore be a multiple of 8.

```ts
const codec = getBinaryFixedPointCodec('signed', 16, 15);
const bytes = codec.encode(audioSample('0.5')); // 0x0040
codec.decode(bytes); // represents 0.5
```

Values serialize in little-endian by default. Pass `{ endian: 'be' }` for big-endian.

```ts
getDecimalFixedPointCodec('unsigned', 64, 6, { endian: 'be' }).encode(usdc('42.5'));
// 0x0000000002879b9a
```

Signed values use two's-complement and the codec accepts any byte-aligned width, including non-standard ones like 24, 40, 72, or 136 bits.

Separate `get*Encoder` and `get*Decoder` functions are also available.

```ts
const bytes = getDecimalFixedPointEncoder('unsigned', 64, 6).encode(usdc('42.5'));
const value = getDecimalFixedPointDecoder('unsigned', 64, 6).decode(bytes);
```

## Types

- `BinaryFixedPoint<TSignedness, TTotalBits, TFractionalBits>` — a binary fixed-point with mathematical value `raw / 2 ** fractionalBits`.
- `DecimalFixedPoint<TSignedness, TTotalBits, TDecimals>` — a decimal fixed-point with mathematical value `raw / 10 ** decimals`.
- `Signedness` — `'signed' | 'unsigned'`.
- `RoundingMode` — `'ceil' | 'floor' | 'round' | 'strict' | 'trunc'`.
- `FixedPointToStringOptions` — options accepted by `*ToString` (`decimals`, `padTrailingZeros`, `rounding`).
- `FixedPointCodecConfig` — options accepted by the codec factories (`endian`).
