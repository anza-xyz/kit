import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
    SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH,
    SolanaError,
} from '@solana/errors';
import { AccountMeta, Instruction } from '@solana/instructions';

import { InstructionHeader, InstructionPayload } from '../../compile/v1/instructions';

function decompileInstruction(
    instructionHeader: InstructionHeader,
    instructionPayload: InstructionPayload,
    accountMetas: AccountMeta[],
): Instruction {
    const programAddress = accountMetas[instructionHeader.programAccountIndex]?.address;
    if (!programAddress) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
            index: instructionHeader.programAccountIndex,
        });
    }

    const accounts = instructionPayload.instructionAccountIndices.map(accountIndex => accountMetas[accountIndex]);
    const data = instructionPayload.instructionData;

    return Object.freeze({
        programAddress,
        ...(accounts && accounts.length ? { accounts: Object.freeze(accounts) } : {}),
        ...(data && data.length ? { data } : {}),
    });
}

export function decompileInstructions(
    instructionHeaders: InstructionHeader[],
    instructionPayloads: InstructionPayload[],
    accountMetas: AccountMeta[],
): Instruction[] {
    if (instructionHeaders.length !== instructionPayloads.length) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__INSTRUCTION_HEADERS_PAYLOADS_MISMATCH, {
            numInstructionHeaders: instructionHeaders.length,
            numInstructionPayloads: instructionPayloads.length,
        });
    }

    return instructionHeaders.map((instructionHeader, index) =>
        decompileInstruction(instructionHeader, instructionPayloads[index], accountMetas),
    );
}
