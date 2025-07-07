import {
    SOLANA_ERROR__ADDRESSES__INVALID_BYTE_LENGTH,
    SOLANA_ERROR__ADDRESSES__STRING_LENGTH_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import { address } from '../address';
import { assertIsOffCurveAddress, isOffCurveAddress } from '../curve';
import { compressedPointBytesAreOnCurve } from '../curve-internal';

const OFF_CURVE_KEY_BYTES = [
    new Uint8Array([
        0, 121, 240, 130, 166, 28, 199, 78, 165, 226, 171, 237, 100, 187, 247, 95, 50, 251, 221, 83, 122, 255, 247, 82,
        87, 237, 103, 22, 201, 227, 114, 153,
    ]),
    new Uint8Array([
        194, 222, 197, 61, 68, 225, 252, 198, 155, 150, 247, 44, 45, 10, 115, 8, 12, 50, 138, 12, 106, 199, 75, 172,
        159, 87, 94, 122, 251, 246, 136, 75,
    ]),
];

const ON_CURVE_KEY_BYTES = [
    new Uint8Array([
        107, 141, 87, 175, 101, 27, 216, 58, 238, 95, 193, 175, 21, 151, 207, 102, 28, 107, 157, 178, 69, 77, 203, 89,
        199, 77, 162, 19, 27, 108, 57, 155,
    ]),
    new Uint8Array([
        52, 94, 161, 109, 55, 62, 164, 12, 183, 165, 56, 112, 86, 103, 19, 109, 196, 33, 93, 42, 143, 6, 221, 172, 173,
        21, 130, 96, 170, 101, 82, 200,
    ]),
];

const ON_CURVE_ADDRESSES = [
    'nick6zJc6HpW3kfBm4xS2dmbuVRyb5F3AnUvj5ymzR5', // "wallet" account
    '11111111111111111111111111111111', // system program
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // legacy token program
    'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf', // Squads multi-sig program
].map(address);

const OFF_CURVE_ADDRESSES = [
    'CCMCWh4FudPEmY6Q1AVi5o8mQMXkHYkJUmZfzRGdcJ9P', // ATA
    '2DRxyJDsDccGL6mb8PLMsKQTCU3C7xUq8aprz53VcW4k', // random Squads multi-sig account
].map(address);

describe('compressedPointBytesAreOnCurve', () => {
    it.each(OFF_CURVE_KEY_BYTES)('returns false when a public key does not lie on the Ed25519 curve [%#]', bytes => {
        expect(compressedPointBytesAreOnCurve(bytes)).toBe(false);
    });
    it.each(ON_CURVE_KEY_BYTES)('returns true when a public key lies on the Ed25519 curve [%#]', bytes => {
        expect(compressedPointBytesAreOnCurve(bytes)).toBe(true);
    });
});

describe('isOffCurveAddress', () => {
    it.each(OFF_CURVE_ADDRESSES)('returns true when an address does not lie on the Ed25519 curve [%#]', address => {
        expect(isOffCurveAddress(address)).toBe(true);
    });
    it.each(ON_CURVE_ADDRESSES)('returns false when an address lies on the Ed25519 curve [%#]', address => {
        expect(isOffCurveAddress(address)).toBe(false);
    });
    it('throws when supplied a non-base58 string', () => {
        expect(() => {
            assertIsOffCurveAddress(
                // @ts-expect-error Pass corrupt data for the sake of this test.
                'not-a-base-58-encoded-string',
            );
        }).toThrow(
            new SolanaError(SOLANA_ERROR__ADDRESSES__STRING_LENGTH_OUT_OF_RANGE, {
                actualLength: 28,
            }),
        );
    });
    it('throws when the decoded byte array has a length other than 32 bytes', () => {
        expect(() => {
            assertIsOffCurveAddress(
                // 31 bytes [128, ..., 128]
                // @ts-expect-error Pass corrupt data for the sake of this test.
                '2xea9jWJ9eca3dFiefTeSPP85c6qXqunCqL2h2JNffM',
            );
        }).toThrow(
            new SolanaError(SOLANA_ERROR__ADDRESSES__INVALID_BYTE_LENGTH, {
                actualLength: 31,
            }),
        );
    });
});
