import { Address } from '@solana/addresses';
import { Instruction } from '@solana/instructions';

import { getInstructionHeader, getInstructionPayload } from '../instructions';

describe('getInstructionHeader', () => {
    const programAddress = '11111111111111111111111111111111' as Address;
    const accountAddress1 = '22222222222222222222222222222222' as Address;
    const accountAddress2 = '33333333333333333333333333333333' as Address;

    it('returns the instruction header when all fields are defined', () => {
        const instruction: Instruction = {
            accounts: [
                { address: accountAddress1, role: 0 },
                { address: accountAddress2, role: 0 },
            ],
            data: Uint8Array.from({ length: 2 ** 16 - 1 }, (_, i) => i),
            programAddress,
        };
        const accountIndex = {
            [accountAddress1]: 2,
            [accountAddress2]: 3,
            [programAddress]: 1,
        };
        expect(getInstructionHeader(instruction, accountIndex)).toEqual({
            numInstructionAccounts: 2,
            numInstructionDataBytes: 2 ** 16 - 1,
            programAccountIndex: 1,
        });
    });

    it('returns 0 accounts when accounts is missing', () => {
        const instruction: Instruction = {
            data: new Uint8Array([1, 2, 3]),
            programAddress,
        };
        const accountIndex = {
            [programAddress]: 1,
        };
        expect(getInstructionHeader(instruction, accountIndex)).toEqual({
            numInstructionAccounts: 0,
            numInstructionDataBytes: 3,
            programAccountIndex: 1,
        });
    });

    it('returns 0 data bytes when data is missing', () => {
        const instruction: Instruction = {
            accounts: [
                { address: accountAddress1, role: 0 },
                { address: accountAddress2, role: 0 },
            ],
            programAddress,
        };
        const accountIndex = {
            [accountAddress1]: 2,
            [accountAddress2]: 3,
            [programAddress]: 1,
        };
        expect(getInstructionHeader(instruction, accountIndex)).toEqual({
            numInstructionAccounts: 2,
            numInstructionDataBytes: 0,
            programAccountIndex: 1,
        });
    });
});

describe('getInstructionPayload', () => {
    const programAddress = '11111111111111111111111111111111' as Address;
    const accountAddress1 = '22222222222222222222222222222222' as Address;
    const accountAddress2 = '33333333333333333333333333333333' as Address;

    it('returns the instruction payload when all fields are defined', () => {
        const instruction: Instruction = {
            accounts: [
                { address: accountAddress1, role: 0 },
                { address: accountAddress2, role: 0 },
            ],
            data: new Uint8Array([1, 2, 3]),
            programAddress,
        };
        const accountIndex = {
            [accountAddress1]: 2,
            [accountAddress2]: 3,
            [programAddress]: 1,
        };
        expect(getInstructionPayload(instruction, accountIndex)).toEqual({
            instructionAccountIndices: [2, 3],
            instructionData: new Uint8Array([1, 2, 3]),
        });
    });

    it('returns an empty array when `accounts` is missing', () => {
        const instruction: Instruction = {
            data: new Uint8Array([1, 2, 3]),
            programAddress,
        };
        const accountIndex = {
            [programAddress]: 1,
        };
        expect(getInstructionPayload(instruction, accountIndex)).toEqual({
            instructionAccountIndices: [],
            instructionData: new Uint8Array([1, 2, 3]),
        });
    });

    it('returns an empty Uint8Array when `data` is missing', () => {
        const instruction: Instruction = {
            accounts: [
                { address: accountAddress1, role: 0 },
                { address: accountAddress2, role: 0 },
            ],
            programAddress,
        };
        const accountIndex = {
            [accountAddress1]: 2,
            [accountAddress2]: 3,
            [programAddress]: 1,
        };
        expect(getInstructionPayload(instruction, accountIndex)).toEqual({
            instructionAccountIndices: [2, 3],
            instructionData: new Uint8Array(),
        });
    });

    it('returns an empty payload when both `accounts` and `data` are missing', () => {
        const instruction: Instruction = {
            programAddress,
        };
        const accountIndex = {
            [programAddress]: 1,
        };
        expect(getInstructionPayload(instruction, accountIndex)).toEqual({
            instructionAccountIndices: [],
            instructionData: new Uint8Array(),
        });
    });
});
