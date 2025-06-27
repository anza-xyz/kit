import { assertDigestCapabilityIsAvailable } from '@solana/assertions';
import type { ReadonlyUint8Array } from '@solana/codecs-core';
import {
    isSolanaError,
    SOLANA_ERROR__ADDRESSES__FAILED_TO_FIND_VIABLE_PDA_BUMP_SEED,
    SOLANA_ERROR__ADDRESSES__INVALID_SEEDS_POINT_ON_CURVE,
    SOLANA_ERROR__ADDRESSES__MALFORMED_PDA,
    SOLANA_ERROR__ADDRESSES__MAX_NUMBER_OF_PDA_SEEDS_EXCEEDED,
    SOLANA_ERROR__ADDRESSES__MAX_PDA_SEED_LENGTH_EXCEEDED,
    SOLANA_ERROR__ADDRESSES__PDA_BUMP_SEED_OUT_OF_RANGE,
    SOLANA_ERROR__ADDRESSES__PDA_ENDS_WITH_PDA_MARKER,
    SolanaError,
} from '@solana/errors';
import { Brand } from '@solana/nominal-types';

import { Address, assertIsAddress, getAddressCodec, isAddress } from './address';
import { compressedPointBytesAreOnCurve } from './curve-internal';

/**
 * A tuple representing a program derived address (derived from the address of some program and a
 * set of seeds) and the associated bump seed used to ensure that the address, as derived, does not
 * fall on the Ed25519 curve.
 *
 * Whenever you need to validate an arbitrary tuple as one that represents a program derived
 * address, use the {@link assertIsProgramDerivedAddress} or {@link isProgramDerivedAddress}
 * functions in this package.
 */
export type ProgramDerivedAddress<TAddress extends string = string> = Readonly<
    [Address<TAddress>, ProgramDerivedAddressBump]
>;

/**
 * Represents an integer in the range [0,255] used in the derivation of a program derived address to
 * ensure that it does not fall on the Ed25519 curve.
 */
export type ProgramDerivedAddressBump = Brand<number, 'ProgramDerivedAddressBump'>;

/**
 * A type guard that returns `true` if the input tuple conforms to the {@link ProgramDerivedAddress}
 * type, and refines its type for use in your program.
 *
 * @see The {@link isAddress} function for an example of how to use a type guard.
 */
export function isProgramDerivedAddress<TAddress extends string = string>(
    value: unknown,
): value is ProgramDerivedAddress<TAddress> {
    return (
        Array.isArray(value) &&
        value.length === 2 &&
        typeof value[0] === 'string' &&
        typeof value[1] === 'number' &&
        value[1] >= 0 &&
        value[1] <= 255 &&
        isAddress(value[0])
    );
}

/**
 * In the event that you receive an address/bump-seed tuple from some untrusted source, use this
 * function to assert that it conforms to the {@link ProgramDerivedAddress} interface.
 *
 * @see The {@link assertIsAddress} function for an example of how to use an assertion function.
 */
export function assertIsProgramDerivedAddress<TAddress extends string = string>(
    value: unknown,
): asserts value is ProgramDerivedAddress<TAddress> {
    const validFormat =
        Array.isArray(value) && value.length === 2 && typeof value[0] === 'string' && typeof value[1] === 'number';
    if (!validFormat) {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__MALFORMED_PDA);
    }
    if (value[1] < 0 || value[1] > 255) {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__PDA_BUMP_SEED_OUT_OF_RANGE, {
            bump: value[1],
        });
    }
    assertIsAddress(value[0]);
}

type ProgramDerivedAddressInput = Readonly<{
    programAddress: Address;
    seeds: Seed[];
}>;

type SeedInput = Readonly<{
    baseAddress: Address;
    programAddress: Address;
    seed: Seed;
}>;

type Seed = ReadonlyUint8Array | string;

const MAX_SEED_LENGTH = 32;
const MAX_SEEDS = 16;
const PDA_MARKER_BYTES = [
    // The string 'ProgramDerivedAddress'
    80, 114, 111, 103, 114, 97, 109, 68, 101, 114, 105, 118, 101, 100, 65, 100, 100, 114, 101, 115, 115,
] as const;

