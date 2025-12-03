import type { Address } from '@solana/addresses';
import { getBase58Encoder, getBase64Encoder } from '@solana/codecs-strings';
import type {
    AccountInfoBase,
    AccountInfoWithBase58Bytes,
    AccountInfoWithBase58EncodedData,
    AccountInfoWithBase64EncodedData,
} from '@solana/rpc-types';

import type { Account, BaseAccount, EncodedAccount } from './account';
import type { MaybeAccount, MaybeEncodedAccount } from './maybe-account';
import type { JsonParsedDataResponse } from './rpc-api';

type Base64EncodedRpcAccount = AccountInfoBase & AccountInfoWithBase64EncodedData;

/**
 * Parses a base64-encoded account provided by the RPC client into an {@link EncodedAccount} type or
 * a {@link MaybeEncodedAccount} type if the raw data can be set to `null`.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 *
 * @example
 * ```ts
 * const myAddress = address('1234..5678');
 * const myRpcAccount = await rpc.getAccountInfo(myAddress, { encoding: 'base64' }).send();
 * const myAccount: MaybeEncodedAccount<'1234..5678'> = parseBase64RpcAccount(myRpcAccount);
 * ```
 */
export function parseBase64RpcAccount<TAddress extends string = string>(
    address: Address<TAddress>,
    rpcAccount: Base64EncodedRpcAccount,
): EncodedAccount<TAddress>;
export function parseBase64RpcAccount<TAddress extends string = string>(
    address: Address<TAddress>,
    rpcAccount: Base64EncodedRpcAccount | null,
): MaybeEncodedAccount<TAddress>;
export function parseBase64RpcAccount<TAddress extends string = string>(
    address: Address<TAddress>,
    rpcAccount: Base64EncodedRpcAccount | null,
): EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress> {
    if (!rpcAccount) return Object.freeze({ address, exists: false });
    const data = getBase64Encoder().encode(rpcAccount.data[0]);
    return Object.freeze({ ...parseBaseAccount(rpcAccount), address, data, exists: true });
}

type Base58EncodedRpcAccount = AccountInfoBase & (AccountInfoWithBase58Bytes | AccountInfoWithBase58EncodedData);

/**
 * Parses a base58-encoded account provided by the RPC client into an {@link EncodedAccount} type or
 * a {@link MaybeEncodedAccount} type if the raw data can be set to `null`.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 *
 * @example
 * ```ts
 * const myAddress = address('1234..5678');
 * const myRpcAccount = await rpc.getAccountInfo(myAddress, { encoding: 'base58' }).send();
 * const myAccount: MaybeEncodedAccount<'1234..5678'> = parseBase58RpcAccount(myRpcAccount);
 * ```
 */
export function parseBase58RpcAccount<TAddress extends string = string>(
    address: Address<TAddress>,
    rpcAccount: Base58EncodedRpcAccount,
): EncodedAccount<TAddress>;
export function parseBase58RpcAccount<TAddress extends string = string>(
    address: Address<TAddress>,
    rpcAccount: Base58EncodedRpcAccount | null,
): MaybeEncodedAccount<TAddress>;
export function parseBase58RpcAccount<TAddress extends string = string>(
    address: Address<TAddress>,
    rpcAccount: Base58EncodedRpcAccount | null,
): EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress> {
    if (!rpcAccount) return Object.freeze({ address, exists: false });
    const data = getBase58Encoder().encode(typeof rpcAccount.data === 'string' ? rpcAccount.data : rpcAccount.data[0]);
    return Object.freeze({ ...parseBaseAccount(rpcAccount), address, data, exists: true });
}

type JsonParsedRpcAccount = AccountInfoBase & { readonly data: JsonParsedDataResponse<unknown> };

/**
 * Parses an arbitrary `jsonParsed` account provided by the RPC client into an {@link Account} type
 * or a {@link MaybeAccount} type if the raw data can be set to `null`.
 *
 * The expected data type should be explicitly provided as the first type parameter.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TData - The expected type of this account's data.
 *
 * @example
 * ```ts
 * const myAccount: Account<MyData> = parseJsonRpcAccount<MyData>(myJsonRpcAccount);
 * ```
 */
export function parseJsonRpcAccount<TData extends object, TAddress extends string = string>(
    address: Address<TAddress>,
    rpcAccount: JsonParsedRpcAccount,
): Account<TData, TAddress>;
export function parseJsonRpcAccount<TData extends object, TAddress extends string = string>(
    address: Address<TAddress>,
    rpcAccount: JsonParsedRpcAccount | null,
): MaybeAccount<TData, TAddress>;
export function parseJsonRpcAccount<TData extends object, TAddress extends string = string>(
    address: Address<TAddress>,
    rpcAccount: JsonParsedRpcAccount | null,
): Account<TData, TAddress> | MaybeAccount<TData, TAddress> {
    if (!rpcAccount) return Object.freeze({ address, exists: false });
    const data = rpcAccount.data.parsed.info as TData;
    return Object.freeze({ ...parseBaseAccount(rpcAccount), address, data, exists: true });
}

function parseBaseAccount(rpcAccount: AccountInfoBase): BaseAccount {
    return Object.freeze({
        executable: rpcAccount.executable,
        lamports: rpcAccount.lamports,
        programAddress: rpcAccount.owner,
        space: rpcAccount.space,
    });
}
