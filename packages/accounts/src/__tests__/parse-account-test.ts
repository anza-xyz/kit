import '@solana/test-matchers/toBeFrozenObject';

import type { Address } from '@solana/addresses';
import { lamports } from '@solana/rpc-types';

import { Account, EncodedAccount } from '../account';
import { MaybeAccount, MaybeEncodedAccount } from '../maybe-account';
import { parseBase58RpcAccount, parseBase64RpcAccount, parseJsonRpcAccount } from '../parse-account';
import { Base58RpcAccount, Base64RpcAccount, JsonParsedRpcAccount } from './__setup__';

describe('parseBase64RpcAccount', () => {
    it('parses an encoded account with base64 data', () => {
        // Given an address and an RPC account with base64 data.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <Base64RpcAccount>{
            data: ['somedata', 'base64'],
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 6n,
        };

        // When we parse that RPC account using the parseBase64RpcAccount function.
        const account = parseBase64RpcAccount(address, rpcAccount);

        // Then we expect account to be an EncodedAccount.
        account satisfies EncodedAccount;

        // And we expect the following parsed encoded account to be returned.
        expect(account).toStrictEqual({
            address: '1111',
            data: new Uint8Array([178, 137, 158, 117, 171, 90]),
            executable: false,
            exists: true,
            lamports: 1_000_000_000n,
            programAddress: '9999',
            space: 6n,
        });
    });

    it('parses an empty account', () => {
        // Given an address with no matching RPC account.
        const address = '1111' as Address<'1111'>;

        // When we parse null for that address using the parseBase64RpcAccount function.
        const account = parseBase64RpcAccount(address, null);

        // Then we expect account to be a MaybeEncodedAccount.
        account satisfies MaybeEncodedAccount;

        // And we expect the following parsed data to be returned.
        expect(account).toStrictEqual({ address: '1111', exists: false });
    });

    it('freezes the returned encoded account', () => {
        // Given an address and an RPC account with base64 data.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <Base64RpcAccount>{
            data: ['somedata', 'base64'],
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 6n,
        };

        // When we parse that RPC account using the parseBase64RpcAccount function.
        const account = parseBase64RpcAccount(address, rpcAccount);

        // Then we expect the returned account to be frozen.
        expect(account).toBeFrozenObject();
    });

    it('freezes the returned empty account', () => {
        // Given an address with no matching RPC account.
        const address = '1111' as Address<'1111'>;

        // When we parse that address with a null RPC account.
        const account = parseBase64RpcAccount(address, null);

        // Then we expect the returned empty account to be frozen.
        expect(account).toBeFrozenObject();
    });
});

describe('parseBase58RpcAccount', () => {
    it('parses an encoded account with base58 data', () => {
        // Given an address and an RPC account with base58 data.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <Base58RpcAccount>{
            data: ['somedata', 'base58'],
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 6n,
        };

        // When we parse that RPC account using the parseBase58RpcAccount function.
        const account = parseBase58RpcAccount(address, rpcAccount);

        // Then we expect account to be an EncodedAccount.
        account satisfies EncodedAccount;

        // And we expect the following parsed encoded account to be returned.
        expect(account).toStrictEqual({
            address: '1111',
            data: new Uint8Array([102, 6, 221, 155, 82, 67]),
            executable: false,
            exists: true,
            lamports: 1_000_000_000n,
            programAddress: '9999',
            space: 6n,
        });
    });

    it('parses an encoded account with implicit base58 data', () => {
        // Given an address and an RPC account with implicit base58 data.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <Base58RpcAccount>{
            data: 'somedata',
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 6n,
        };

        // When we parse that RPC account using the parseBase58RpcAccount function.
        const account = parseBase58RpcAccount(address, rpcAccount);

        // Then we expect account to be an EncodedAccount.
        account satisfies EncodedAccount;

        // And we expect the following parsed encoded account to be returned.
        expect(account).toStrictEqual({
            address: '1111',
            data: new Uint8Array([102, 6, 221, 155, 82, 67]),
            executable: false,
            exists: true,
            lamports: 1_000_000_000n,
            programAddress: '9999',
            space: 6n,
        });
    });

    it('parses an empty account', () => {
        // Given an address with no matching RPC account.
        const address = '1111' as Address<'1111'>;

        // When we parse null for that address using the parseBase58RpcAccount function.
        const account = parseBase58RpcAccount(address, null);

        // Then we expect account to be a MaybeEncodedAccount.
        account satisfies MaybeEncodedAccount;

        // And we expect the following parsed data to be returned.
        expect(account).toStrictEqual({ address: '1111', exists: false });
    });

    it('freezes the returned encoded account', () => {
        // Given an address and an RPC account with base58 data.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <Base58RpcAccount>{
            data: ['somedata', 'base58'],
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 6n,
        };

        // When we parse that RPC account using the parseBase58RpcAccount function.
        const account = parseBase58RpcAccount(address, rpcAccount);

        // Then we expect the returned account to be frozen.
        expect(account).toBeFrozenObject();
    });

    it('freezes the returned empty account', () => {
        // Given an address with no matching RPC account.
        const address = '1111' as Address<'1111'>;

        // When we parse that address with a null RPC account.
        const account = parseBase58RpcAccount(address, null);

        // Then we expect the returned empty account to be frozen.
        expect(account).toBeFrozenObject();
    });
});

