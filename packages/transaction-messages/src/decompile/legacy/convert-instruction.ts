import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
    SolanaError,
} from '@solana/errors';
import { AccountMeta, Instruction } from '@solana/instructions';

import { CompiledTransactionMessage } from '../..';

function convertInstruction(
    instruction: CompiledTransactionMessage['instructions'][number],
    accountMetas: AccountMeta[],
): Instruction {
    const programAddress = accountMetas[instruction.programAddressIndex]?.address;
    if (!programAddress) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
            index: instruction.programAddressIndex,
        });
    }

    const accounts = instruction.accountIndices?.map(accountIndex => accountMetas[accountIndex]);
    const { data } = instruction;

    return Object.freeze({
        programAddress,
        ...(accounts && accounts.length ? { accounts: Object.freeze(accounts) } : {}),
        ...(data && data.length ? { data } : {}),
    });
}

export function convertInstructions(
    instructions: CompiledTransactionMessage['instructions'],
    accountMetas: AccountMeta[],
): Instruction[] {
    return instructions.map(instruction => convertInstruction(instruction, accountMetas));
}
