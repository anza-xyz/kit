import { Address } from '@solana/addresses';
import { Decoder, Encoder, ReadonlyUint8Array } from '@solana/codecs-core';

import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '../../../compile/message';
import { getMessageCodec, getMessageDecoder, getMessageEncoder } from '../message';

type V1CompiledTransactionMessage = CompiledTransactionMessage & { version: 1 };

describe.each([getMessageCodec, getMessageEncoder])('V1 Transaction message encoder %p', encoderFactory => {
    let encoder: Encoder<
        V1CompiledTransactionMessage | (CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage)
    >;
    beforeEach(() => {
        encoder = encoderFactory();
    });

    it('encodes a v1 transaction with no config values', () => {
        const message: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
            // encodes to [10{32}]
            configMask: 0,

            configValues: [],

            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 1,
                numSignerAccounts: 2,
            },

            instructionHeaders: [
                {
                    numInstructionAccounts: 1,
                    numInstructionDataBytes: 3,
                    programAccountIndex: 1,
                },
            ],
            instructionPayloads: [
                {
                    instructionAccountIndices: [0],
                    instructionData: new Uint8Array([1, 2, 3]) as ReadonlyUint8Array,
                },
            ],
            lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5',
            numInstructions: 1,
            numStaticAccounts: 2,
            staticAccounts: [
                'k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn' as Address, // encodes to [11{32}]
                'p2Yicb86aZig616Eav2VWG9vuXR5mEqhtzshZYBxzsV' as Address, // encodes to [12{32}]
            ],
            version: 1,
        };

        expect(encoder.encode(message)).toStrictEqual(
            // prettier-ignore
            new Uint8Array([
                /** VERSION HEADER */
                129, // 1 + version mask (0x80)

                /** MESSAGE HEADER */
                2, // numSignerAccounts
                1, // numReadonlySignerAccounts
                1, // numReadonlyNonSignerAccounts

                /** CONFIG MASK */
                0, 0, 0, 0, // configMask (u32) = 0

                /** LIFETIME TOKEN (blockhash) */
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,

                /** NUM INSTRUCTIONS */
                1, // numInstructions (u8)

                /** NUM ADDRESSES */
                2, // numStaticAccounts (u8)

                /** STATIC ADDRESSES */
                11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
                12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,

                /** CONFIG VALUES */
                // (none - mask is 0)

                /** INSTRUCTION HEADERS */
                1, // programAccountIndex
                1, // numInstructionAccounts
                3, 0, // numInstructionDataBytes (u16, little endian)

                /** INSTRUCTION PAYLOADS */
                0, // account index
                1, 2, 3, // instruction data
            ]),
        );
    });

    it('encodes a v1 transaction with priority fee only', () => {
        const message: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
            configMask: 0b11,
            // Priority fee bits
            configValues: [{ kind: 'u64', value: 5000n }],

            header: {
                numReadonlyNonSignerAccounts: 1,
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
                1, 0, 1,

                /** CONFIG MASK */
                3, 0, 0, 0, // configMask (u32) = 0b11

                /** LIFETIME TOKEN */
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,

                /** NUM INSTRUCTIONS */
                0,

                /** NUM ADDRESSES */
                1,

                /** STATIC ADDRESSES */
                11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,

                /** CONFIG VALUES */
                136, 19, 0, 0, 0, 0, 0, 0, // 5000 as u64 (little endian)

                /** INSTRUCTION HEADERS */
                // (none)

                /** INSTRUCTION PAYLOADS */
                // (none)
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

    it('encodes a v1 transaction with multiple instructions', () => {
        const message: CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage = {
            configMask: 0,
            configValues: [],
            header: {
                numReadonlyNonSignerAccounts: 2,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 1,
            },
            instructionHeaders: [
                {
                    numInstructionAccounts: 2,
                    numInstructionDataBytes: 3,
                    programAccountIndex: 1,
                },
                {
                    numInstructionAccounts: 1,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 2,
                },
            ],
            instructionPayloads: [
                {
                    instructionAccountIndices: [0, 2],
                    instructionData: new Uint8Array([10, 20, 30]) as ReadonlyUint8Array,
                },
                {
                    instructionAccountIndices: [0],
                    instructionData: new Uint8Array([]) as ReadonlyUint8Array,
                },
            ],
            lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5',
            numInstructions: 2,
            numStaticAccounts: 3,
            staticAccounts: [
                'k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn' as Address,
                'p2Yicb86aZig616Eav2VWG9vuXR5mEqhtzshZYBxzsV' as Address,
                'swqrv48gsrwpBFbftEwnP2vB4jckpvfGJfXkwaniLCC' as Address,
            ],
            version: 1,
        };

        expect(encoder.encode(message)).toStrictEqual(
            // prettier-ignore
            new Uint8Array([
                /** VERSION HEADER */
                129,

                /** MESSAGE HEADER */
                1, 0, 2,

                /** CONFIG MASK */
                0, 0, 0, 0,

                /** LIFETIME TOKEN */
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,

                /** NUM INSTRUCTIONS */
                2,

                /** NUM ADDRESSES */
                3,

                /** STATIC ADDRESSES */
                11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
                12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
                13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,

                /** CONFIG VALUES */
                // (none)

                /** INSTRUCTION HEADERS */
                1, 2, 3, 0, // First header
                2, 1, 0, 0, // Second header

                /** INSTRUCTION PAYLOADS */
                0, 2, // First payload account indices
                10, 20, 30, // First payload data
                0, // Second payload account index
                // Second payload has no data
            ]),
        );
    });
});

describe.each([getMessageCodec, getMessageDecoder])('V1 Transaction message decoder %p', decoderFactory => {
    let decoder: Decoder<CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage>;
    beforeEach(() => {
        decoder = decoderFactory();
    });

    it('decodes a v1 transaction with no config values', () => {
        // prettier-ignore
        const bytes = new Uint8Array([
            /** VERSION HEADER */
            129, // 1 + version mask (0x80)

            /** MESSAGE HEADER */
            2, // numSignerAccounts
            1, // numReadonlySignerAccounts
            1, // numReadonlyNonSignerAccounts

            /** CONFIG MASK */
            0, 0, 0, 0, // configMask (u32) = 0

            /** LIFETIME TOKEN (blockhash) */
            10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,

            /** NUM INSTRUCTIONS */
            1, // numInstructions (u8)

            /** NUM ADDRESSES */
            2, // numStaticAccounts (u8)

            /** STATIC ADDRESSES */
            11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
            12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,

            /** CONFIG VALUES */
            // (none - mask is 0)

            /** INSTRUCTION HEADERS */
            1, // programAccountIndex
            1, // numInstructionAccounts
            3, 0, // numInstructionDataBytes (u16, little endian)

            /** INSTRUCTION PAYLOADS */
            0, // account index
            1, 2, 3, // instruction data
        ]);

        const message = decoder.decode(bytes);

        expect(message).toMatchObject({
            configMask: 0,
            configValues: [],
            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 1,
                numSignerAccounts: 2,
            },
            instructionHeaders: [
                {
                    numInstructionAccounts: 1,
                    numInstructionDataBytes: 3,
                    programAccountIndex: 1,
                },
            ],
            instructionPayloads: [
                {
                    instructionAccountIndices: [0],
                    instructionData: new Uint8Array([1, 2, 3]),
                },
            ],
            numInstructions: 1,
            numStaticAccounts: 2,
            version: 1,
        });
        expect(message.staticAccounts).toHaveLength(2);
        expect(message.lifetimeToken).toBe('gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5');
    });

    it('decodes a v1 transaction with priority fee', () => {
        // prettier-ignore
        const bytes = new Uint8Array([
            /** VERSION HEADER */
            129,

            /** MESSAGE HEADER */
            1, 0, 1,

            /** CONFIG MASK */
            3, 0, 0, 0, // configMask (u32) = 0b11

            /** LIFETIME TOKEN */
            10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,

            /** NUM INSTRUCTIONS */
            0,

            /** NUM ADDRESSES */
            1,

            /** STATIC ADDRESSES */
            11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,

            /** CONFIG VALUES */
            136, 19, 0, 0, 0, 0, 0, 0, // 5000 as u64 (little endian)

            /** INSTRUCTION HEADERS */
            // (none)

            /** INSTRUCTION PAYLOADS */
            // (none)
        ]);

        const message = decoder.decode(bytes);

        expect(message).toMatchObject({
            configMask: 3,
            configValues: [{ kind: 'u64', value: 5000n }],
            numInstructions: 0,
            numStaticAccounts: 1,
            version: 1,
        });
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

    it('decodes a v1 transaction with multiple instructions', () => {
        // prettier-ignore
        const bytes = new Uint8Array([
            /** VERSION HEADER */
            129,

            /** MESSAGE HEADER */
            1, 0, 2,

            /** CONFIG MASK */
            0, 0, 0, 0,

            /** LIFETIME TOKEN */
            10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,

            /** NUM INSTRUCTIONS */
            2,

            /** NUM ADDRESSES */
            3,

            /** STATIC ADDRESSES */
            11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
            12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
            13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,

            /** CONFIG VALUES */
            // (none)

            /** INSTRUCTION HEADERS */
            1, 2, 3, 0, // First header
            2, 1, 0, 0, // Second header

            /** INSTRUCTION PAYLOADS */
            0, 2, // First payload account indices
            10, 20, 30, // First payload data
            0, // Second payload account index
            // Second payload has no data
        ]);

        const message = decoder.decode(bytes);

        expect(message).toMatchObject({
            instructionHeaders: [
                {
                    numInstructionAccounts: 2,
                    numInstructionDataBytes: 3,
                    programAccountIndex: 1,
                },
                {
                    numInstructionAccounts: 1,
                    numInstructionDataBytes: 0,
                    programAccountIndex: 2,
                },
            ],
            instructionPayloads: [
                {
                    instructionAccountIndices: [0, 2],
                    instructionData: new Uint8Array([10, 20, 30]),
                },
                {
                    instructionAccountIndices: [0],
                    instructionData: new Uint8Array([]),
                },
            ],
            numInstructions: 2,
            numStaticAccounts: 3,
            version: 1,
        });
    });
});
