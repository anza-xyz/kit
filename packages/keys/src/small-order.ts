import { ReadonlyUint8Array } from '@solana/codecs-core';

const P = 2n ** 255n - 19n;

/**
 * The y-coordinates of the 8 points in the torsion subgroup of the Ed25519 curve; the identity
 * (`1`), the point of order 2 (`p - 1`), the two points of order 4 (`0`), and the four points of
 * order 8 (the remaining two values, each shared by a point and its negation).
 */
const SMALL_ORDER_Y_COORDINATES = new Set([
    0n,
    1n,
    P - 1n,
    2707385501144840649318225287225658788936804267575313519463743609750303402022n,
    55188659117513257062467267217118295137698188065244968500265048394206261417927n,
]);

/**
 * Returns `true` when the 32 bytes supplied are an encoding (canonical or not) of one of the
 * small-order points of the Ed25519 curve.
 *
 * A public key of small order accepts trivially forged signatures for any message, and a signature
 * whose `R` component is of small order is malleable. Strict verifiers (eg. `ed25519-dalek`'s
 * `verify_strict`, as used by Agave, and libsodium) reject both, but not every WebCrypto
 * implementation does.
 *
 * Since every point that shares a y-coordinate with a small-order point is itself of small order,
 * it suffices to compare the y-coordinate (reduced mod p, so as to also catch non-canonical
 * encodings) against the known set.
 */
export function isSmallOrderPointEncoding(bytes: ReadonlyUint8Array): boolean {
    if (bytes.byteLength !== 32) {
        return false;
    }
    let y = 0n;
    for (let ii = 31; ii >= 0; ii--) {
        // Mask off the sign bit of x, which lives in the most significant bit of the last byte.
        y = (y << 8n) | BigInt(ii === 31 ? bytes[ii] & 0x7f : bytes[ii]);
    }
    return SMALL_ORDER_Y_COORDINATES.has(y % P);
}
