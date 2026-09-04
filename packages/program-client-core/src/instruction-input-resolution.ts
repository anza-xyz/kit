import { type Address, type HasAddress, isProgramDerivedAddress, type ProgramDerivedAddress } from '@solana/addresses';
import {
    SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL,
    SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_SIGNER,
    SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE,
    SolanaError,
} from '@solana/errors';
import { type AccountMeta, type AccountNonSignerMeta, AccountRole, upgradeRoleToSigner } from '@solana/instructions';
import { type AccountSignerMeta, isTransactionSigner, type TransactionSigner } from '@solana/signers';

/**
 * Represents the accepted input values for a non-signer instruction account.
 *
 * Namely, one of the following:
 * - An {@link Address} — the most common case.
 * - Any object exposing an `address` property (see {@link HasAddress}) — e.g. a framework's
 *   address wrapper class. Note that {@link TransactionSigner | TransactionSigners} satisfy this
 *   shape too, in which case they act as plain address carriers for non-signer accounts.
 * - A {@link ProgramDerivedAddress} — i.e. an `[address, bump]` tuple.
 * - An {@link AccountNonSignerMeta} — i.e. `{ address, role }` — to explicitly override the
 *   role derived from the program's IDL, e.g. to mark an account as writable or readonly.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 *
 * @see {@link InstructionSignerInput}
 */
export type InstructionAccountInput<TAddress extends string = string> =
    | AccountNonSignerMeta<TAddress>
    | Address<TAddress>
    | HasAddress<TAddress>
    | ProgramDerivedAddress<TAddress>;

/**
 * Represents the accepted input values for a signer instruction account.
 *
 * Namely, one of the following:
 * - A {@link TransactionSigner} — the most common case.
 * - An {@link AccountSignerMeta} — i.e. `{ address, role, signer }` — to explicitly override the
 *   role derived from the program's IDL, e.g. to mark a signer account as writable or readonly.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 *
 * @see {@link InstructionAccountInput}
 */
export type InstructionSignerInput<TAddress extends string = string> =
    | AccountSignerMeta<TAddress>
    | TransactionSigner<TAddress>;

/**
 * Ensures a resolved instruction input is not null or undefined.
 *
 * This function is used during instruction resolution to validate that
 * required inputs have been properly resolved to a non-null value.
 *
 * @typeParam T - The expected type of the resolved input value.
 *
 * @param inputName - The name of the instruction input, used in error messages.
 * @param value - The resolved value to validate.
 * @returns The validated non-null value.
 *
 * @throws Throws a {@link SolanaError} if the value is null or undefined.
 *
 * @example
 * ```ts
 * const resolvedAuthority = getNonNullResolvedInstructionInput(
 *   'authority',
 *   maybeAuthority
 * );
 * // resolvedAuthority is guaranteed to be non-null here.
 * ```
 */
export function getNonNullResolvedInstructionInput<T>(inputName: string, value: T | null | undefined): T {
    if (value === null || value === undefined) {
        throw new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL, {
            inputName,
        });
    }
    return value;
}

/**
 * Extracts the address from a resolved instruction account.
 *
 * A resolved instruction account can be an {@link Address}, a {@link ProgramDerivedAddress},
 * or any object exposing an `address` property — such as a {@link TransactionSigner}, an
 * account meta, or a framework's address wrapper class (see {@link HasAddress}). This
 * function extracts the underlying address from any of these types.
 *
 * @typeParam T - The address type, defaults to `string`.
 *
 * @param inputName - The name of the instruction input, used in error messages.
 * @param value - The resolved account value to extract the address from.
 * @returns The extracted address.
 *
 * @throws Throws a {@link SolanaError} if the value is null or undefined.
 *
 * @example
 * ```ts
 * const address = getAddressFromResolvedInstructionAccount('mint', resolvedMint);
 * ```
 */
export function getAddressFromResolvedInstructionAccount<T extends string = string>(
    inputName: string,
    value: ResolvedInstructionAccount<T>['value'] | undefined,
): Address<T> {
    const nonNullValue = getNonNullResolvedInstructionInput(inputName, value);
    if (typeof value === 'object' && 'address' in nonNullValue) {
        return nonNullValue.address;
    }
    if (Array.isArray(nonNullValue)) {
        return nonNullValue[0] as Address<T>;
    }
    return nonNullValue as Address<T>;
}

