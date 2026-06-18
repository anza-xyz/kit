import { SOLANA_ERROR__MALFORMED_BIGINT_STRING, SolanaError } from '@solana/errors';

/**
 * Matches an optionally-signed integer with an optional non-negative exponent —
 * matching the shape that {@link wrapBigIntValueObject} can emit. Capturing the
 * sign, mantissa, and exponent separately lets us both validate the value and
 * estimate how many digits it would materialize into.
 */
const BIGINT_VALUE_OBJECT_PATTERN = /^(-?)(\d+)(?:[eE]\+?(\d+))?$/;

/**
 * The largest integer (by decimal digit count) we are willing to materialize
 * from a `$n` value object. This prevents a malformed `$n` value from causing
 * us to allocate overly large numbers.
 */
const MAX_BIGINT_DIGITS = 1_000;

/**
 * This function is a replacement for `JSON.parse` that can handle large
 * unsafe integers by parsing them as BigInts. It transforms every
 * numerical value into a BigInt without loss of precision.
 */
export function parseJsonWithBigInts(json: string): unknown {
    return JSON.parse(wrapIntegersInBigIntValueObject(json), (_, value) => {
        return isBigIntValueObject(value) ? unwrapBigIntValueObject(value) : value;
    });
}

function wrapIntegersInBigIntValueObject(json: string): string {
    const out = [];
    let inQuote = false;
    for (let ii = 0; ii < json.length; ii++) {
        let isEscaped = false;
        if (json[ii] === '\\') {
            out.push(json[ii++]);
            isEscaped = !isEscaped;
        }
        if (json[ii] === '"') {
            out.push(json[ii]);
            if (!isEscaped) {
                inQuote = !inQuote;
            }
            continue;
        }
        if (!inQuote) {
            const consumedNumber = consumeNumber(json, ii);
            if (consumedNumber?.length) {
                ii += consumedNumber.length - 1;
                // Don't wrap numbers that contain a decimal point or a negative exponent.
                if (consumedNumber.match(/\.|[eE]-/)) {
                    out.push(consumedNumber);
                } else {
                    out.push(wrapBigIntValueObject(consumedNumber));
                }
                continue;
            }
        }
        out.push(json[ii]);
    }

    return out.join('');
}

function consumeNumber(json: string, ii: number): string | null {
    /** @see https://stackoverflow.com/a/13340826/11440277 */
    const JSON_NUMBER_REGEX = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;

    // Stop early if the first character isn't a digit or a minus sign.
    if (!json[ii]?.match(/[-\d]/)) {
        return null;
    }

    // Otherwise, check if the next characters form a valid JSON number.
    const numberMatch = json.slice(ii).match(JSON_NUMBER_REGEX);
    return numberMatch ? numberMatch[0] : null;
}

type BigIntValueObject = {
    // `$` implies 'this is a value object'.
    // `n` implies 'interpret the value as a bigint'.
    $n: string;
};

function wrapBigIntValueObject(value: string): string {
    return `{"$n":"${value}"}`;
}

function unwrapBigIntValueObject({ $n }: BigIntValueObject): bigint {
    const match = $n.match(BIGINT_VALUE_OBJECT_PATTERN);
    if (match) {
        const [, sign, mantissa, exponent] = match;
        // The materialized integer has `mantissa.length + exponent` digits.
        // `Number(exponent)` saturates to `Infinity` for absurd exponents, which
        // safely exceeds the limit rather than overflowing.
        const digitCount = mantissa.length + (exponent ? Number(exponent) : 0);
        if (digitCount <= MAX_BIGINT_DIGITS) {
            return exponent ? BigInt(`${sign}${mantissa}`) * 10n ** BigInt(exponent) : BigInt($n);
        }
    }
    throw new SolanaError(SOLANA_ERROR__MALFORMED_BIGINT_STRING, { value: $n });
}

function isBigIntValueObject(value: unknown): value is BigIntValueObject {
    return !!value && typeof value === 'object' && '$n' in value && typeof value.$n === 'string';
}