describe('parseJsonRpcAccount', () => {
    it('parses an json parsed account with custom data', () => {
        // Given an address and a json-parsed RPC account.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <JsonParsedRpcAccount>{
            data: {
                parsed: {
                    info: { mint: '2222' as Address<'2222'>, owner: '3333' as Address<'3333'> },
                    type: 'token',
                },
                program: 'splToken',
                space: 165n, // The space field is provided again on some JSON-parsed RPC response.
            },
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 165n,
        };

        // When we parse that RPC account using the parseJsonRpcAccount function and a custom data type.
        type MyData = { mint: Address; owner: Address };
        const account = parseJsonRpcAccount<MyData>(address, rpcAccount);

        // Then we expect account to be an Account with the custom data type.
        account satisfies Account<MyData>;

        // And we expect the following parsed encoded account to be returned.
        expect(account).toStrictEqual({
            address: '1111' as Address<'1111'>,
            data: {
                mint: '2222' as Address<'2222'>,
                owner: '3333' as Address<'3333'>,
                parsedAccountMeta: {
                    program: 'splToken',
                    type: 'token',
                },
            },
            executable: false,
            exists: true,
            lamports: lamports(1_000_000_000n),
            programAddress: '9999' as Address<'9999'>,
            space: 165n,
        } as Account<MyData>);
    });

    it('preserves array data and includes metadata when available', () => {
        // Given an address and a json-parsed RPC account with array data.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <JsonParsedRpcAccount>{
            data: {
                parsed: {
                    info: [
                        {
                            blockhash: '1111',
                            feeCalculator: { lamportsPerSignature: '1' },
                        },
                    ],
                    type: 'recentBlockhashes',
                },
                program: 'sysvar',
                space: 165n,
            },
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 165n,
        };

        // When we parse that RPC account using the parseJsonRpcAccount function.
        type MyData = { blockhash: string; feeCalculator: { lamportsPerSignature: string } }[];
        const account = parseJsonRpcAccount<MyData>(address, rpcAccount);

        // Then we expect the data to remain an array and include metadata.
        expect(Array.isArray(account.data)).toBe(true);
        expect(account.data).toMatchObject(
            expect.arrayContaining([
                {
                    blockhash: '1111',
                    feeCalculator: { lamportsPerSignature: '1' },
                },
            ]),
        );
        const dataWithMeta = account.data as unknown as {
            parsedAccountMeta?: { program: string; type?: string };
        };
        expect(dataWithMeta.parsedAccountMeta).toStrictEqual({
            program: 'sysvar',
            type: 'recentBlockhashes',
        });
    });

    it('parses metadata without a type when not provided', () => {
        // Given an address and a json-parsed RPC account without a parsed type.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <JsonParsedRpcAccount>{
            data: {
                parsed: {
                    info: { mint: '2222' as Address<'2222'> },
                },
                program: 'splToken',
                space: 165n,
            },
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 165n,
        };

        // When we parse that RPC account using the parseJsonRpcAccount function.
        type MyData = { mint: Address };
        const account = parseJsonRpcAccount<MyData>(address, rpcAccount);

        // Then we expect metadata to include only the program.
        expect(account).toMatchObject({
            data: {
                mint: '2222',
                parsedAccountMeta: {
                    program: 'splToken',
                },
            },
        });
    });

    it('does not include metadata when program and type are missing', () => {
        // Given an address and a json-parsed RPC account without metadata.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <JsonParsedRpcAccount>{
            data: {
                parsed: {
                    info: { mint: '2222' as Address<'2222'> },
                },
                program: undefined as unknown as string,
                space: 165n,
            },
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 165n,
        };

        // When we parse that RPC account using the parseJsonRpcAccount function.
        type MyData = { mint: Address };
        const account = parseJsonRpcAccount<MyData>(address, rpcAccount);

        // Then we expect parsedAccountMeta to be omitted.
        expect(account).toMatchObject({
            data: {
                mint: '2222',
            },
        });
        expect('parsedAccountMeta' in account.data).toBe(false);
    });

    it('includes metadata when only type is provided', () => {
        // Given an address and a json-parsed RPC account with only a type.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <JsonParsedRpcAccount>{
            data: {
                parsed: {
                    info: { mint: '2222' as Address<'2222'> },
                    type: 'token',
                },
                program: undefined as unknown as string,
                space: 165n,
            },
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 165n,
        };

        // When we parse that RPC account using the parseJsonRpcAccount function.
        type MyData = { mint: Address };
        const account = parseJsonRpcAccount<MyData>(address, rpcAccount);

        // Then we expect metadata to include only the type.
        expect(account).toMatchObject({
            data: {
                mint: '2222',
                parsedAccountMeta: {
                    type: 'token',
                },
            },
        });
    });

    it('uses metadata when info is null', () => {
        // Given an address and a json-parsed RPC account with null info.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <JsonParsedRpcAccount>{
            data: {
                parsed: {
                    info: null,
                    type: 'token',
                },
                program: 'splToken',
                space: 165n,
            },
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 165n,
        };

        // When we parse that RPC account using the parseJsonRpcAccount function.
        const account = parseJsonRpcAccount<object>(address, rpcAccount);

        // Then we expect the data to only include metadata.
        expect(account).toMatchObject({
            data: {
                parsedAccountMeta: {
                    program: 'splToken',
                    type: 'token',
                },
            },
        });
    });

    it('preserves array data when metadata is missing', () => {
        // Given an address and a json-parsed RPC account with array info and no metadata.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <JsonParsedRpcAccount>{
            data: {
                parsed: {
                    info: [
                        {
                            blockhash: '1111',
                            feeCalculator: { lamportsPerSignature: '1' },
                        },
                    ],
                },
                program: undefined as unknown as string,
                space: 165n,
            },
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 165n,
        };

        // When we parse that RPC account using the parseJsonRpcAccount function.
        type MyData = { blockhash: string; feeCalculator: { lamportsPerSignature: string } }[];
        const account = parseJsonRpcAccount<MyData>(address, rpcAccount);

        // Then we expect the data to remain an array without metadata.
        expect(Array.isArray(account.data)).toBe(true);
        expect(account.data).toMatchObject(
            expect.arrayContaining([
                {
                    blockhash: '1111',
                    feeCalculator: { lamportsPerSignature: '1' },
                },
            ]),
        );
        expect('parsedAccountMeta' in (account.data as unknown as object)).toBe(false);
    });

    it('parses an json parsed account without info', () => {
        // Given an address and a json-parsed RPC account without info.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <JsonParsedRpcAccount>{
            data: {
                parsed: {
                    type: 'token',
                },
                program: 'splToken',
                space: 165n,
            },
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 165n,
        };

        // When we parse that RPC account using the parseJsonRpcAccount function.
        const account = parseJsonRpcAccount<object>(address, rpcAccount);

        // Then we expect the metadata fields to be included.
        expect(account).toStrictEqual({
            address: '1111' as Address<'1111'>,
            data: {
                parsedAccountMeta: {
                    program: 'splToken',
                    type: 'token',
                },
            },
            executable: false,
            exists: true,
            lamports: lamports(1_000_000_000n),
            programAddress: '9999' as Address<'9999'>,
            space: 165n,
        });
    });

    it('parses an empty account', () => {
        // Given an address with no matching RPC account.
        const address = '1111' as Address<'1111'>;

        // When we parse null for that address using the parseJsonRpcAccount function.
        type MyData = { mint: Address; owner: Address };
        const account = parseJsonRpcAccount<MyData>(address, null);

        // Then we expect account to be a MaybeAccount.
        account satisfies MaybeAccount<MyData>;

        // And we expect the following parsed data to be returned.
        expect(account).toStrictEqual({ address: '1111', exists: false });
    });

    it('freezes the returned encoded account', () => {
        // Given an address and an RPC account with base64 data.
        const address = '1111' as Address<'1111'>;
        const rpcAccount = <JsonParsedRpcAccount>{
            data: {
                parsed: {
                    info: { mint: '2222' as Address<'2222'>, owner: '3333' as Address<'3333'> },
                    type: 'token',
                },
                program: 'splToken',
                space: 165n, // The space field is provided again on some JSON-parsed RPC response.
            },
            executable: false,
            lamports: 1_000_000_000n,
            owner: '9999',
            space: 165n,
        };

        // When we parse that RPC account using the parseJsonRpcAccount function.
        const account = parseJsonRpcAccount(address, rpcAccount);

        // Then we expect the returned account to be frozen.
        expect(account).toBeFrozenObject();
    });

    it('freezes the returned empty account', () => {
        // Given an address with no matching RPC account.
        const address = '1111' as Address<'1111'>;

        // When we parse that address with a null RPC account.
        const account = parseJsonRpcAccount(address, null);

        // Then we expect the returned empty account to be frozen.
        expect(account).toBeFrozenObject();
    });
});