/**
 * Extracts a {@link ProgramDerivedAddress} from a resolved instruction account.
 *
 * This function validates that the resolved account is a PDA and returns it.
 * Use this when you need access to both the address and the bump seed of a PDA.
 *
 * @typeParam T - The address type, defaults to `string`.
 *
 * @param inputName - The name of the instruction input, used in error messages.
 * @param value - The resolved account value expected to be a PDA.
 * @returns The program-derived address.
 *
 * @throws Throws a {@link SolanaError} if the value is not a {@link ProgramDerivedAddress}.
 *
 * @example
 * ```ts
 * const pda = getResolvedInstructionAccountAsProgramDerivedAddress('metadata', resolvedMetadata);
 * const [address, bump] = pda;
 * ```
 */
export function getResolvedInstructionAccountAsProgramDerivedAddress<T extends string = string>(
    inputName: string,
    value: ResolvedInstructionAccount<T>['value'] | undefined,
): ProgramDerivedAddress<T> {
    if (!isProgramDerivedAddress(value)) {
        throw new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
            expectedType: 'ProgramDerivedAddress',
            inputName,
        });
    }
    return value;
}

/**
 * Extracts a {@link TransactionSigner} from a resolved instruction account.
 *
 * This function validates that the resolved account is a transaction signer — or an
 * {@link AccountSignerMeta} carrying one — and returns the signer.
 * Use this when you need the resolved account to be a signer.
 *
 * @typeParam T - The address type, defaults to `string`.
 *
 * @param inputName - The name of the instruction input, used in error messages.
 * @param value - The resolved account value expected to be a signer.
 * @returns The transaction signer.
 *
 * @throws Throws a {@link SolanaError} if the value is not a {@link TransactionSigner}.
 *
 * @example
 * ```ts
 * const signer = getResolvedInstructionAccountAsTransactionSigner('authority', resolvedAuthority);
 * ```
 */
export function getResolvedInstructionAccountAsTransactionSigner<T extends string = string>(
    inputName: string,
    value: ResolvedInstructionAccount<T>['value'] | undefined,
): TransactionSigner<T> {
    const signer = value && hasExplicitRole(value) && 'signer' in value ? value.signer : value;
    if (!isResolvedInstructionAccountSigner<T>(signer)) {
        throw new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
            expectedType: 'TransactionSigner',
            inputName,
        });
    }
    return signer;
}

/**
 * Represents a resolved account input for an instruction.
 *
 * During instruction building, account inputs are resolved to this type which captures
 * the account value alongside the signer and writable flags declared by the program's IDL.
 * The value can be any {@link InstructionAccountInput}, any {@link InstructionSignerInput},
 * or `null` for optional accounts.
 *
 * The optional `isSigner` flag describes whether the IDL requires the account to sign the
 * transaction — with `'either'` meaning the account may or may not be a signer, in which
 * case providing a {@link TransactionSigner} value is what marks it as one. Omitting the
 * flag — e.g. in program clients generated before its introduction — is equivalent to
 * setting it to `'either'`.
 *
 * @typeParam TAddress - The address type, defaults to `string`.
 * @typeParam TValue - The type of the resolved value.
 *
 * @example
 * ```ts
 * const mintAccount: ResolvedInstructionAccount = {
 *   value: mintAddress,
 *   isSigner: false,
 *   isWritable: true,
 * };
 * ```
 */
export type ResolvedInstructionAccount<
    TAddress extends string = string,
    TValue extends InstructionAccountInput<TAddress> | InstructionSignerInput<TAddress> | null =
        | InstructionAccountInput<TAddress>
        | InstructionSignerInput<TAddress>
        | null,
> = {
    isSigner?: boolean | 'either';
    isWritable: boolean;
    value: TValue;
};

/**
 * Extracts the address type parameter from an instruction account input.
 *
 * Given any {@link InstructionAccountInput} or {@link InstructionSignerInput} — e.g. an
 * {@link Address}, an address-bearing object (see {@link HasAddress}), a
 * {@link ProgramDerivedAddress} or an account meta — this type helper resolves to the
 * branded address string it carries. This allows generated program clients to recover the
 * address type parameter of an account from the caller's input type alone — e.g. via
 * `InstructionAccountInputAddress<TInput['authority']>` — instead of declaring a dedicated
 * address type parameter on the instruction builder.
 *
 * When given a union of inputs, the helper distributes over it, so a union whose members
 * all share the same address brand resolves to that brand. Inputs carrying no brand
 * resolve to `string`.
 *
 * @typeParam TInput - The type of the input provided by the caller for this account.
 *
 * @example
 * ```ts
 * type A = InstructionAccountInputAddress<Address<'1234'>>; // '1234'
 * type B = InstructionAccountInputAddress<TransactionSigner<'1234'>>; // '1234'
 * type C = InstructionAccountInputAddress<ProgramDerivedAddress<'1234'>>; // '1234'
 * type D = InstructionAccountInputAddress<Address>; // string
 * ```
 *
 * @see {@link ResolvedInstructionAccountMeta}
 */
