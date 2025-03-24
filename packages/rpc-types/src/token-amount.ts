import { StringifiedBigInt } from './stringified-bigint';
import { StringifiedNumber } from './stringified-number';

export type TokenAmount = Readonly<{
    /**
     * The quantity, in fractional units.
     *
     * @example
     * If the token in question is configured to have 6 decimal places, the value `1_000_000n` would
     * indicate a balance of one whole token.
     */
    amount: StringifiedBigInt;
    /**
     * A power of ten, the inverse of which defines the smallest fractional unit of this token.
     *
     * @example
     * A token configured to have 6 decimals is made up of fractional units each representing
     * 10^(-6) tokens.
     */
    decimals: number;
    /** @deprecated */
    uiAmount: number | null;
    /**
     * The balance of whole tokens, as a string.
     *
     * The string representation will use a decimal when necessary, but will never contain trailing
     * zeros to the right of the decimal place.
     *
     * @example
     * A token configured to have 6 decimals, with an amount of `1_000_500n`, will produce the
     * string `"1.0005"`.
     */
    uiAmountString: StringifiedNumber;
}>;
