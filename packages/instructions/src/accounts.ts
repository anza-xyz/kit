import { Address } from '@solana/addresses';

import { AccountRole } from './roles';

/**
 * Represents an account's address and metadata about its mutability and whether it must be a signer
 * of the transaction.
 *
 * Typically, you will use one of its subtypes.
 *
 * |                                   | `role`                        | `isSigner` | `isWritable` |
 * | --------------------------------- | ----------------------------- | ---------- | ------------ |
 * | `ReadonlyAccount<TAddress>`       | `AccountRole.READONLY`        | &#x274c;   | &#x274c;     |
 * | `WritableAccount<TAddress>`       | `AccountRole.WRITABLE`        | &#x274c;   | &#x2705;     |
 * | `ReadonlySignerAccount<TAddress>` | `AccountRole.READONLY_SIGNER` | &#x2705;   | &#x274c;     |
 * | `WritableSignerAccount<TAddress>` | `AccountRole.WRITABLE_SIGNER` | &#x2705;   | &#x2705;     |
 *
 * @example A type for the Rent sysvar account
 * ```ts
 * type RentSysvar = ReadonlyAccount<'SysvarRent111111111111111111111111111111111'>;
 * ```
 */
export interface IAccountMeta<TAddress extends string = string> {
    readonly address: Address<TAddress>;
    readonly role: AccountRole;
}

/**
 * @see {@link IAccountMeta}
 */
export type ReadonlyAccount<TAddress extends string = string> = IAccountMeta<TAddress> & {
    readonly role: AccountRole.READONLY;
};
/**
 * @see {@link IAccountMeta}
 */
export type WritableAccount<TAddress extends string = string> = IAccountMeta<TAddress> & { role: AccountRole.WRITABLE };
/**
 * @see {@link IAccountMeta}
 */
export type ReadonlySignerAccount<TAddress extends string = string> = IAccountMeta<TAddress> & {
    role: AccountRole.READONLY_SIGNER;
};
/**
 * @see {@link IAccountMeta}
 */
export type WritableSignerAccount<TAddress extends string = string> = IAccountMeta<TAddress> & {
    role: AccountRole.WRITABLE_SIGNER;
};

/**
 * Represents a lookup of the account's address in an address lookup table. It specifies which
 * lookup table account in which to perform the lookup, the index of the desired account address in
 * that table, and metadata about its mutability. Notably, account addresses obtained via lookups
 * may not act as signers.
 *
 * Typically, you will use one of its subtypes.
 *
 * |                                                        | `role`                 | `isSigner` | `isWritable` |
 * | ------------------------------------------------------ | ---------------------- | ---------- | ------------ |
 * | `ReadonlyLookupAccount<TAddress, TLookupTableAddress>` | `AccountRole.READONLY` | &#x274c;   | &#x274c;     |
 * | `WritableLookupAccount<TAddress, TLookupTableAddress>` | `AccountRole.WRITABLE` | &#x274c;   | &#x2705;     |
 *
 * @example A type for the Rent sysvar account that you looked up in a lookup table
 * ```ts
 * type RentSysvar = ReadonlyLookupAccount<
 *     'SysvarRent111111111111111111111111111111111',
 *     'MyLookupTable111111111111111111111111111111'
 * >;
 * ```
 */
export interface IAccountLookupMeta<TAddress extends string = string, TLookupTableAddress extends string = string> {
    readonly address: Address<TAddress>;
    readonly addressIndex: number;
    readonly lookupTableAddress: Address<TLookupTableAddress>;
    readonly role: AccountRole.READONLY | AccountRole.WRITABLE;
}

/**
 * @see {@link IAccountLookupMeta}
 */
export type ReadonlyAccountLookup<
    TAddress extends string = string,
    TLookupTableAddress extends string = string,
> = IAccountLookupMeta<TAddress, TLookupTableAddress> & { readonly role: AccountRole.READONLY };
/**
 * @see {@link IAccountLookupMeta}
 */
export type WritableAccountLookup<
    TAddress extends string = string,
    TLookupTableAddress extends string = string,
> = IAccountLookupMeta<TAddress, TLookupTableAddress> & { readonly role: AccountRole.WRITABLE };
