import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__ACCOUNTS__EXPECTED_ALL_ACCOUNTS_TO_BE_DECODED,
    SOLANA_ERROR__ACCOUNTS__ONE_OR_MORE_ACCOUNTS_NOT_FOUND,
    SolanaError,
} from '@solana/errors';
import { GetMultipleAccountsApi, Rpc } from '@solana/rpc';

import { fetchAddressesForLookupTables } from '../fetch-lookup-tables';

describe('fetchAddressesForLookupTables', () => {
    describe('when no lookup table addresses are provided', () => {
        it('returns an empty object', async () => {
            expect.assertions(1);
            const rpc = {
                getMultipleAccounts: jest.fn(),
            };

            const lookupTableAddresses: Address[] = [];
            const lookupTables = await fetchAddressesForLookupTables(lookupTableAddresses, rpc);
            expect(lookupTables).toEqual({});
        });

        it('does not call the RPC', async () => {
            expect.assertions(1);
            const rpc = {
                getMultipleAccounts: jest.fn(),
            };

            const lookupTableAddresses: Address[] = [];
            await fetchAddressesForLookupTables(lookupTableAddresses, rpc);
            expect(rpc.getMultipleAccounts).not.toHaveBeenCalled();
        });
    });

    describe('when lookup table addresses are provided', () => {
        it('returns an object with the lookup table addresses as keys and the addresses as values', async () => {
            expect.assertions(1);

            const rpc: Rpc<GetMultipleAccountsApi> = {
                getMultipleAccounts: jest.fn().mockReturnValue({
                    send: jest.fn().mockResolvedValue({
                        value: [
                            {
                                data: {
                                    parsed: {
                                        info: {
                                            addresses: ['1111', '2222'],
                                        },
                                    },
                                },
                            },
                            {
                                data: {
                                    parsed: {
                                        info: {
                                            addresses: ['3333'],
                                        },
                                    },
                                },
                            },
                        ],
                    }),
                }),
            };

            const lookupTableAddresses: Address[] = ['abc' as Address, 'def' as Address];
            const lookupTables = await fetchAddressesForLookupTables(lookupTableAddresses, rpc);

            expect(lookupTables).toEqual({
                abc: ['1111', '2222'],
                def: ['3333'],
            });
        });

        it('throws when the RPC returns invalid data', async () => {
            expect.assertions(1);

            const rpc: Rpc<GetMultipleAccountsApi> = {
                getMultipleAccounts: jest.fn().mockReturnValue({
                    send: jest.fn().mockResolvedValue({
                        value: [
                            {
                                data: {
                                    parsed: {
                                        info: {
                                            addresses: ['1111', '2222'],
                                        },
                                    },
                                },
                            },
                            {
                                data: ['', 'base64'],
                            },
                        ],
                    }),
                }),
            };

            const lookupTableAddresses: Address[] = ['abc' as Address, 'def' as Address];
            await expect(fetchAddressesForLookupTables(lookupTableAddresses, rpc)).rejects.toThrow(
                new SolanaError(SOLANA_ERROR__ACCOUNTS__EXPECTED_ALL_ACCOUNTS_TO_BE_DECODED, {
                    addresses: ['def'],
                }),
            );
        });

        it('throws when the RPC returns missing data', async () => {
            expect.assertions(1);

            const rpc: Rpc<GetMultipleAccountsApi> = {
                getMultipleAccounts: jest.fn().mockReturnValue({
                    send: jest.fn().mockResolvedValue({
                        value: [
                            // returns abc, not def
                            {
                                data: {
                                    parsed: {
                                        info: {
                                            addresses: ['1111', '2222'],
                                        },
                                    },
                                },
                            },
                            null,
                        ],
                    }),
                }),
            };

            const lookupTableAddresses: Address[] = ['abc' as Address, 'def' as Address];
            await expect(fetchAddressesForLookupTables(lookupTableAddresses, rpc)).rejects.toThrow(
                new SolanaError(SOLANA_ERROR__ACCOUNTS__ONE_OR_MORE_ACCOUNTS_NOT_FOUND, { addresses: ['def'] }),
            );
        });
    });
});