async function createProgramDerivedAddress({ programAddress, seeds }: ProgramDerivedAddressInput): Promise<Address> {
    assertDigestCapabilityIsAvailable();
    if (seeds.length > MAX_SEEDS) {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__MAX_NUMBER_OF_PDA_SEEDS_EXCEEDED, {
            actual: seeds.length,
            maxSeeds: MAX_SEEDS,
        });
    }
    let textEncoder: TextEncoder;
    const seedBytes = seeds.reduce((acc, seed, ii) => {
        const bytes = typeof seed === 'string' ? (textEncoder ||= new TextEncoder()).encode(seed) : seed;
        if (bytes.byteLength > MAX_SEED_LENGTH) {
            throw new SolanaError(SOLANA_ERROR__ADDRESSES__MAX_PDA_SEED_LENGTH_EXCEEDED, {
                actual: bytes.byteLength,
                index: ii,
                maxSeedLength: MAX_SEED_LENGTH,
            });
        }
        acc.push(...bytes);
        return acc;
    }, [] as number[]);
    const base58EncodedAddressCodec = getAddressCodec();
    const programAddressBytes = base58EncodedAddressCodec.encode(programAddress);
    const addressBytesBuffer = await crypto.subtle.digest(
        'SHA-256',
        new Uint8Array([...seedBytes, ...programAddressBytes, ...PDA_MARKER_BYTES]),
    );
    const addressBytes = new Uint8Array(addressBytesBuffer);
    if (compressedPointBytesAreOnCurve(addressBytes)) {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__INVALID_SEEDS_POINT_ON_CURVE);
    }
    return base58EncodedAddressCodec.decode(addressBytes);
}

/**
 * Given a program's {@link Address} and up to 16 {@link Seed | Seeds}, this method will return the
 * program derived address (PDA) associated with each.
 *
 * @example
 * ```ts
 * import { getAddressEncoder, getProgramDerivedAddress } from '@solana/addresses';
 *
 * const addressEncoder = getAddressEncoder();
 * const [pda, bumpSeed] = await getProgramDerivedAddress({
 *     programAddress: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address,
 *     seeds: [
 *         // Owner
 *         addressEncoder.encode('9fYLFVoVqwH37C3dyPi6cpeobfbQ2jtLpN5HgAYDDdkm' as Address),
 *         // Token program
 *         addressEncoder.encode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address),
 *         // Mint
 *         addressEncoder.encode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address),
 *     ],
 * });
 * ```
 */
export async function getProgramDerivedAddress({
    programAddress,
    seeds,
}: ProgramDerivedAddressInput): Promise<ProgramDerivedAddress> {
    let bumpSeed = 255;
    while (bumpSeed > 0) {
        try {
            const address = await createProgramDerivedAddress({
                programAddress,
                seeds: [...seeds, new Uint8Array([bumpSeed])],
            });
            return [address, bumpSeed as ProgramDerivedAddressBump];
        } catch (e) {
            if (isSolanaError(e, SOLANA_ERROR__ADDRESSES__INVALID_SEEDS_POINT_ON_CURVE)) {
                bumpSeed--;
            } else {
                throw e;
            }
        }
    }
    throw new SolanaError(SOLANA_ERROR__ADDRESSES__FAILED_TO_FIND_VIABLE_PDA_BUMP_SEED);
}

/**
 * Returns a base58-encoded address derived from some base address, some program address, and a seed
 * string or byte array.
 *
 * @example
 * ```ts
 * import { createAddressWithSeed } from '@solana/addresses';
 *
 * const derivedAddress = await createAddressWithSeed({
 *     // The private key associated with this address will be able to sign for `derivedAddress`.
 *     baseAddress: 'B9Lf9z5BfNPT4d5KMeaBFx8x1G4CULZYR1jA2kmxRDka' as Address,
 *     // Only this program will be able to write data to this account.
 *     programAddress: '445erYq578p2aERrGW9mn9KiYe3fuG6uHdcJ2LPPShGw' as Address,
 *     seed: 'data-account',
 * });
 * ```
 */
export async function createAddressWithSeed({ baseAddress, programAddress, seed }: SeedInput): Promise<Address> {
    const { encode, decode } = getAddressCodec();

    const seedBytes = typeof seed === 'string' ? new TextEncoder().encode(seed) : seed;
    if (seedBytes.byteLength > MAX_SEED_LENGTH) {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__MAX_PDA_SEED_LENGTH_EXCEEDED, {
            actual: seedBytes.byteLength,
            index: 0,
            maxSeedLength: MAX_SEED_LENGTH,
        });
    }

    const programAddressBytes = encode(programAddress);
    if (
        programAddressBytes.length >= PDA_MARKER_BYTES.length &&
        programAddressBytes.slice(-PDA_MARKER_BYTES.length).every((byte, index) => byte === PDA_MARKER_BYTES[index])
    ) {
        throw new SolanaError(SOLANA_ERROR__ADDRESSES__PDA_ENDS_WITH_PDA_MARKER);
    }

    const addressBytesBuffer = await crypto.subtle.digest(
        'SHA-256',
        new Uint8Array([...encode(baseAddress), ...seedBytes, ...programAddressBytes]),
    );
    const addressBytes = new Uint8Array(addressBytesBuffer);

    return decode(addressBytes);
}
