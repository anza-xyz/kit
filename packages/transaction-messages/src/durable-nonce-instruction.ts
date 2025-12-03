import { Address } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import {
    AccountRole,
    Instruction,
    InstructionWithAccounts,
    InstructionWithData,
    isSignerRole,
    ReadonlyAccount,
    ReadonlySignerAccount,
    WritableAccount,
    WritableSignerAccount,
} from '@solana/instructions';
import { Brand } from '@solana/nominal-types';

export type AdvanceNonceAccountInstruction<
    TNonceAccountAddress extends string = string,
    TNonceAuthorityAddress extends string = string,
> = Instruction<'11111111111111111111111111111111'> &
    InstructionWithAccounts<
        readonly [
            WritableAccount<TNonceAccountAddress>,
            ReadonlyAccount<'SysvarRecentB1ockHashes11111111111111111111'>,
            ReadonlySignerAccount<TNonceAuthorityAddress> | WritableSignerAccount<TNonceAuthorityAddress>,
        ]
    > &
    InstructionWithData<AdvanceNonceAccountInstructionData>;

type AdvanceNonceAccountInstructionData = Brand<Uint8Array, 'AdvanceNonceAccountInstructionData'>;

const RECENT_BLOCKHASHES_SYSVAR_ADDRESS =
    'SysvarRecentB1ockHashes11111111111111111111' as Address<'SysvarRecentB1ockHashes11111111111111111111'>;
const SYSTEM_PROGRAM_ADDRESS = '11111111111111111111111111111111' as Address<'11111111111111111111111111111111'>;

/**
 * Creates an instruction for the System program to advance a nonce.
 *
 * This instruction is a prerequisite for a transaction with a nonce-based lifetime to be landed on
 * the network. In order to be considered valid, the transaction must meet all of these criteria.
 *
 * 1. Its lifetime constraint must be a {@link NonceLifetimeConstraint}.
 * 2. The value contained in the on-chain account at the address `nonceAccountAddress` must be equal
 *    to {@link NonceLifetimeConstraint.nonce} at the time the transaction is landed.
 * 3. The first instruction in that transaction message must be the one returned by this function.
 *
 * You could also use the `getAdvanceNonceAccountInstruction` method of `@solana-program/system`.
 */
export function createAdvanceNonceAccountInstruction<
    TNonceAccountAddress extends string = string,
    TNonceAuthorityAddress extends string = string,
>(
    nonceAccountAddress: Address<TNonceAccountAddress>,
    nonceAuthorityAddress: Address<TNonceAuthorityAddress>,
): AdvanceNonceAccountInstruction<TNonceAccountAddress, TNonceAuthorityAddress> {
    return {
        accounts: [
            { address: nonceAccountAddress, role: AccountRole.WRITABLE },
            {
                address: RECENT_BLOCKHASHES_SYSVAR_ADDRESS,
                role: AccountRole.READONLY,
            },
            { address: nonceAuthorityAddress, role: AccountRole.READONLY_SIGNER },
        ],
        data: new Uint8Array([4, 0, 0, 0]) as AdvanceNonceAccountInstructionData,
        programAddress: SYSTEM_PROGRAM_ADDRESS,
    };
}

/**
 * A type guard that returns `true` if the instruction conforms to the
 * {@link AdvanceNonceAccountInstruction} type, and refines its type for use in your program.
 *
 * @example
 * ```ts
 * import { isAdvanceNonceAccountInstruction } from '@solana/transaction-messages';
 *
 * if (isAdvanceNonceAccountInstruction(message.instructions[0])) {
 *     // At this point, the first instruction in the message has been refined to a
 *     // `AdvanceNonceAccountInstruction`.
 *     setNonceAccountAddress(message.instructions[0].accounts[0].address);
 * } else {
 *     setError('The first instruction is not an `AdvanceNonce` instruction');
 * }
 * ```
 */
export function isAdvanceNonceAccountInstruction(
    instruction: Instruction,
): instruction is AdvanceNonceAccountInstruction {
    return (
        instruction.programAddress === SYSTEM_PROGRAM_ADDRESS &&
        // Test for `AdvanceNonceAccount` instruction data
        instruction.data != null &&
        isAdvanceNonceAccountInstructionData(instruction.data) &&
        // Test for exactly 3 accounts
        instruction.accounts?.length === 3 &&
        // First account is nonce account address
        instruction.accounts[0].address != null &&
        instruction.accounts[0].role === AccountRole.WRITABLE &&
        // Second account is recent blockhashes sysvar
        instruction.accounts[1].address === RECENT_BLOCKHASHES_SYSVAR_ADDRESS &&
        instruction.accounts[1].role === AccountRole.READONLY &&
        // Third account is nonce authority account
        instruction.accounts[2].address != null &&
        isSignerRole(instruction.accounts[2].role)
    );
}

function isAdvanceNonceAccountInstructionData(data: ReadonlyUint8Array): data is AdvanceNonceAccountInstructionData {
    // AdvanceNonceAccount is the fifth instruction in the System Program (index 4)
    return data.byteLength === 4 && data[0] === 4 && data[1] === 0 && data[2] === 0 && data[3] === 0;
}
