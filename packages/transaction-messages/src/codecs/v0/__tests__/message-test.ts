import { Address } from '@solana/addresses';
import { Decoder, Encoder } from '@solana/codecs-core';

import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '../../../compile/message';
import { getMessageCodec, getMessageDecoder, getMessageEncoder } from '../message';

type V0CompiledTransactionMessage = CompiledTransactionMessage & { version: 0 };

describe.each([getMessageCodec, getMessageEncoder])('Transaction message encoder %p', encoderFactory => {
    let encoder: Encoder<
        V0CompiledTransactionMessage | (CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage)
    >;
    beforeEach(() => {
        encoder = encoderFactory();
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

    it('encodes a v0 transaction with no address lookup tables correctly', () => {
        const message: CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage = {
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
                0, // Number of address table lookups
            ]),
        );
    });

    it('encodes a v0 transaction with no instructions correctly', () => {
        const message: CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 2,
                numSignerAccounts: 3,
            },
            instructions: [],
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
                0, // Number of instructions

                /** ADDRESS TABLE LOOKUPS */
                0, // Number of address table lookups
            ]),
        );
    });

    it('encodes a v0 transaction with no instructions and no accounts correctly', () => {
        const message: CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 2,
                numSignerAccounts: 3,
            },
            instructions: [],
            lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5', // encodes to [10{32}]
            staticAccounts: [],
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
                0, // Number of static accounts

                /** TRANSACTION LIFETIME TOKEN (ie. the blockhash) */
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, // gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5

                /* INSTRUCTIONS */
                0, // Number of instructions

                /** ADDRESS TABLE LOOKUPS */
                0, // Number of address table lookups
            ]),
        );
    });
});

describe.each([getMessageCodec, getMessageDecoder])('Transaction message decoder %p', decoderFactory => {
    let decoder: Decoder<V0CompiledTransactionMessage>;
    beforeEach(() => {
        decoder = decoderFactory();
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

    it('decodes a v0 transaction with no address lookup tables to exclude the addressLookupTables field', () => {
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
                0, // Number of address table lookups
            ]);

        expect(decoder.decode(byteArray)).not.toHaveProperty('addressTableLookups');
    });

    it('decodes a v0 transaction with no instructions correctly', () => {
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
                0, // Number of instructions
            ]);

        const expectedMessage: CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 2,
                numSignerAccounts: 3,
            },
            instructions: [],
            lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5', // encodes to [10{32}]
            staticAccounts: [
                'k7FaK87WHGVXzkaoHb7CdVPgkKDQhZ29VLDeBVbDfYn' as Address, // encodes to [11{32}]
                'p2Yicb86aZig616Eav2VWG9vuXR5mEqhtzshZYBxzsV' as Address, // encodes to [12{32}]
                'swqrv48gsrwpBFbftEwnP2vB4jckpvfGJfXkwaniLCC' as Address, // encodes to [13{32}]
            ],
            version: 0,
        };

        expect(decoder.decode(byteArray)).toStrictEqual(expectedMessage);
    });

    it('decodes a v0 transaction with no instructions and no accounts correctly', () => {
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
                0, // Number of static accounts

                /** TRANSACTION LIFETIME TOKEN (ie. the blockhash) */
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, // gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5

                /* INSTRUCTIONS */
                0, // Number of instructions
            ]);

        const expectedMessage: CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 2,
                numSignerAccounts: 3,
            },
            instructions: [],
            lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5', // encodes to [10{32}]
            staticAccounts: [],
            version: 0,
        };

        expect(decoder.decode(byteArray)).toStrictEqual(expectedMessage);
    });
});
