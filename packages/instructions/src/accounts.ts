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
 * | `ReadonlyAccount<TAddress>`       | `AccountRole.READONLY`        |  No        |  No          |
 * | `WritableAccount<TAddress>`       | `AccountRole.WRITABLE`        |  No        |  Yes         |
 * | `ReadonlySignerAccount<TAddress>` | `AccountRole.READONLY_SIGNER` |  Yes       |  No          |
 * | `WritableSignerAccount<TAddress>` | `AccountRole.WRITABLE_SIGNER` |  Yes       |  Yes         |
 *
 * @example A type for the Rent sysvar account
 * ```ts
 * type RentSysvar = ReadonlyAccount<'SysvarRent111111111111111111111111111111111'>;
 * ```
 */
export interface AccountMeta<TAddress extends string = string> {
    readonly address: Address<TAddress>;
    readonly role: AccountRole;
}

/**
 * @see {@link AccountMeta}
 */
export type ReadonlyAccount<TAddress extends string = string> = AccountMeta<TAddress> & {
    readonly role: AccountRole.READONLY;
};
/**
 * @see {@link AccountMeta}
 */
export type WritableAccount<TAddress extends string = string> = AccountMeta<TAddress> & { role: AccountRole.WRITABLE };
/**
 * @see {@link AccountMeta}
 */
export type ReadonlySignerAccount<TAddress extends string = string> = AccountMeta<TAddress> & {
    role: AccountRole.READONLY_SIGNER;
};
/**
 * @see {@link AccountMeta}
 */
export type WritableSignerAccount<TAddress extends string = string> = AccountMeta<TAddress> & {
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
 * | `ReadonlyLookupAccount<TAddress, TLookupTableAddress>` | `AccountRole.READONLY` |  No        |  No          |
 * | `WritableLookupAccount<TAddress, TLookupTableAddress>` | `AccountRole.WRITABLE` |  No        |  Yes         |
 *
 * @example A type for the Rent sysvar account that you looked up in a lookup table
 * ```ts
 * type RentSysvar = ReadonlyLookupAccount<
 *     'SysvarRent111111111111111111111111111111111',
 *     'MyLookupTable111111111111111111111111111111'
 * >;
 * ```
 */
export interface AccountLookupMeta<TAddress extends string = string, TLookupTableAddress extends string = string> {
    readonly address: Address<TAddress>;
    readonly addressIndex: number;
    readonly lookupTableAddress: Address<TLookupTableAddress>;
    readonly role: AccountRole.READONLY | AccountRole.WRITABLE;
}

/**
 * @see {@link AccountLookupMeta}
 */
export type ReadonlyAccountLookup<
    TAddress extends string = string,
    TLookupTableAddress extends string = string,
> = AccountLookupMeta<TAddress, TLookupTableAddress> & { readonly role: AccountRole.READONLY };
/**
 * @see {@link AccountLookupMeta}
 */
export type WritableAccountLookup<
    TAddress extends string = string,
    TLookupTableAddress extends string = string,
> = AccountLookupMeta<TAddress, TLookupTableAddress> & { readonly role: AccountRole.WRITABLE };
