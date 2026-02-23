import { Address } from '@solana/addresses';
import { Decoder, Encoder } from '@solana/codecs-core';

import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '../../../compile/message';
import { getMessageCodec, getMessageDecoder, getMessageEncoder } from '../message';

type LegacyCompiledTransactionMessage = CompiledTransactionMessage & { version: 'legacy' };

describe.each([getMessageCodec, getMessageEncoder])('Transaction message encoder %p', encoderFactory => {
    let encoder: Encoder<
        LegacyCompiledTransactionMessage | (CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage)
    >;
    beforeEach(() => {
        encoder = encoderFactory();
    });

    it('encodes a legacy transaction correctly', () => {
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

    it('encodes a legacy transaction with no instructions correctly', () => {
        const message: CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage = {
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
                0, // Number of instructions
            ]),
        );
    });

    it('encodes a legacy transaction with no instructions and no accounts correctly', () => {
        const message: CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 2,
                numSignerAccounts: 3,
            },
            instructions: [],
            lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5', // encodes to [10{32}]
            staticAccounts: [],
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
                0, // Number of static accounts

                /** TRANSACTION LIFETIME TOKEN (ie. the blockhash) */
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, // gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5

                /* INSTRUCTIONS */
                0, // Number of instructions
            ]),
        );
    });
});

describe.each([getMessageCodec, getMessageDecoder])('Transaction message decoder %p', decoderFactory => {
    let decoder: Decoder<LegacyCompiledTransactionMessage>;
    beforeEach(() => {
        decoder = decoderFactory();
    });

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

    it('decodes a legacy transaction with no instructions correctly', () => {
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
                    0, // Number of instructions
                ]);

        const expectedMessage: CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage = {
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
            version: 'legacy',
        };

        expect(decoder.decode(byteArray)).toStrictEqual(expectedMessage);
    });

    it('decodes a legacy transaction with no instructions and no accounts correctly', () => {
        const byteArray =
            // prettier-ignore
            new Uint8Array([
                    /** NO VERSION HEADER */

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

        const expectedMessage: CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage = {
            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 2,
                numSignerAccounts: 3,
            },
            instructions: [],
            lifetimeToken: 'gBxS1f6uyyGPuW5MzGBukidSb71jdsCb5fZaoSzULE5', // encodes to [10{32}]
            staticAccounts: [],
            version: 'legacy',
        };

        expect(decoder.decode(byteArray)).toStrictEqual(expectedMessage);
    });
});
