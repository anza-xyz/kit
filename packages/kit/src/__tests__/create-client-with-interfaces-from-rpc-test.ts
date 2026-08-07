import { BASE_ACCOUNT_SIZE } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import {
    createJsonRpcApi,
    createRpc,
    type GetAccountInfoApi,
    type GetMinimumBalanceForRentExemptionApi,
    type GetMultipleAccountsApi,
    type Rpc,
    type RpcTransport,
} from '@solana/rpc';
import { lamports } from '@solana/rpc-types';

import {
    createClientWithFetchAccountsFromRpc,
    createClientWithGetMinimumBalanceFromRpc,
    createClientWithInterfacesFromRpc,
} from '../create-client-with-interfaces-from-rpc';

const addressA = '1111' as Address<'1111'>;
const addressB = '2222' as Address<'2222'>;

describe('createClientWithGetMinimumBalanceFromRpc', () => {
    function getMockRpc(responseBySize: Record<string, bigint>): Rpc<GetMinimumBalanceForRentExemptionApi> {
        return {
            getMinimumBalanceForRentExemption: jest.fn((size: bigint) => ({
                send: jest.fn().mockResolvedValue(lamports(responseBySize[size.toString()])),
            })),
        } as unknown as Rpc<GetMinimumBalanceForRentExemptionApi>;
    }

    it('computes the minimum balance for the provided space including the account header by default', async () => {
        expect.assertions(2);
        const rpc = getMockRpc({ '100': 1_000_000n });

        const client = createClientWithGetMinimumBalanceFromRpc(rpc);
        const result = await client.getMinimumBalance(100);

        expect(result).toBe(1_000_000n);
        // The space is passed through unchanged; the runtime adds the 128-byte header.
        expect(rpc.getMinimumBalanceForRentExemption).toHaveBeenCalledWith(100n);
    });

    it('computes the header-less minimum balance when withoutHeader is set', async () => {
        expect.assertions(2);
        // Rent for a 128-byte (header-only) account, used to derive the per-byte rate.
        const headerBalance = 1_280_000n;
        const rpc = getMockRpc({ '0': headerBalance });

        const client = createClientWithGetMinimumBalanceFromRpc(rpc);
        const result = await client.getMinimumBalance(100, { withoutHeader: true });

        // (headerBalance / 128) * 100
        const lamportsPerByte = headerBalance / BigInt(BASE_ACCOUNT_SIZE);
        expect(result).toBe(lamportsPerByte * 100n);
        // It queries the header-only balance (size 0) to derive the per-byte rate.
        expect(rpc.getMinimumBalanceForRentExemption).toHaveBeenCalledWith(0n);
    });
});

describe('createClientWithFetchAccountsFromRpc', () => {
    function getMockGetAccountInfo() {
        return jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({ value: null }),
        });
    }

    function getMockGetMultipleAccounts() {
        return jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({ value: [null, null] }),
        });
    }

    it('returns an empty array without issuing any RPC call for an empty address list', async () => {
        expect.assertions(3);
        const getAccountInfo = getMockGetAccountInfo();
        const getMultipleAccounts = getMockGetMultipleAccounts();
        const rpc = { getAccountInfo, getMultipleAccounts } as unknown as Rpc<
            GetAccountInfoApi & GetMultipleAccountsApi
        >;

        const client = createClientWithFetchAccountsFromRpc(rpc);
        const accounts = await client.fetchAccounts([]);

        expect(accounts).toStrictEqual([]);
        expect(getAccountInfo).not.toHaveBeenCalled();
        expect(getMultipleAccounts).not.toHaveBeenCalled();
    });

    it('uses getAccountInfo for a single account', async () => {
        expect.assertions(3);
        const getAccountInfo = getMockGetAccountInfo();
        const getMultipleAccounts = getMockGetMultipleAccounts();
        const rpc = { getAccountInfo, getMultipleAccounts } as unknown as Rpc<
            GetAccountInfoApi & GetMultipleAccountsApi
        >;

        const client = createClientWithFetchAccountsFromRpc(rpc);
        const accounts = await client.fetchAccounts([addressA]);

        expect(getAccountInfo).toHaveBeenCalledWith(addressA, { encoding: 'base64' });
        expect(getMultipleAccounts).not.toHaveBeenCalled();
        expect(accounts).toStrictEqual([{ address: addressA, exists: false }]);
    });

    it('uses getMultipleAccounts for multiple accounts', async () => {
        expect.assertions(3);
        const getAccountInfo = getMockGetAccountInfo();
        const getMultipleAccounts = getMockGetMultipleAccounts();
        const rpc = { getAccountInfo, getMultipleAccounts } as unknown as Rpc<
            GetAccountInfoApi & GetMultipleAccountsApi
        >;

        const client = createClientWithFetchAccountsFromRpc(rpc);
        const accounts = await client.fetchAccounts([addressA, addressB]);

        expect(getMultipleAccounts).toHaveBeenCalledWith([addressA, addressB], { encoding: 'base64' });
        expect(getAccountInfo).not.toHaveBeenCalled();
        expect(accounts).toStrictEqual([
            { address: addressA, exists: false },
            { address: addressB, exists: false },
        ]);
    });
});

describe('createClientWithInterfacesFromRpc', () => {
    it('exposes both interfaces at runtime regardless of the RPC type', () => {
        const rpc = {
            getMinimumBalanceForRentExemption: jest.fn(),
        } as unknown as Rpc<GetMinimumBalanceForRentExemptionApi>;

        const client = createClientWithInterfacesFromRpc(rpc);

        // Both methods are always present at runtime; the return type is what narrows them.
        expect(client).toHaveProperty('getMinimumBalance');
        expect(client).toHaveProperty('fetchAccounts');
    });

    describe('with a proxy-backed RPC', () => {
        // A real Kit `Rpc` is a Proxy with no `has` trap, so `'method' in rpc` is always false. This
        // guards against regressing to runtime capability detection, which would silently return an
        // empty client for such RPCs.
        function getProxyBackedRpc(transport: RpcTransport) {
            return createRpc({
                api: createJsonRpcApi<
                    GetAccountInfoApi & GetMinimumBalanceForRentExemptionApi & GetMultipleAccountsApi
                >(),
                transport,
            });
        }

        it('exposes a working getMinimumBalance and fetchAccounts', async () => {
            expect.assertions(3);
            const responseByMethod: Record<string, unknown> = {
                getAccountInfo: { value: null },
                getMinimumBalanceForRentExemption: 1_000_000n,
                getMultipleAccounts: { value: [null, null] },
            };
            const transport = jest.fn(({ payload }: { payload: { method: string } }) =>
                Promise.resolve(responseByMethod[payload.method]),
            ) as unknown as RpcTransport;
            const rpc = getProxyBackedRpc(transport);

            const client = createClientWithInterfacesFromRpc(rpc);

            await expect(client.getMinimumBalance(100)).resolves.toBe(1_000_000n);
            await expect(client.fetchAccounts([addressA])).resolves.toStrictEqual([
                { address: addressA, exists: false },
            ]);
            await expect(client.fetchAccounts([addressA, addressB])).resolves.toStrictEqual([
                { address: addressA, exists: false },
                { address: addressB, exists: false },
            ]);
        });
    });
});