export type InstructionAccountInputAddress<TInput> =
    TInput extends HasAddress<infer TAddress>
        ? TAddress
        : TInput extends ProgramDerivedAddress<infer TAddress>
          ? TAddress
          : TInput extends Address<infer TAddress>
            ? TAddress
            : string;

/**
 * Computes the account meta type produced by an instruction account, based on the input
 * provided by the caller.
 *
 * This type helper mirrors the runtime logic of {@link getAccountMetaFactory} so that
 * generated program clients can accurately type the accounts of the instructions they
 * return. Namely:
 * - When the input carries an explicit `role` — i.e. it is an {@link AccountNonSignerMeta} or an
 *   {@link AccountSignerMeta} — the meta type preserves the input's role type: an inline
 *   `role: AccountRole.READONLY` override resolves to `ReadonlyAccount`, while a role only
 *   known at runtime widens to {@link AccountMeta}. If the input also carries a `signer`,
 *   {@link AccountSignerMeta} is used so the attached signer is reflected in the type.
 * - When the input is a {@link TransactionSigner}, the meta type is `TSignerMeta` — e.g.
 *   `ReadonlySignerAccount<TAddress> & AccountSignerMeta<TAddress>` for accounts the IDL
 *   declares as signers. For non-signer accounts, `TSignerMeta` should be left to its
 *   default of `TAddress` so that signers merely act as address carriers.
 * - Otherwise, the helper resolves to `TAddress` — the branded address string that generated
 *   instruction types map to the account meta declared by the program's IDL.
 *
 * Note that the checks are wrapped in tuples (`[TInput] extends [...]`) to prevent unions
 * from distributing. If `TInput` is not narrowed to the caller's specific input type — e.g.
 * when a declared input union is provided instead — the helper deterministically falls back
 * to `TAddress`, matching the account meta declared by the program's IDL.
 *
 * @typeParam TInput - The type of the input provided by the caller for this account.
 * @typeParam TAddress - The address type parameter of the account.
 * @typeParam TSignerMeta - The meta type produced when a {@link TransactionSigner} is
 * provided. Defaults to `TAddress`, which treats signers as plain address carriers.
 *
 * @example
 * The instruction builder below captures the caller's input in a single `TInput` type
 * parameter and recovers each account's address type parameter from it using
 * {@link InstructionAccountInputAddress}.
 * ```ts
 * declare function getTransferInstruction<TInput extends TransferInput>(
 *     input: TInput,
 * ): TransferInstruction<
 *     ResolvedInstructionAccountMeta<
 *         TInput['authority'],
 *         InstructionAccountInputAddress<TInput['authority']>,
 *         ReadonlySignerAccount<InstructionAccountInputAddress<TInput['authority']>> &
 *             AccountSignerMeta<InstructionAccountInputAddress<TInput['authority']>>
 *     >
 * >;
 * ```
 *
 * Alternatively, instruction builders may keep a dedicated address type parameter per
 * account. In that case, the parameter below must intersect the concrete input type with
 * the inferred `TInput` type parameter (`TransferInput<TAccountAuthority> & TInput`) —
 * referencing the address type parameters only in `TInput`'s constraint makes their
 * inference fall back to `string`. Defaulting `TInput` to the concrete input type keeps
 * call sites with explicit type arguments working.
 * ```ts
 * declare function getTransferInstruction<
 *     TAccountAuthority extends string,
 *     TInput extends TransferInput<TAccountAuthority> = TransferInput<TAccountAuthority>,
 * >(
 *     input: TransferInput<TAccountAuthority> & TInput,
 * ): TransferInstruction<
 *     ResolvedInstructionAccountMeta<
 *         TInput['authority'],
 *         TAccountAuthority,
 *         ReadonlySignerAccount<TAccountAuthority> & AccountSignerMeta<TAccountAuthority>
 *     >
 * >;
 * ```
 *
 * @see {@link getAccountMetaFactory}
 * @see {@link InstructionAccountInputAddress}
 */
export type ResolvedInstructionAccountMeta<TInput, TAddress extends string, TSignerMeta = TAddress> = [TInput] extends [
    { role: infer TRole extends AccountRole },
]
    ? ([TInput] extends [{ signer: TransactionSigner<TAddress> }]
          ? AccountSignerMeta<TAddress>
          : AccountMeta<TAddress>) & { readonly role: TRole }
    : [TInput] extends [TransactionSigner<TAddress>]
      ? TSignerMeta
      : TAddress;

