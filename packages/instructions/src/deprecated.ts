import type { ReadonlyUint8Array } from '@solana/codecs-core';

import type { AccountLookupMeta, AccountMeta } from './accounts';
import type { Instruction, InstructionWithAccounts, InstructionWithData } from './instruction';

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
 * @deprecated Use {@link AccountMeta} instead. It was only renamed.
 *
 * @example A type for the Rent sysvar account
 * ```ts
 * type RentSysvar = ReadonlyAccount<'SysvarRent111111111111111111111111111111111'>;
 * ```
 */
export type IAccountMeta<TAddress extends string = string> = AccountMeta<TAddress>;

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
 * @deprecated Use {@link AccountLookupMeta} instead. It was only renamed.
 *
 * @example A type for the Rent sysvar account that you looked up in a lookup table
 * ```ts
 * type RentSysvar = ReadonlyLookupAccount<
 *     'SysvarRent111111111111111111111111111111111',
 *     'MyLookupTable111111111111111111111111111111'
 * >;
 * ```
 */
export type IAccountLookupMeta<
    TAddress extends string = string,
    TLookupTableAddress extends string = string,
> = AccountLookupMeta<TAddress, TLookupTableAddress>;

/**
 * An instruction destined for a given program.
 *
 * @deprecated Use {@link Instruction} instead. It was only renamed.
 *
 * @example
 * ```ts
 * type StakeProgramInstruction = IInstruction<'StakeConfig11111111111111111111111111111111'>;
 * ```
 */
export type IInstruction<
    TProgramAddress extends string = string,
    TAccounts extends readonly (AccountLookupMeta | AccountMeta)[] = readonly (AccountLookupMeta | AccountMeta)[],
> = Instruction<TProgramAddress, TAccounts>;

/**
 * An instruction that loads certain accounts.
 *
 * @deprecated Use {@link InstructionWithAccounts} instead. It was only renamed.
 *
 * @example
 * ```ts
 * type InstructionWithTwoAccounts = IInstructionWithAccounts<
 *     [
 *         WritableAccount, // First account
 *         RentSysvar, // Second account
 *     ]
 * >;
 * ```
 */
export type IInstructionWithAccounts<TAccounts extends readonly (AccountLookupMeta | AccountMeta)[]> =
    InstructionWithAccounts<TAccounts>;

/**
 * An instruction whose data conforms to a certain type.
 *
 * This is most useful when you have a branded `Uint8Array` that represents a particular
 * instruction's data.
 *
 * @deprecated Use {@link InstructionWithData} instead. It was only renamed.
 *
 * @example A type for the \`AdvanceNonce\` instruction of the System program
 * ```ts
 * type AdvanceNonceAccountInstruction<
 *     TNonceAccountAddress extends string = string,
 *     TNonceAuthorityAddress extends string = string,
 * > = Instruction<'11111111111111111111111111111111'> &
 *     InstructionWithAccounts<
 *         [
 *             WritableAccount<TNonceAccountAddress>,
 *             ReadonlyAccount<'SysvarRecentB1ockHashes11111111111111111111'>,
 *             ReadonlySignerAccount<TNonceAuthorityAddress>,
 *         ]
 *     > &
 *     IInstructionWithData<AdvanceNonceAccountInstructionData>;
 * ```
 */
export type IInstructionWithData<TData extends ReadonlyUint8Array> = InstructionWithData<TData>;
