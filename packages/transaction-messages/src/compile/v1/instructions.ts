import { ReadonlyUint8Array } from '@solana/codecs-core';
import { Instruction } from '@solana/instructions';

import { getAccountIndex } from '../v0/instructions';

export type InstructionHeader = {
    numInstructionAccounts: number;
    numInstructionDataBytes: number;
    programAccountIndex: number;
};

export type InstructionPayload = {
    instructionAccountIndices: number[];
    instructionData: ReadonlyUint8Array;
};

export function getInstructionHeader(
    instruction: Instruction,
    accountIndex: ReturnType<typeof getAccountIndex>,
): InstructionHeader {
    return {
        numInstructionAccounts: instruction.accounts?.length ?? 0,
        numInstructionDataBytes: instruction.data?.byteLength ?? 0,
        programAccountIndex: accountIndex[instruction.programAddress],
    };
}

export function getInstructionPayload(
    instruction: Instruction,
    accountIndex: ReturnType<typeof getAccountIndex>,
): InstructionPayload {
    return {
        instructionAccountIndices: instruction.accounts?.map(({ address }) => accountIndex[address]) ?? [],
        instructionData: instruction.data ?? new Uint8Array(),
    };
}
