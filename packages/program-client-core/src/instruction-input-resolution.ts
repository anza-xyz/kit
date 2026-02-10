import { type Address, isProgramDerivedAddress, type ProgramDerivedAddress } from '@solana/addresses';
import {
    SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL,
    SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE,
    SolanaError,
} from '@solana/errors';
import { type AccountMeta, AccountRole, upgradeRoleToSigner } from '@solana/instructions';
import { type AccountSignerMeta, isTransactionSigner, type TransactionSigner } from '@solana/signers';

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
 * or a {@link TransactionSigner}. This function extracts the underlying address from
 * any of these types.
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
 * This function validates that the resolved account is a transaction signer and returns it.
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
    if (!isResolvedInstructionAccountSigner(value)) {
        throw new SolanaError(SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE, {
            expectedType: 'TransactionSigner',
            inputName,
        });
    }
    return value;
}

/**
 * Represents a resolved account input for an instruction.
 *
 * During instruction building, account inputs are resolved to this type which
 * captures both the account value and whether it should be marked as writable.
 * The value can be an {@link Address}, a {@link ProgramDerivedAddress}, a
 * {@link TransactionSigner}, or `null` for optional accounts.
 *
 * @typeParam TAddress - The address type, defaults to `string`.
 * @typeParam TValue - The type of the resolved value.
 *
 * @example
 * ```ts
 * const mintAccount: ResolvedInstructionAccount = {
 *   value: mintAddress,
 *   isWritable: true,
 * };
 * ```
 */
export type ResolvedInstructionAccount<
    TAddress extends string = string,
    TValue extends Address<TAddress> | ProgramDerivedAddress<TAddress> | TransactionSigner<TAddress> | null =
        | Address<TAddress>
        | ProgramDerivedAddress<TAddress>
        | TransactionSigner<TAddress>
        | null,
> = {
    isWritable: boolean;
    value: TValue;
};

/**
 * Creates a factory function that converts resolved instruction accounts to account metas.
 *
 * The factory handles the conversion of {@link ResolvedInstructionAccount} objects into
 * {@link AccountMeta} or {@link AccountSignerMeta} objects suitable for building instructions.
 * It also determines how to handle optional accounts based on the provided strategy.
 *
 * @param programAddress - The program address, used when optional accounts use the `programId` strategy.
 * @param optionalAccountStrategy - How to handle null account values:
 *   - `'omitted'`: Optional accounts are excluded from the instruction entirely.
 *   - `'programId'`: Optional accounts are replaced with the program address as a read-only account.
 * @returns A factory function that converts a resolved account to an account meta.
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

        const writableRole = account.isWritable ? AccountRole.WRITABLE : AccountRole.READONLY;
        const isSigner = isResolvedInstructionAccountSigner(account.value);
        return Object.freeze({
            address: getAddressFromResolvedInstructionAccount(inputName, account.value),
            role: isSigner ? upgradeRoleToSigner(writableRole) : writableRole,
            ...(isSigner ? { signer: account.value } : {}),
        });
    };
}

function isResolvedInstructionAccountSigner(value: unknown): value is TransactionSigner {
    return (
        !!value &&
        typeof value === 'object' &&
        'address' in value &&
        typeof value.address === 'string' &&
        isTransactionSigner(value as { address: Address })
    );
}
