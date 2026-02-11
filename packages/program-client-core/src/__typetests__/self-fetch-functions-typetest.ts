import type { Account, FetchAccountConfig, FetchAccountsConfig, MaybeAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import type { Codec, FixedSizeCodec, ReadonlyUint8Array, VariableSizeCodec } from '@solana/codecs-core';
import type { ClientWithRpc } from '@solana/plugin-interfaces';
import type { GetAccountInfoApi, GetMultipleAccountsApi } from '@solana/rpc-api';

import { addSelfFetchFunctions, type SelfFetchFunctions } from '../index';

type RpcClient = ClientWithRpc<GetAccountInfoApi & GetMultipleAccountsApi>;

type MyAccountData = { age: number; name: string };

// [DESCRIBE] SelfFetchFunctions.
{
    // It provides a fetch method that returns a promise of an Account.
    {
        const self = null as unknown as SelfFetchFunctions<MyAccountData, MyAccountData>;
        const address = null as unknown as Address<'1111'>;
        void (self.fetch(address) satisfies Promise<Account<MyAccountData, '1111'>>);
    }

    // It provides a fetchMaybe method that returns a promise of a MaybeAccount.
    {
        const self = null as unknown as SelfFetchFunctions<MyAccountData, MyAccountData>;
        const address = null as unknown as Address<'1111'>;
        void (self.fetchMaybe(address) satisfies Promise<MaybeAccount<MyAccountData, '1111'>>);
    }

    // It provides a fetchAll method that returns a promise of an array of Accounts.
    {
        const self = null as unknown as SelfFetchFunctions<MyAccountData, MyAccountData>;
        const addresses = null as unknown as Address[];
        void (self.fetchAll(addresses) satisfies Promise<Account<MyAccountData>[]>);
    }

    // It provides a fetchAllMaybe method that returns a promise of an array of MaybeAccounts.
    {
        const self = null as unknown as SelfFetchFunctions<MyAccountData, MyAccountData>;
        const addresses = null as unknown as Address[];
        void (self.fetchAllMaybe(addresses) satisfies Promise<MaybeAccount<MyAccountData>[]>);
    }

    // All single-account methods accept an optional FetchAccountConfig.
    {
        const self = null as unknown as SelfFetchFunctions<MyAccountData, MyAccountData>;
        const address = null as unknown as Address<'1111'>;
        const config: FetchAccountConfig = { commitment: 'confirmed' };
        void (self.fetch(address, config) satisfies Promise<Account<MyAccountData, '1111'>>);
        void (self.fetchMaybe(address, config) satisfies Promise<MaybeAccount<MyAccountData, '1111'>>);
    }

    // All multi-account methods accept an optional FetchAccountsConfig.
    {
        const self = null as unknown as SelfFetchFunctions<MyAccountData, MyAccountData>;
        const addresses = null as unknown as Address[];
        const config: FetchAccountsConfig = { commitment: 'confirmed' };
        void (self.fetchAll(addresses, config) satisfies Promise<Account<MyAccountData>[]>);
        void (self.fetchAllMaybe(addresses, config) satisfies Promise<MaybeAccount<MyAccountData>[]>);
    }

    // It supports different TFrom and TTo types.
    {
        type MyAccountInput = { age: bigint | number; name: string };
        const self = null as unknown as SelfFetchFunctions<MyAccountInput, MyAccountData>;
        const address = null as unknown as Address<'1111'>;
        // The decoded type should be TTo (MyAccountData), not TFrom (MyAccountInput).
        void (self.fetch(address) satisfies Promise<Account<MyAccountData, '1111'>>);
    }
}

// [DESCRIBE] addSelfFetchFunctions.
{
    // It returns a Codec with SelfFetchFunctions when given a Codec.
    {
        const client = null as unknown as RpcClient;
        const codec = null as unknown as FixedSizeCodec<MyAccountData>;
        const result = addSelfFetchFunctions(client, codec);
        result satisfies Codec<MyAccountData> & SelfFetchFunctions<MyAccountData, MyAccountData>;
    }

    // It preserves the specific codec type.
    {
        type MyCodec = FixedSizeCodec<MyAccountData> & { custom: 42 };
        const client = null as unknown as RpcClient;
        const codec = null as unknown as MyCodec;
        const result = addSelfFetchFunctions(client, codec);
        result satisfies MyCodec;
    }

    // It supports codecs with different TFrom and TTo types.
    {
        type MyAccountInput = { age: bigint | number; name: string };
        const client = null as unknown as RpcClient;
        const codec = null as unknown as Codec<MyAccountInput, MyAccountData>;
        const result = addSelfFetchFunctions(client, codec);
        result satisfies Codec<MyAccountInput, MyAccountData> & SelfFetchFunctions<MyAccountInput, MyAccountData>;
    }

    // The fetch methods use the TTo type for Account data.
    {
        type MyAccountInput = { age: bigint | number; name: string };
        const client = null as unknown as RpcClient;
        const codec = null as unknown as Codec<MyAccountInput, MyAccountData>;
        const result = addSelfFetchFunctions(client, codec);
        const address = null as unknown as Address<'1111'>;
        // The fetched account should have TTo (MyAccountData) as its data type.
        void (result.fetch(address) satisfies Promise<Account<MyAccountData, '1111'>>);
    }

    // It retains codec methods like encode, decode and size attributes.
    {
        const client = null as unknown as RpcClient;
        const codec = null as unknown as VariableSizeCodec<MyAccountData>;
        const result = addSelfFetchFunctions(client, codec);
        // Should still be able to use codec methods.
        result.encode({ age: 30, name: 'Alice' }) satisfies ReadonlyUint8Array;
        result.decode(new Uint8Array()) satisfies MyAccountData;
        result.getSizeFromValue({ age: 30, name: 'Alice' }) satisfies number;
    }

    // It works with a codec factory function that returns a Codec.
    {
        type MyAccountInput = { age: bigint | number; name: string };
        const client = null as unknown as RpcClient;
        const getMyAccountCodec = null as unknown as () => FixedSizeCodec<MyAccountInput, MyAccountData>;
        const result = addSelfFetchFunctions(client, getMyAccountCodec());
        result satisfies ReturnType<typeof getMyAccountCodec> & SelfFetchFunctions<MyAccountInput, MyAccountData>;
    }
}
