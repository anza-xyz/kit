import { Address } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import {
    SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_ACCOUNTS,
    SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_DATA,
    SOLANA_ERROR__INSTRUCTION__PROGRAM_ID_MISMATCH,
    SolanaError,
} from '@solana/errors';

import { IAccountLookupMeta, IAccountMeta } from './accounts';

/**
 * An instruction destined for a given program.
 *
 * @example
 * ```ts
 * type StakeProgramInstruction = IInstruction<'StakeConfig11111111111111111111111111111111'>;
 * ```
 */
export interface IInstruction<
    TProgramAddress extends string = string,
    TAccounts extends readonly (IAccountLookupMeta | IAccountMeta)[] = readonly (IAccountLookupMeta | IAccountMeta)[],
> {
    readonly accounts?: TAccounts;
    readonly data?: ReadonlyUint8Array;
    readonly programAddress: Address<TProgramAddress>;
}

/**
 * An instruction that loads certain accounts.
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
export interface IInstructionWithAccounts<TAccounts extends readonly (IAccountLookupMeta | IAccountMeta)[]>
    extends IInstruction {
    readonly accounts: TAccounts;
}

export function isInstructionForProgram<TProgramAddress extends string, TInstruction extends IInstruction>(
    instruction: TInstruction,
    programAddress: Address<TProgramAddress>,
): instruction is TInstruction & { programAddress: Address<TProgramAddress> } {
    return instruction.programAddress === programAddress;
}

export function assertIsInstructionForProgram<TProgramAddress extends string, TInstruction extends IInstruction>(
    instruction: TInstruction,
    programAddress: Address<TProgramAddress>,
): asserts instruction is TInstruction & { programAddress: Address<TProgramAddress> } {
    if (instruction.programAddress !== programAddress) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION__PROGRAM_ID_MISMATCH, {
            actualProgramAddress: instruction.programAddress,
            expectedProgramAddress: programAddress,
        });
    }
}

export function isInstructionWithAccounts<
    TAccounts extends readonly (IAccountLookupMeta | IAccountMeta)[] = readonly (IAccountLookupMeta | IAccountMeta)[],
    TInstruction extends IInstruction = IInstruction,
>(instruction: TInstruction): instruction is IInstructionWithAccounts<TAccounts> & TInstruction {
    return instruction.accounts !== undefined;
}

export function assertIsInstructionWithAccounts<
    TAccounts extends readonly (IAccountLookupMeta | IAccountMeta)[] = readonly (IAccountLookupMeta | IAccountMeta)[],
    TInstruction extends IInstruction = IInstruction,
>(instruction: TInstruction): asserts instruction is IInstructionWithAccounts<TAccounts> & TInstruction {
    if (instruction.accounts === undefined) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_ACCOUNTS, {
            data: instruction.data,
            programAddress: instruction.programAddress,
        });
    }
}

/**
 * An instruction whose data conforms to a certain type.
 *
 * This is most useful when you have a branded `Uint8Array` that represents a particular
 * instruction's data.
 *
 * @example A type for the \`AdvanceNonce\` instruction of the System program
 * ```ts
 * type AdvanceNonceAccountInstruction<
 *     TNonceAccountAddress extends string = string,
 *     TNonceAuthorityAddress extends string = string,
 * > = IInstruction<'11111111111111111111111111111111'> &
 *     IInstructionWithAccounts<
 *         [
 *             WritableAccount<TNonceAccountAddress>,
 *             ReadonlyAccount<'SysvarRecentB1ockHashes11111111111111111111'>,
 *             ReadonlySignerAccount<TNonceAuthorityAddress>,
 *         ]
 *     > &
 *     IInstructionWithData<AdvanceNonceAccountInstructionData>;
 * ```
 */
export interface IInstructionWithData<TData extends ReadonlyUint8Array> extends IInstruction {
    readonly data: TData;
}

export function isInstructionWithData<
    TData extends ReadonlyUint8Array = ReadonlyUint8Array,
    TInstruction extends IInstruction = IInstruction,
>(instruction: TInstruction): instruction is IInstructionWithData<TData> & TInstruction {
    return instruction.data !== undefined;
}

export function assertIsInstructionWithData<
    TData extends ReadonlyUint8Array = ReadonlyUint8Array,
    TInstruction extends IInstruction = IInstruction,
>(instruction: TInstruction): asserts instruction is IInstructionWithData<TData> & TInstruction {
    if (instruction.data === undefined) {
        throw new SolanaError(SOLANA_ERROR__INSTRUCTION__EXPECTED_TO_HAVE_DATA, {
            accountAddresses: instruction.accounts?.map(a => a.address),
            programAddress: instruction.programAddress,
        });
    }
}
