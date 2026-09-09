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
export type WritableAccount<TAddress extends string = string> = AccountMeta<TAddress> & {
    readonly role: AccountRole.WRITABLE;
};
/**
 * @see {@link AccountMeta}
 */
export type ReadonlySignerAccount<TAddress extends string = string> = AccountMeta<TAddress> & {
    readonly role: AccountRole.READONLY_SIGNER;
};
/**
 * @see {@link AccountMeta}
 */
export type WritableSignerAccount<TAddress extends string = string> = AccountMeta<TAddress> & {
    readonly role: AccountRole.WRITABLE_SIGNER;
};

/**
 * Represents an {@link AccountMeta} whose role is guaranteed not to be a signer role.
 *
 * This is the counterpart of the `AccountSignerMeta` type from `@solana/signers`, which
 * narrows the role to the two signer roles. Use this type when an account meta must only
 * describe the mutability of an account — e.g. when overriding the writable flag of a
 * non-signer account in a generated program client.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 * import { AccountNonSignerMeta, AccountRole } from '@solana/instructions';
 *
 * const meta: AccountNonSignerMeta = {
 *     address: address('mpngsFd4tmbUfzDYJayjKZwZcaR7aWb2793J6grLsGu'),
 *     role: AccountRole.READONLY,
 * };
 * ```
 *
 * @see {@link AccountMeta}
 */
export type AccountNonSignerMeta<TAddress extends string = string> =
    | ReadonlyAccount<TAddress>
    | WritableAccount<TAddress>;

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
