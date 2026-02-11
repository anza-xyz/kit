import '@solana/test-matchers/toBeFrozenObject';

import { fetchEncodedAccount, fetchEncodedAccounts, type MaybeEncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import { getStructCodec } from '@solana/codecs-data-structures';
import { getU8Codec } from '@solana/codecs-numbers';
import {
    SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND,
    SOLANA_ERROR__ACCOUNTS__ONE_OR_MORE_ACCOUNTS_NOT_FOUND,
    SolanaError,
} from '@solana/errors';
import type { ClientWithRpc } from '@solana/plugin-interfaces';
import type { GetAccountInfoApi, GetMultipleAccountsApi } from '@solana/rpc-api';

import { addSelfFetchFunctions } from '../index';

jest.mock('@solana/accounts', () => ({
    ...jest.requireActual('@solana/accounts'),
    fetchEncodedAccount: jest.fn(),
    fetchEncodedAccounts: jest.fn(),
}));

const mockClient = { rpc: {} } as ClientWithRpc<GetAccountInfoApi & GetMultipleAccountsApi>;
const mockAddressA = '1111' as Address<'1111'>;
const mockAddressB = '2222' as Address<'2222'>;
const mockAddressMissing = '3333' as Address<'3333'>;

function getMockCodec() {
    return getStructCodec([['value', getU8Codec()]]);
}

function fetchEncodedAccountImpl(address: Address): MaybeEncodedAccount {
    switch (address) {
        case mockAddressA:
            return { address, data: new Uint8Array([1]), exists: true } as MaybeEncodedAccount;
        case mockAddressB:
            return { address, data: new Uint8Array([2]), exists: true } as MaybeEncodedAccount;
        default:
            return { address, exists: false };
    }
}

describe('addSelfFetchFunctions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(fetchEncodedAccount).mockImplementation((_rpc, address) =>
            Promise.resolve(fetchEncodedAccountImpl(address)),
        );
        jest.mocked(fetchEncodedAccounts).mockImplementation((_rpc, addresses) =>
            Promise.resolve(addresses.map(fetchEncodedAccountImpl)),
        );
    });

    describe('fetch', () => {
        it('fetches and decodes a single account', async () => {
            expect.assertions(2);
            const codec = addSelfFetchFunctions(mockClient, getMockCodec());
            const config = { commitment: 'confirmed' as const };
            const result = await codec.fetch(mockAddressA, config);

            expect(fetchEncodedAccount).toHaveBeenCalledWith(mockClient.rpc, mockAddressA, config);
            expect(result).toMatchObject({ address: mockAddressA, data: { value: 1 } });
        });

        it('throws when account does not exist', async () => {
            expect.assertions(1);
            const codec = addSelfFetchFunctions(mockClient, getMockCodec());

            await expect(codec.fetch(mockAddressMissing)).rejects.toThrow(
                new SolanaError(SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, { address: mockAddressMissing }),
            );
        });
    });

    describe('fetchMaybe', () => {
        it('fetches and decodes a single account without asserting existence', async () => {
            expect.assertions(2);
            const codec = addSelfFetchFunctions(mockClient, getMockCodec());
            const config = { commitment: 'confirmed' as const };
            const result = await codec.fetchMaybe(mockAddressA, config);

            expect(fetchEncodedAccount).toHaveBeenCalledWith(mockClient.rpc, mockAddressA, config);
            expect(result).toMatchObject({ address: mockAddressA, data: { value: 1 }, exists: true });
        });

        it('returns a MaybeAccount for missing accounts without throwing', async () => {
            expect.assertions(1);
            const codec = addSelfFetchFunctions(mockClient, getMockCodec());
            const result = await codec.fetchMaybe(mockAddressMissing);

            expect(result).toStrictEqual({ address: mockAddressMissing, exists: false });
        });
    });

    describe('fetchAll', () => {
        it('fetches and decodes multiple accounts', async () => {
            expect.assertions(4);
            const codec = addSelfFetchFunctions(mockClient, getMockCodec());
            const addresses = [mockAddressA, mockAddressB];
            const config = { commitment: 'confirmed' as const };
            const result = await codec.fetchAll(addresses, config);

            expect(fetchEncodedAccounts).toHaveBeenCalledWith(mockClient.rpc, addresses, config);
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ address: mockAddressA, data: { value: 1 } });
            expect(result[1]).toMatchObject({ address: mockAddressB, data: { value: 2 } });
        });

        it('throws when any account does not exist', async () => {
            expect.assertions(1);
            const codec = addSelfFetchFunctions(mockClient, getMockCodec());

            await expect(codec.fetchAll([mockAddressA, mockAddressMissing])).rejects.toThrow(
                new SolanaError(SOLANA_ERROR__ACCOUNTS__ONE_OR_MORE_ACCOUNTS_NOT_FOUND, {
                    addresses: [mockAddressMissing],
                }),
            );
        });
    });

    describe('fetchAllMaybe', () => {
        it('fetches and decodes multiple accounts without asserting existence', async () => {
            expect.assertions(4);
            const codec = addSelfFetchFunctions(mockClient, getMockCodec());
            const addresses = [mockAddressA, mockAddressB];
            const config = { commitment: 'confirmed' as const };
            const result = await codec.fetchAllMaybe(addresses, config);

            expect(fetchEncodedAccounts).toHaveBeenCalledWith(mockClient.rpc, addresses, config);
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ address: mockAddressA, data: { value: 1 }, exists: true });
            expect(result[1]).toMatchObject({ address: mockAddressB, data: { value: 2 }, exists: true });
        });

        it('returns MaybeAccounts including missing accounts without throwing', async () => {
            expect.assertions(3);
            const codec = addSelfFetchFunctions(mockClient, getMockCodec());
            const result = await codec.fetchAllMaybe([mockAddressA, mockAddressMissing]);

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ address: mockAddressA, data: { value: 1 }, exists: true });
            expect(result[1]).toStrictEqual({ address: mockAddressMissing, exists: false });
        });
    });

    describe('codec preservation', () => {
        it('preserves the original codec methods', () => {
            const originalCodec = getMockCodec();
            const result = addSelfFetchFunctions(mockClient, originalCodec);

            expect(result.encode).toBe(originalCodec.encode);
            expect(result.decode).toBe(originalCodec.decode);
            expect(result.read).toBe(originalCodec.read);
            expect(result.write).toBe(originalCodec.write);
            expect(result.fixedSize).toBe(originalCodec.fixedSize);
        });

        it('preserves custom properties from the codec', () => {
            const customCodec = { ...getMockCodec(), custom: 42 };
            const result = addSelfFetchFunctions(mockClient, customCodec);

            expect(result.custom).toBe(42);
        });

        it('returns a frozen object', () => {
            const result = addSelfFetchFunctions(mockClient, getMockCodec());

            expect(result).toBeFrozenObject();
        });
    });
});
