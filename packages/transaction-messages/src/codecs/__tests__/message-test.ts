import { Address } from '@solana/addresses';
import { SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, SolanaError } from '@solana/errors';

import {
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    LegacyCompiledTransactionMessage,
    V0CompiledTransactionMessage,
    V1CompiledTransactionMessage,
} from '../../compile/message';
import {
    getCompiledTransactionMessageCodec,
    getCompiledTransactionMessageDecoder,
    getCompiledTransactionMessageEncoder,
} from '../message';

describe.each([getCompiledTransactionMessageCodec, getCompiledTransactionMessageEncoder])(
    'Message encoder %p',
    encoderFactory => {
        const encoder = encoderFactory();

        it('encodes a legacy transaction correctly', () => {
            const encoder = encoderFactory();
            const message: CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage = {
                header: {
                    numReadonlyNonSignerAccounts: 1,
                    numReadonlySignerAccounts: 2,
                    numSignerAccounts: 3,
                },
                instructions: [
                    {
                        accountIndices: [1, 2],
                        data: new Uint8Array([4, 5, 6]),
                        programAddressIndex: 0,
                    },
                    {
                        accountIndices: [2],
                        data: new Uint8Array([7, 8, 9]),
                        programAddressIndex: 1,
                    },
                ],
                lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5', // encodes to [10{32}]
                staticAccounts: [
                    'k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn' as Address, // encodes to [11{32}]
                    'p2Yicb86aZig616Eav2VWG9vuXR5mEqhtzshZYBxzsV' as Address, // encodes to [12{32}]
                    'swqrv48gsrwpBFbftEwnP2vB4jckpvfGJfXkwaniLCC' as Address, // encodes to [13{32}]
                ],
                version: 'legacy',
            };

            expect(encoder.encode(message)).toStrictEqual(
                // prettier-ignore
                new Uint8Array([
                    /** NO VERSION HEADER */

                    /** MESSAGE HEADER */
                    3, // numSignerAccounts
                    2, // numReadonlySignerAccount
                    1, // numReadonlyNonSignerAccounts

                    /** STATIC ADDRESSES */
                    3, // Number of static accounts
                    11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, // k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn
                    12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, // p2Yicb86aZig616Eav2VWG9vuXR5mEqhtzshZYBxzsV
                    13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, // swqrv48gsrwpBFbftEwnP2vB4jckpvfGJfXkwaniLCC

                    /** TRANSACTION LIFETIME TOKEN (ie. the blockhash) */
                    10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, // gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5

                    /* INSTRUCTIONS */
                    2, // Number of instructions

                    // First instruction
                    0, // Program address index
                    2, // Number of address indices
                    1, 2, // Address indices
                    3, // Length of instruction data
                    4, 5, 6, // Instruction data itself

                    // Second instruction
                    1, // Program address index
                    1, // Number of address indices
                    2, // Address indices
                    3, // Length of instruction data
                    7, 8, 9, // Instruction data itself
                ]),
            );
        });

        it('encodes a v0 transaction with address lookup tables correctly', () => {
            const message: CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage = {
                addressTableLookups: [
                    {
                        lookupTableAddress: '3yS1JFVT284y8z1LC9MRoWxZjzFrdoD5axKsZiyMsfC7' as Address, // decodes to [44{32}]
                        readonlyIndexes: [77],
                        writableIndexes: [66, 55],
                    },
                ],
                header: {
                    numReadonlyNonSignerAccounts: 1,
                    numReadonlySignerAccounts: 2,
                    numSignerAccounts: 3,
                },
                instructions: [
                    {
                        accountIndices: [1, 2],
                        data: new Uint8Array([4, 5, 6]),
                        programAddressIndex: 0,
                    },
                    {
                        accountIndices: [2],
                        data: new Uint8Array([7, 8, 9]),
                        programAddressIndex: 1,
                    },
                ],
                lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5', // encodes to [10{32}]
                staticAccounts: [
                    'k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn' as Address, // encodes to [11{32}]
                    'p2Yicb86aZig616Eav2VWG9vuXR5mEqhtzshZYBxzsV' as Address, // encodes to [12{32}]
                    'swqrv48gsrwpBFbftEwnP2vB4jckpvfGJfXkwaniLCC' as Address, // encodes to [13{32}]
                ],
                version: 0,
            };

            expect(encoder.encode(message)).toStrictEqual(
                // prettier-ignore
                new Uint8Array([
                    /** VERSION HEADER */
                    128, // 0 + version mask

                    /** MESSAGE HEADER */
                    3, // numSignerAccounts
                    2, // numReadonlySignerAccount
                    1, // numReadonlyNonSignerAccounts

                    /** STATIC ADDRESSES */
                    3, // Number of static accounts
                    11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, // k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn
                    12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, // p2Yicb86aZig616Eav2VWG9vuXR5mEqhtzshZYBxzsV
                    13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, // swqrv48gsrwpBFbftEwnP2vB4jckpvfGJfXkwaniLCC

                    /** TRANSACTION LIFETIME TOKEN (ie. the blockhash) */
                    10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, // gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5

                    /* INSTRUCTIONS */
                    2, // Number of instructions

                    // First instruction
                    0, // Program address index
                    2, // Number of address indices
                    1, 2, // Address indices
                    3, // Length of instruction data
                    4, 5, 6, // Instruction data itself

                    // Second instruction
                    1, // Program address index
                    1, // Number of address indices
                    2, // Address indices
                    3, // Length of instruction data
                    7, 8, 9, // Instruction data itself

                    /** ADDRESS TABLE LOOKUPS */
                    1, // Number of address table lookups

                    // First address table lookup
                    44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, // Address of lookup table 3yS1JFVT284y8z1LC9MRoWxZjzFrdoD5axKsZiyMsfC7
                    2, // Number of writable indices
                    66, 55, // Writable indices
                    1, // Number of readonly indices
                    77, // Readonly indices
                ]),
            );
        });

        it('encodes a v1 transaction with all config values', () => {
            const message: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
                configMask: 0b11111,
                // All config flags set
                configValues: [
                    { kind: 'u64', value: 5000n }, // Priority fee
                    { kind: 'u32', value: 200000 }, // Compute unit limit
                    { kind: 'u32', value: 64000 }, // Loaded accounts data size limit
                    { kind: 'u32', value: 256000 }, // Heap size
                ],

                header: {
                    numReadonlyNonSignerAccounts: 0,
                    numReadonlySignerAccounts: 0,
                    numSignerAccounts: 1,
                },

                instructionHeaders: [],

                instructionPayloads: [],
                lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5',
                numInstructions: 0,
                numStaticAccounts: 1,
                staticAccounts: ['k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn' as Address],
                version: 1,
            };

            expect(encoder.encode(message)).toStrictEqual(
                // prettier-ignore
                new Uint8Array([
                    /** VERSION HEADER */
                    129,

                    /** MESSAGE HEADER */
                    1, 0, 0,

                    /** CONFIG MASK */
                    31, 0, 0, 0, // configMask (u32) = 0b11111

                    /** LIFETIME TOKEN */
                    10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,

                    /** NUM INSTRUCTIONS */
                    0,

                    /** NUM ADDRESSES */
                    1,

                    /** STATIC ADDRESSES */
                    11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,

                    /** CONFIG VALUES */
                    136, 19, 0, 0, 0, 0, 0, 0, // 5000 as u64
                    64, 13, 3, 0, // 200000 as u32
                    0, 250, 0, 0, // 64000 as u32
                    0, 232, 3, 0, // 256000 as u32

                    /** INSTRUCTION HEADERS */
                    // (none)

                    /** INSTRUCTION PAYLOADS */
                    // (none)
                ]),
            );
        });

        it('errors when encoding an unsupported v2 transaction', () => {
            const message = {
                version: 2,
            } as unknown as CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;

            expect(() => encoder.encode(message)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
                    unsupportedVersion: 2,
                }),
            );
        });
    },
);