/**
 * Creates a factory function that converts resolved instruction accounts to account metas.
 *
 * The factory handles the conversion of {@link ResolvedInstructionAccount} objects into
 * {@link AccountMeta} or {@link AccountSignerMeta} objects suitable for building instructions.
 * It also determines how to handle optional accounts based on the provided strategy.
 *
 * The role of the resulting account meta is determined as follows, in order of precedence:
 * 1. If the value carries an explicit `role` — i.e. it is an {@link AccountNonSignerMeta} or
 *    an {@link AccountSignerMeta} — that role is used as-is, regardless of the flags declared
 *    by the program's IDL.
 * 2. Otherwise, if the value is a {@link TransactionSigner} and the account's `isSigner` flag
 *    is not `false`, the IDL's writable flag is upgraded to the corresponding signer role and
 *    the signer is attached to the meta. When `isSigner` is `false`, the signer merely acts
 *    as an address carrier and no upgrade occurs. Omitting the flag is equivalent to `'either'`.
 * 3. Otherwise, the IDL's writable flag decides between the readonly and writable roles.
 *
 * @param programAddress - The program address, used when optional accounts use the `programId` strategy.
 * @param optionalAccountStrategy - How to handle null account values:
 *   - `'omitted'`: Optional accounts are excluded from the instruction entirely.
 *   - `'programId'`: Optional accounts are replaced with the program address as a read-only account.
 * @returns A factory function that converts a resolved account to an account meta.
 *
 * @throws Throws a {@link SolanaError} when the account's `isSigner` flag is `true` but the
 * provided value is neither a {@link TransactionSigner} nor carries an explicit `role`. Use
 * `createNoopSigner()` from `@solana/signers` if the account's signature is provided by other means.
 *
 * @example
 * ```ts
 * const toAccountMeta = getAccountMetaFactory(programAddress, 'programId');
 * const mintMeta = toAccountMeta('mint', resolvedMint);
 * ```
 */
export function getAccountMetaFactory(programAddress: Address, optionalAccountStrategy: 'omitted' | 'programId') {
    return (inputName: string, account: ResolvedInstructionAccount): AccountMeta | AccountSignerMeta | undefined => {
        if (!account.value) {
            if (optionalAccountStrategy === 'omitted') return;
            return Object.freeze({ address: programAddress, role: AccountRole.READONLY });
        }

        // Explicit roles always take precedence over the flags declared by the program's IDL.
        if (hasExplicitRole(account.value)) {
            return Object.freeze({
                address: account.value.address,
                role: account.value.role,
                ...('signer' in account.value && account.value.signer ? { signer: account.value.signer } : {}),
            });
        }

        // Only mark implicit values as signers when the IDL declares
        // the account as a signer or lets the input decide (`'either'`).
        const idlIsSigner = account.isSigner ?? 'either';
        const isSigner = idlIsSigner !== false && isResolvedInstructionAccountSigner(account.value);
        if (!isSigner && idlIsSigner === true) {
            throw new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_SIGNER, {
                inputName,
            });
        }

        const writableRole = account.isWritable ? AccountRole.WRITABLE : AccountRole.READONLY;
        return Object.freeze({
            address: getAddressFromResolvedInstructionAccount(inputName, account.value),
            role: isSigner ? upgradeRoleToSigner(writableRole) : writableRole,
            ...(isSigner ? { signer: account.value } : {}),
        });
    };
}

/**
 * Checks whether a resolved instruction account value carries an explicit account role,
 * i.e. whether it is an {@link AccountNonSignerMeta} or an {@link AccountSignerMeta}.
 *
 * Since {@link AccountRole} is a numeric enum, requiring `role` to be a number prevents
 * unrelated `role` properties on address-bearing objects from being mistaken for a role
 * override.
 */
function hasExplicitRole(
    value: NonNullable<ResolvedInstructionAccount['value']>,
): value is AccountNonSignerMeta | AccountSignerMeta {
    return typeof value === 'object' && 'role' in value && typeof value.role === 'number';
}

function isResolvedInstructionAccountSigner<TAddress extends string = string>(
    value: unknown,
): value is TransactionSigner<TAddress> {
    return (
        !!value &&
        typeof value === 'object' &&
        'address' in value &&
        typeof value.address === 'string' &&
        isTransactionSigner(value as { address: Address })
    );
}
