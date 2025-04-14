import { Address } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import { SOLANA_ERROR__TRANSACTION__EXPECTED_NONCE_LIFETIME, SolanaError } from '@solana/errors';
import {
    AccountRole,
    IInstruction,
    IInstructionWithAccounts,
    IInstructionWithData,
    isSignerRole,
    ReadonlyAccount,
    ReadonlySignerAccount,
    WritableAccount,
    WritableSignerAccount,
} from '@solana/instructions';

import { BaseTransactionMessage } from './transaction-message';

type AdvanceNonceAccountInstruction<
    TNonceAccountAddress extends string = string,
    TNonceAuthorityAddress extends string = string,
> = IInstruction<'11111111111111111111111111111111'> &
    IInstructionWithAccounts<
        readonly [
            WritableAccount<TNonceAccountAddress>,
            ReadonlyAccount<'SysvarRecentB1ockHashes11111111111111111111'>,
            ReadonlySignerAccount<TNonceAuthorityAddress> | WritableSignerAccount<TNonceAuthorityAddress>,
        ]
    > &
    IInstructionWithData<AdvanceNonceAccountInstructionData>;
type AdvanceNonceAccountInstructionData = Uint8Array & {
    readonly __brand: unique symbol;
};
type DurableNonceConfig<
    TNonceAccountAddress extends string = string,
    TNonceAuthorityAddress extends string = string,
    TNonceValue extends string = string,
> = Readonly<{
    readonly nonce: Nonce<TNonceValue>;
    readonly nonceAccountAddress: Address<TNonceAccountAddress>;
    readonly nonceAuthorityAddress: Address<TNonceAuthorityAddress>;
}>;
export type Nonce<TNonceValue extends string = string> = TNonceValue & { readonly __brand: unique symbol };
type NonceLifetimeConstraint<TNonceValue extends string = string> = Readonly<{
    nonce: Nonce<TNonceValue>;
}>;

const RECENT_BLOCKHASHES_SYSVAR_ADDRESS =
    'SysvarRecentB1ockHashes11111111111111111111' as Address<'SysvarRecentB1ockHashes11111111111111111111'>;
const SYSTEM_PROGRAM_ADDRESS = '11111111111111111111111111111111' as Address<'11111111111111111111111111111111'>;

export interface TransactionMessageWithDurableNonceLifetime<
    TNonceAccountAddress extends string = string,
    TNonceAuthorityAddress extends string = string,
    TNonceValue extends string = string,
> {
    readonly instructions: readonly [
        // The first instruction *must* be the system program's `AdvanceNonceAccount` instruction.
        AdvanceNonceAccountInstruction<TNonceAccountAddress, TNonceAuthorityAddress>,
        ...IInstruction[],
    ];
    readonly lifetimeConstraint: NonceLifetimeConstraint<TNonceValue>;
}

export function assertIsDurableNonceTransactionMessage(
    transactionMessage: BaseTransactionMessage | (BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime),
): asserts transactionMessage is BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime {
    if (!isDurableNonceTransaction(transactionMessage)) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXPECTED_NONCE_LIFETIME);
    }
}

function createAdvanceNonceAccountInstruction<
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

export function isAdvanceNonceAccountInstruction(
    instruction: IInstruction,
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

export function isDurableNonceTransaction(
    transactionMessage: BaseTransactionMessage | (BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime),
): transactionMessage is BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime {
    return (
        'lifetimeConstraint' in transactionMessage &&
        typeof transactionMessage.lifetimeConstraint.nonce === 'string' &&
        transactionMessage.instructions[0] != null &&
        isAdvanceNonceAccountInstruction(transactionMessage.instructions[0])
    );
}

function isAdvanceNonceAccountInstructionForNonce<
    TNonceAccountAddress extends Address = Address,
    TNonceAuthorityAddress extends Address = Address,
>(
    instruction: AdvanceNonceAccountInstruction,
    nonceAccountAddress: TNonceAccountAddress,
    nonceAuthorityAddress: TNonceAuthorityAddress,
): instruction is AdvanceNonceAccountInstruction<TNonceAccountAddress, TNonceAuthorityAddress> {
    return (
        instruction.accounts[0].address === nonceAccountAddress &&
        instruction.accounts[2].address === nonceAuthorityAddress
    );
}

export function setTransactionMessageLifetimeUsingDurableNonce<
    TTransactionMessage extends BaseTransactionMessage,
    TNonceAccountAddress extends string = string,
    TNonceAuthorityAddress extends string = string,
    TNonceValue extends string = string,
>(
    {
        nonce,
        nonceAccountAddress,
        nonceAuthorityAddress,
    }: DurableNonceConfig<TNonceAccountAddress, TNonceAuthorityAddress, TNonceValue>,
    transactionMessage: TTransactionMessage | (TransactionMessageWithDurableNonceLifetime & TTransactionMessage),
): TransactionMessageWithDurableNonceLifetime<TNonceAccountAddress, TNonceAuthorityAddress, TNonceValue> &
    TTransactionMessage {
    let newInstructions: [
        AdvanceNonceAccountInstruction<TNonceAccountAddress, TNonceAuthorityAddress>,
        ...IInstruction[],
    ];

    const firstInstruction = transactionMessage.instructions[0];
    if (firstInstruction && isAdvanceNonceAccountInstruction(firstInstruction)) {
        if (isAdvanceNonceAccountInstructionForNonce(firstInstruction, nonceAccountAddress, nonceAuthorityAddress)) {
            if (
                isDurableNonceTransaction(transactionMessage) &&
                transactionMessage.lifetimeConstraint.nonce === nonce
            ) {
                return transactionMessage as TransactionMessageWithDurableNonceLifetime<
                    TNonceAccountAddress,
                    TNonceAuthorityAddress,
                    TNonceValue
                > &
                    TTransactionMessage;
            } else {
                // we already have the right first instruction, leave it as-is
                newInstructions = [firstInstruction, ...transactionMessage.instructions.slice(1)];
            }
        } else {
            // we have a different advance nonce instruction as the first instruction, replace it
            newInstructions = [
                Object.freeze(createAdvanceNonceAccountInstruction(nonceAccountAddress, nonceAuthorityAddress)),
                ...transactionMessage.instructions.slice(1),
            ];
        }
    } else {
        // we don't have an existing advance nonce instruction as the first instruction, prepend one
        newInstructions = [
            Object.freeze(createAdvanceNonceAccountInstruction(nonceAccountAddress, nonceAuthorityAddress)),
            ...transactionMessage.instructions,
        ];
    }

    return Object.freeze({
        ...transactionMessage,
        instructions: Object.freeze(newInstructions),
        lifetimeConstraint: Object.freeze({
            nonce,
        }),
    }) as TransactionMessageWithDurableNonceLifetime<TNonceAccountAddress, TNonceAuthorityAddress, TNonceValue> &
        TTransactionMessage;
}