describe.each([getCompiledTransactionMessageCodec, getCompiledTransactionMessageDecoder])(
    'Message decoder %p',
    decoderFactory => {
        const decoder = decoderFactory();

        it('decodes a legacy transaction correctly', () => {
            const byteArray =
                // prettier-ignore
                new Uint8Array([
                    /** NO VERSION HEADER */

                    /** MESSAGE HEADER */
                    3, // numSignerAccounts
                    2, // numReadonlySignerAccount
                    1, // numReadonlyNonSignerAccounts

                    /** STATIC ADDRESSES */
                    3, // Number of static accounts
                    11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, // k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn
                    12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, // p2Yicb86aZig616Eav2VWG9vuXR5mEqhtzshZYBxzsV
                    13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, // swqrv48gsrwpBFbftEwnP2vB4jckpvfGJfXkwaniLCC

                    /** TRANSACTION LIFETIME TOKEN (ie. the blockhash) */
                    10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, // gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5

                    /* INSTRUCTIONS */
                    2, // Number of instructions

                    // First instruction
                    0, // Program address index
                    2, // Number of address indices
                    1, 2, // Address indices
                    3, // Length of instruction data
                    4, 5, 6, // Instruction data itself

                    // Second instruction
                    1, // Program address index
                    1, // Number of address indices
                    2, // Address indices
                    3, // Length of instruction data
                    7, 8, 9, // Instruction data itself
                ]);

            const expectedMessage: CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage = {
                header: {
                    numReadonlyNonSignerAccounts: 1,
                    numReadonlySignerAccounts: 2,
                    numSignerAccounts: 3,
                },
                instructions: [
                    {
                        accountIndices: [1, 2],
                        data: new Uint8Array([4, 5, 6]),
                        programAddressIndex: 0,
                    },
                    {
                        accountIndices: [2],
                        data: new Uint8Array([7, 8, 9]),
                        programAddressIndex: 1,
                    },
                ],
                lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5', // decodes to [10{32}]
                staticAccounts: [
                    'k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn' as Address, // decodes to [11{32}]
                    'p2Yicb86aZig616Eav2VWG9vuXR5mEqhtzshZYBxzsV' as Address, // decodes to [12{32}]
                    'swqrv48gsrwpBFbftEwnP2vB4jckpvfGJfXkwaniLCC' as Address, // decodes to [13{32}]
                ],
                version: 'legacy',
            };

            expect(decoder.decode(byteArray)).toStrictEqual(expectedMessage);
        });

        it('decodes a v0 transaction with address lookup tables correctly', () => {
            const byteArray =
                // prettier-ignore
                new Uint8Array([
                    /** VERSION HEADER */
                    128, // 0 + version mask

                    /** MESSAGE HEADER */
                    3, // numSignerAccounts
                    2, // numReadonlySignerAccount
                    1, // numReadonlyNonSignerAccounts

                    /** STATIC ADDRESSES */
                    3, // Number of static accounts
                    11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, // k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn
                    12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, // p2Yicb86aZig616Eav2VWG9vuXR5mEqhtzshZYBxzsV
                    13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, // swqrv48gsrwpBFbftEwnP2vB4jckpvfGJfXkwaniLCC

                    /** TRANSACTION LIFETIME TOKEN (ie. the blockhash) */
                    10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, // gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5

                    /* INSTRUCTIONS */
                    2, // Number of instructions

                    // First instruction
                    0, // Program address index
                    2, // Number of address indices
                    1, 2, // Address indices
                    3, // Length of instruction data
                    4, 5, 6, // Instruction data itself

                    // Second instruction
                    1, // Program address index
                    1, // Number of address indices
                    2, // Address indices
                    3, // Length of instruction data
                    7, 8, 9, // Instruction data itself

                    /** ADDRESS TABLE LOOKUPS */
                    1, // Number of address table lookups

                    // First address table lookup
                    44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, // Address of lookup table 3yS1JFVT284y8z1LC9MRoWxZjzFrdoD5axKsZiyMsfC7
                    2, // Number of writable indices
                    66, 55, // Writable indices
                    1, // Number of readonly indices
                    77, // Readonly indices
                ]);

            const expectedMessage: CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage = {
                addressTableLookups: [
                    {
                        lookupTableAddress: '3yS1JFVT284y8z1LC9MRoWxZjzFrdoD5axKsZiyMsfC7' as Address, // decodes to [44{32}]
                        readonlyIndexes: [77],
                        writableIndexes: [66, 55],
                    },
                ],
                header: {
                    numReadonlyNonSignerAccounts: 1,
                    numReadonlySignerAccounts: 2,
                    numSignerAccounts: 3,
                },
                instructions: [
                    {
                        accountIndices: [1, 2],
                        data: new Uint8Array([4, 5, 6]),
                        programAddressIndex: 0,
                    },
                    {
                        accountIndices: [2],
                        data: new Uint8Array([7, 8, 9]),
                        programAddressIndex: 1,
                    },
                ],
                lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5', // decodes to [10{32}]
                staticAccounts: [
                    'k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn' as Address, // decodes to [11{32}]
                    'p2Yicb86aZig616Eav2VWG9vuXR5mEqhtzshZYBxzsV' as Address, // decodes to [12{32}]
                    'swqrv48gsrwpBFbftEwnP2vB4jckpvfGJfXkwaniLCC' as Address, // decodes to [13{32}]
                ],
                version: 0,
            };

            expect(decoder.decode(byteArray)).toStrictEqual(expectedMessage);
        });

        it('decodes a v1 transaction with all config values', () => {
            // prettier-ignore
            const bytes = new Uint8Array([
                /** VERSION HEADER */
                129,

                /** MESSAGE HEADER */
                1, 0, 0,

                /** CONFIG MASK */
                31, 0, 0, 0, // configMask (u32) = 0b11111

                /** LIFETIME TOKEN */
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,

                /** NUM INSTRUCTIONS */
                0,

                /** NUM ADDRESSES */
                1,

                /** STATIC ADDRESSES */
                11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,

                /** CONFIG VALUES */
                136, 19, 0, 0, 0, 0, 0, 0, // 5000 as u64
                64, 13, 3, 0, // 200000 as u32
                0, 250, 0, 0, // 64000 as u32
                0, 232, 3, 0, // 256000 as u32

                /** INSTRUCTION HEADERS */
                // (none)

                /** INSTRUCTION PAYLOADS */
                // (none)
            ]);

            const message = decoder.decode(bytes);

            expect(message).toMatchObject({
                configMask: 31,
                configValues: [
                    { kind: 'u64', value: 5000n },
                    { kind: 'u32', value: 200000 },
                    { kind: 'u32', value: 64000 },
                    { kind: 'u32', value: 256000 },
                ],
                version: 1,
            });
        });

        it('errors when decoding a transaction with an unsupported version', () => {
            // prettier-ignore
            const bytes = new Uint8Array([
                /** VERSION HEADER */
                130, // 2 + version mask (0x80)

                /** The rest of the bytes don't matter since the decoder should error on the version */
                0, 0, 0, 0,
            ]);

            expect(() => decoder.decode(bytes)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
                    unsupportedVersion: 2,
                }),
            );
        });
    },
);
