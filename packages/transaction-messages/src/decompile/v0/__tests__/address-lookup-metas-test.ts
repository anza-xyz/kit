import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';
import { AccountRole } from '@solana/instructions';

import { AddressesByLookupTableAddress } from '../../../addresses-by-lookup-table-address';
import { getAddressLookupMetas } from '../address-lookup-metas';

describe('getAddressLookupMetas', () => {
    const lookupTableAddress1 = '9wnrQTq5MKhYfp379pKvpy1PvRyteseQmKv4Bw3uQrUw' as Address;
    const lookupTableAddress2 = 'GS7Rphk6CZLoCGbTcbRaPZzD3k4ZK8XiA5BAj89Fi2Eg' as Address;

    describe('for a single lookup table', () => {
        it('should return readonly account lookup metas for a single index', () => {
            const addressInLookup = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [0],
                    writableIndexes: [],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup],
            };

            const lookupMetas = getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress);

            expect(lookupMetas).toStrictEqual([
                {
                    address: addressInLookup,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.READONLY,
                },
            ]);
        });

        it('should return readonly account lookup metas for multiple indexes', () => {
            const addressInLookup1 = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const addressInLookup2 = '5g6b4v8ivF7haRWMUXT1aewBGsc8xY7B6efGadNc3xYk' as Address;
            const addressInLookup3 = 'HAv2PXRjwr4AL1odpoMNfvsw6bWxjDzURy1nPA6QBhDj' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [0, 2],
                    writableIndexes: [],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup1, addressInLookup3, addressInLookup2],
            };

            const lookupMetas = getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress);

            expect(lookupMetas).toStrictEqual([
                {
                    address: addressInLookup1,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.READONLY,
                },
                {
                    address: addressInLookup2,
                    addressIndex: 2,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.READONLY,
                },
            ]);
        });

        it('should return writable account lookup metas for a single index', () => {
            const addressInLookup = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [],
                    writableIndexes: [0],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup],
            };

            const lookupMetas = getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress);

            expect(lookupMetas).toStrictEqual([
                {
                    address: addressInLookup,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.WRITABLE,
                },
            ]);
        });

        it('should return writable account lookup metas for multiple indexes', () => {
            const addressInLookup1 = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const addressInLookup2 = '5g6b4v8ivF7haRWMUXT1aewBGsc8xY7B6efGadNc3xYk' as Address;
            const addressInLookup3 = 'HAv2PXRjwr4AL1odpoMNfvsw6bWxjDzURy1nPA6QBhDj' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [],
                    writableIndexes: [0, 2],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup1, addressInLookup3, addressInLookup2],
            };

            const lookupMetas = getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress);

            expect(lookupMetas).toStrictEqual([
                {
                    address: addressInLookup1,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.WRITABLE,
                },
                {
                    address: addressInLookup2,
                    addressIndex: 2,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.WRITABLE,
                },
            ]);
        });

        it('should return writable metas first, then readonly metas', () => {
            const addressInLookup1 = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const addressInLookup2 = '5g6b4v8ivF7haRWMUXT1aewBGsc8xY7B6efGadNc3xYk' as Address;
            const addressInLookup3 = 'HAv2PXRjwr4AL1odpoMNfvsw6bWxjDzURy1nPA6QBhDj' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [0],
                    writableIndexes: [2],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup1, addressInLookup3, addressInLookup2],
            };

            const lookupMetas = getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress);

            expect(lookupMetas).toStrictEqual([
                {
                    address: addressInLookup2,
                    addressIndex: 2,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.WRITABLE,
                },
                {
                    address: addressInLookup1,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.READONLY,
                },
            ]);
        });

        it('should return empty array when no indexes are provided', () => {
            const addressInLookup = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [],
                    writableIndexes: [],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup],
            };

            const lookupMetas = getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress);

            expect(lookupMetas).toStrictEqual([]);
        });
    });

    describe('for multiple lookup tables', () => {
        it('should return readonly account lookup metas from multiple tables', () => {
            const addressInLookup1 = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const addressInLookup2 = 'E7p56hzZZEs9vJ1yjxAFjhUP3fN2UJNk2nWvcY7Hz3ee' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [0],
                    writableIndexes: [],
                },
                {
                    lookupTableAddress: lookupTableAddress2,
                    readonlyIndexes: [0],
                    writableIndexes: [],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup1],
                [lookupTableAddress2]: [addressInLookup2],
            };

            const lookupMetas = getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress);

            expect(lookupMetas).toStrictEqual([
                {
                    address: addressInLookup1,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.READONLY,
                },
                {
                    address: addressInLookup2,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress2,
                    role: AccountRole.READONLY,
                },
            ]);
        });

        it('should return writable account lookup metas from multiple tables', () => {
            const addressInLookup1 = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const addressInLookup2 = 'E7p56hzZZEs9vJ1yjxAFjhUP3fN2UJNk2nWvcY7Hz3ee' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [],
                    writableIndexes: [0],
                },
                {
                    lookupTableAddress: lookupTableAddress2,
                    readonlyIndexes: [],
                    writableIndexes: [0],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup1],
                [lookupTableAddress2]: [addressInLookup2],
            };

            const lookupMetas = getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress);

            expect(lookupMetas).toStrictEqual([
                {
                    address: addressInLookup1,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.WRITABLE,
                },
                {
                    address: addressInLookup2,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress2,
                    role: AccountRole.WRITABLE,
                },
            ]);
        });

        it('should return writable metas first across all lookup tables', () => {
            const readonlyAddressInLookup1 = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const readonlyAddressInLookup2 = 'E7p56hzZZEs9vJ1yjxAFjhUP3fN2UJNk2nWvcY7Hz3ee' as Address;
            const writableAddressInLookup1 = 'FgNrG1D7AoqNJuLc5eqmsXSHWta6Tfu41mQ9dgc5yaXo' as Address;
            const writableAddressInLookup2 = '9jEBzMuJfwWH1qcG4g1bj24iSLGCmTsedgisui7SVHes' as Address;

            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [0],
                    writableIndexes: [1],
                },
                {
                    lookupTableAddress: lookupTableAddress2,
                    readonlyIndexes: [0],
                    writableIndexes: [1],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [readonlyAddressInLookup1, writableAddressInLookup1],
                [lookupTableAddress2]: [readonlyAddressInLookup2, writableAddressInLookup2],
            };

            const lookupMetas = getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress);

            expect(lookupMetas).toStrictEqual([
                {
                    address: writableAddressInLookup1,
                    addressIndex: 1,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.WRITABLE,
                },
                {
                    address: writableAddressInLookup2,
                    addressIndex: 1,
                    lookupTableAddress: lookupTableAddress2,
                    role: AccountRole.WRITABLE,
                },
                {
                    address: readonlyAddressInLookup1,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.READONLY,
                },
                {
                    address: readonlyAddressInLookup2,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress2,
                    role: AccountRole.READONLY,
                },
            ]);
        });

        it('should handle multiple indexes across multiple tables', () => {
            const readonlyAddress1InLookup1 = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const readonlyAddress2InLookup1 = 'HAv2PXRjwr4AL1odpoMNfvsw6bWxjDzURy1nPA6QBhDj' as Address;
            const writableAddress1InLookup1 = 'FgNrG1D7AoqNJuLc5eqmsXSHWta6Tfu41mQ9dgc5yaXo' as Address;
            const writableAddress2InLookup1 = '8kud9bpNvfemXYdTFjs5cZ8fZinBkx8JAnhVmRwJZk5e' as Address;

            const readonlyAddressInLookup2 = 'E7p56hzZZEs9vJ1yjxAFjhUP3fN2UJNk2nWvcY7Hz3ee' as Address;
            const writableAddressInLookup2 = '9jEBzMuJfwWH1qcG4g1bj24iSLGCmTsedgisui7SVHes' as Address;

            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [0, 3],
                    writableIndexes: [1, 2],
                },
                {
                    lookupTableAddress: lookupTableAddress2,
                    readonlyIndexes: [0],
                    writableIndexes: [1],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [
                    readonlyAddress1InLookup1,
                    writableAddress1InLookup1,
                    writableAddress2InLookup1,
                    readonlyAddress2InLookup1,
                ],
                [lookupTableAddress2]: [readonlyAddressInLookup2, writableAddressInLookup2],
            };

            const lookupMetas = getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress);

            expect(lookupMetas).toStrictEqual([
                {
                    address: writableAddress1InLookup1,
                    addressIndex: 1,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.WRITABLE,
                },
                {
                    address: writableAddress2InLookup1,
                    addressIndex: 2,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.WRITABLE,
                },
                {
                    address: writableAddressInLookup2,
                    addressIndex: 1,
                    lookupTableAddress: lookupTableAddress2,
                    role: AccountRole.WRITABLE,
                },
                {
                    address: readonlyAddress1InLookup1,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.READONLY,
                },
                {
                    address: readonlyAddress2InLookup1,
                    addressIndex: 3,
                    lookupTableAddress: lookupTableAddress1,
                    role: AccountRole.READONLY,
                },
                {
                    address: readonlyAddressInLookup2,
                    addressIndex: 0,
                    lookupTableAddress: lookupTableAddress2,
                    role: AccountRole.READONLY,
                },
            ]);
        });
    });

    describe('error cases', () => {
        it('should throw when lookup table is not provided', () => {
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [0],
                    writableIndexes: [],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {};

            expect(() => getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING, {
                    lookupTableAddresses: [lookupTableAddress1],
                }),
            );
        });

        it('should throw when multiple lookup tables are not provided', () => {
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [0],
                    writableIndexes: [],
                },
                {
                    lookupTableAddress: lookupTableAddress2,
                    readonlyIndexes: [0],
                    writableIndexes: [],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {};

            expect(() => getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING, {
                    lookupTableAddresses: [lookupTableAddress1, lookupTableAddress2],
                }),
            );
        });

        it('should throw when one of multiple lookup tables is not provided', () => {
            const addressInLookup1 = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [0],
                    writableIndexes: [],
                },
                {
                    lookupTableAddress: lookupTableAddress2,
                    readonlyIndexes: [0],
                    writableIndexes: [],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup1],
            };

            expect(() => getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING, {
                    lookupTableAddresses: [lookupTableAddress2],
                }),
            );
        });

        it('should throw when readonly index is out of range', () => {
            const addressInLookup = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [1],
                    writableIndexes: [],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup],
            };

            expect(() => getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress)).toThrow(
                new SolanaError(
                    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
                    {
                        highestKnownIndex: 0,
                        highestRequestedIndex: 1,
                        lookupTableAddress: lookupTableAddress1,
                    },
                ),
            );
        });

        it('should throw when writable index is out of range', () => {
            const addressInLookup = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [],
                    writableIndexes: [1],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup],
            };

            expect(() => getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress)).toThrow(
                new SolanaError(
                    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
                    {
                        highestKnownIndex: 0,
                        highestRequestedIndex: 1,
                        lookupTableAddress: lookupTableAddress1,
                    },
                ),
            );
        });

        it('should throw when highest readonly index is out of range', () => {
            const addressInLookup1 = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const addressInLookup2 = '5g6b4v8ivF7haRWMUXT1aewBGsc8xY7B6efGadNc3xYk' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [0, 1, 5],
                    writableIndexes: [],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup1, addressInLookup2],
            };

            expect(() => getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress)).toThrow(
                new SolanaError(
                    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
                    {
                        highestKnownIndex: 1,
                        highestRequestedIndex: 5,
                        lookupTableAddress: lookupTableAddress1,
                    },
                ),
            );
        });

        it('should throw when highest writable index is out of range', () => {
            const addressInLookup1 = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const addressInLookup2 = '5g6b4v8ivF7haRWMUXT1aewBGsc8xY7B6efGadNc3xYk' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [],
                    writableIndexes: [0, 1, 5],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup1, addressInLookup2],
            };

            expect(() => getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress)).toThrow(
                new SolanaError(
                    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
                    {
                        highestKnownIndex: 1,
                        highestRequestedIndex: 5,
                        lookupTableAddress: lookupTableAddress1,
                    },
                ),
            );
        });

        it('should throw when index is out of range across mixed readonly and writable', () => {
            const addressInLookup1 = 'F1Vc6AGoxXLwGB7QV8f4So3C5d8SXEk3KKGHxKGEJ8qn' as Address;
            const addressInLookup2 = '5g6b4v8ivF7haRWMUXT1aewBGsc8xY7B6efGadNc3xYk' as Address;
            const compiledAddressTableLookups = [
                {
                    lookupTableAddress: lookupTableAddress1,
                    readonlyIndexes: [0],
                    writableIndexes: [3],
                },
            ];
            const addressesByLookupTableAddress: AddressesByLookupTableAddress = {
                [lookupTableAddress1]: [addressInLookup1, addressInLookup2],
            };

            expect(() => getAddressLookupMetas(compiledAddressTableLookups, addressesByLookupTableAddress)).toThrow(
                new SolanaError(
                    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
                    {
                        highestKnownIndex: 1,
                        highestRequestedIndex: 3,
                        lookupTableAddress: lookupTableAddress1,
                    },
                ),
            );
        });
    });
});
