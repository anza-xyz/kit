import { Address } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import { getBytesEncoder, getStructEncoder } from '@solana/codecs-data-structures';
import { getU8Encoder, getU32Decoder, getU32Encoder, getU64Decoder, getU64Encoder } from '@solana/codecs-numbers';
import { Instruction, InstructionWithData } from '@solana/instructions';

import type { TransactionMessage } from './transaction-message';

/** Address of the Compute Budget program. */
export const COMPUTE_BUDGET_PROGRAM_ADDRESS =
    'ComputeBudget111111111111111111111111111111' as Address<'ComputeBudget111111111111111111111111111111'>;

/** The maximum compute unit limit that can be set for a transaction (1.4M CU). */
export const MAX_COMPUTE_UNIT_LIMIT = 1_400_000;

const REQUEST_HEAP_FRAME_DISCRIMINATOR = 1;
const SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR = 2;
const SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR = 3;
const SET_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_DISCRIMINATOR = 4;

type ComputeBudgetInstruction = Instruction<typeof COMPUTE_BUDGET_PROGRAM_ADDRESS> &
    InstructionWithData<ReadonlyUint8Array>;

function getComputeBudgetInstruction(discriminator: number, value: ReadonlyUint8Array): ComputeBudgetInstruction {
    const data = getStructEncoder([
        ['discriminator', getU8Encoder()],
        ['value', getBytesEncoder()],
    ]).encode({ discriminator, value });
    return Object.freeze({
        data,
        programAddress: COMPUTE_BUDGET_PROGRAM_ADDRESS,
    }) as ComputeBudgetInstruction;
}

function isComputeBudgetInstruction(
    instruction: Instruction,
    discriminator: number,
    expectedDataLength: number,
): instruction is ComputeBudgetInstruction {
    return (
        instruction.programAddress === COMPUTE_BUDGET_PROGRAM_ADDRESS &&
        'data' in instruction &&
        instruction.data != null &&
        instruction.data.byteLength === expectedDataLength &&
        instruction.data[0] === discriminator
    );
}

export function getSetComputeUnitLimitInstruction(units: number): ComputeBudgetInstruction {
    return getComputeBudgetInstruction(SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR, getU32Encoder().encode(units));
}

export function isSetComputeUnitLimitInstruction(instruction: Instruction): instruction is ComputeBudgetInstruction {
    return isComputeBudgetInstruction(instruction, SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR, 5);
}

export function getComputeUnitLimitFromInstructionData(data: ReadonlyUint8Array): number {
    return getU32Decoder().decode(data, 1);
}

export function getSetComputeUnitPriceInstruction(microLamports: bigint): ComputeBudgetInstruction {
    return getComputeBudgetInstruction(SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR, getU64Encoder().encode(microLamports));
}

export function isSetComputeUnitPriceInstruction(instruction: Instruction): instruction is ComputeBudgetInstruction {
    return isComputeBudgetInstruction(instruction, SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR, 9);
}

export function getPriorityFeeFromInstructionData(data: ReadonlyUint8Array): bigint {
    return getU64Decoder().decode(data, 1);
}

export function getRequestHeapFrameInstruction(bytes: number): ComputeBudgetInstruction {
    return getComputeBudgetInstruction(REQUEST_HEAP_FRAME_DISCRIMINATOR, getU32Encoder().encode(bytes));
}

export function isRequestHeapFrameInstruction(instruction: Instruction): instruction is ComputeBudgetInstruction {
    return isComputeBudgetInstruction(instruction, REQUEST_HEAP_FRAME_DISCRIMINATOR, 5);
}

export function getHeapSizeFromInstructionData(data: ReadonlyUint8Array): number {
    return getU32Decoder().decode(data, 1);
}

export function getSetLoadedAccountsDataSizeLimitInstruction(limit: number): ComputeBudgetInstruction {
    return getComputeBudgetInstruction(
        SET_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_DISCRIMINATOR,
        getU32Encoder().encode(limit),
    );
}

export function isSetLoadedAccountsDataSizeLimitInstruction(
    instruction: Instruction,
): instruction is ComputeBudgetInstruction {
    return isComputeBudgetInstruction(instruction, SET_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_DISCRIMINATOR, 5);
}

export function getLoadedAccountsDataSizeLimitFromInstructionData(data: ReadonlyUint8Array): number {
    return getU32Decoder().decode(data, 1);
}

export function replaceTransactionMessageInstruction<TTransactionMessage extends TransactionMessage>(
    index: number,
    newInstruction: Instruction,
    transactionMessage: TTransactionMessage,
) {
    const nextInstructions = [...transactionMessage.instructions];
    nextInstructions[index] = newInstruction;
    return Object.freeze({
        ...transactionMessage,
        instructions: Object.freeze(nextInstructions),
    }) as TTransactionMessage;
}

export function removeTransactionMessageInstruction<TTransactionMessage extends TransactionMessage>(
    index: number,
    transactionMessage: TTransactionMessage,
) {
    return Object.freeze({
        ...transactionMessage,
        instructions: Object.freeze([
            ...transactionMessage.instructions.slice(0, index),
            ...transactionMessage.instructions.slice(index + 1),
        ]),
    }) as TTransactionMessage;
}
