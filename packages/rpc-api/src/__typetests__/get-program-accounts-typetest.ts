import type { Address } from '@solana/addresses';
import type { PendingRpcRequest, Rpc } from '@solana/rpc-spec';
import type { Base58EncodedBytes, Base64EncodedBytes, GetProgramAccountsMemcmpFilter } from '@solana/rpc-types';

import type { GetProgramAccountsApi } from '../getProgramAccounts';

const rpc = null as unknown as Rpc<GetProgramAccountsApi>;
const programAddress = null as unknown as Address;
const filterAddress = null as unknown as Address;

// [DESCRIBE] The `memcmp` filter on `getProgramAccounts`.
{
    // It accepts an `Address` as the base58 filter bytes.
    {
        rpc.getProgramAccounts(programAddress, {
            encoding: 'base64',
            filters: [
                {
                    memcmp: {
                        bytes: filterAddress,
                        encoding: 'base58',
                        offset: 0n,
                    },
                },
            ],
        }) satisfies PendingRpcRequest<unknown>;
    }
    // It accepts a `Base58EncodedBytes` value as the base58 filter bytes.
    {
        const base58Bytes = null as unknown as Base58EncodedBytes;
        rpc.getProgramAccounts(programAddress, {
            encoding: 'base64',
            filters: [
                {
                    memcmp: {
                        bytes: base58Bytes,
                        encoding: 'base58',
                        offset: 0n,
                    },
                },
            ],
        }) satisfies PendingRpcRequest<unknown>;
    }
    // It accepts a `Base64EncodedBytes` value as the base64 filter bytes.
    {
        const base64Bytes = null as unknown as Base64EncodedBytes;
        rpc.getProgramAccounts(programAddress, {
            encoding: 'base64',
            filters: [
                {
                    memcmp: {
                        bytes: base64Bytes,
                        encoding: 'base64',
                        offset: 0n,
                    },
                },
            ],
        }) satisfies PendingRpcRequest<unknown>;
    }
    // It rejects an `Address` as the bytes of a base64 memcmp filter.
    {
        const filter = {
            memcmp: {
                bytes: filterAddress,
                encoding: 'base64' as const,
                offset: 0n,
            },
        };
        // @ts-expect-error An `Address` is base-58 encoded, so it cannot serve as the bytes of a base-64 filter.
        filter satisfies GetProgramAccountsMemcmpFilter;
    }
}
