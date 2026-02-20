import {
    createEncoder,
    fixDecoderSize,
    FixedSizeDecoder,
    FixedSizeEncoder,
    transformDecoder,
    transformEncoder,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import {
    getArrayDecoder,
    getArrayEncoder,
    getBytesDecoder,
    getBytesEncoder,
    getStructDecoder,
    getStructEncoder,
} from '@solana/codecs-data-structures';
import { getU8Decoder, getU8Encoder, getU16Decoder, getU16Encoder } from '@solana/codecs-numbers';

import { getCompiledInstructions } from '../../compile/instructions';

type CompiledInstruction = ReturnType<typeof getCompiledInstructions>[number];

type InstructionHeader = {
    numInstructionAccounts: number;
    numInstructionDataBytes: number;
    programAddressIndex: number;
};

/**
 * Encode the fixed size header of a {@link CompiledInstruction}, which includes the program address index, the number of account indices, and the number of data bytes.
 * @returns A FixedSizeEncoder for the instruction header
 */
export function getInstructionHeaderEncoder(): FixedSizeEncoder<CompiledInstruction> {
    return transformEncoder(
        getStructEncoder([
            ['programAddressIndex', getU8Encoder()],
            ['numInstructionAccounts', getU8Encoder()],
            ['numInstructionDataBytes', getU16Encoder()],
        ]),
        (instruction: CompiledInstruction): InstructionHeader => {
            return {
                numInstructionAccounts: instruction.accountIndices?.length ?? 0,
                numInstructionDataBytes: instruction.data?.byteLength ?? 0,
                programAddressIndex: instruction.programAddressIndex,
            };
        },
    );
}

/**
 * Encode the variable size payload of a {@link CompiledInstruction}, which includes the account indices and instruction data.
 * Both arrays are optional and are omitted if empty
 * @returns A VariableSizeEncoder for the instruction payload
 */
export function getInstructionPayloadEncoder(): VariableSizeEncoder<CompiledInstruction> {
    return createEncoder<CompiledInstruction>({
        getSizeFromValue(instruction) {
            const accountIndicesSize = instruction.accountIndices ? instruction.accountIndices.length : 0;
            const dataSize = instruction.data ? instruction.data.byteLength : 0;
            return accountIndicesSize + dataSize;
        },
        write(instruction, bytes, offset) {
            let nextOffset = offset;
            if (instruction.accountIndices) {
                nextOffset = getArrayEncoder(getU8Encoder(), { size: instruction.accountIndices.length }).write(
                    instruction.accountIndices,
                    bytes,
                    nextOffset,
                );
            }
            if (instruction.data) {
                nextOffset = getBytesEncoder().write(instruction.data, bytes, nextOffset);
            }
            return nextOffset;
        },
    });
}

/**
 * Decode an {@link InstructionHeader} from a byte array
 * @returns A FixedSizeDecoder for the instruction header
 */
export function getInstructionHeaderDecoder(): FixedSizeDecoder<InstructionHeader> {
    return getStructDecoder([
        ['programAddressIndex', getU8Decoder()],
        ['numInstructionAccounts', getU8Decoder()],
        ['numInstructionDataBytes', getU16Decoder()],
    ]);
}

/**
 * Decode a CompiledInstruction from a byte array, given the instruction header
 * @param instructionHeader The header for the instruction
 * @returns A decoder for CompiledInstruction
 */
export function getInstructionPayloadDecoder(
    instructionHeader: InstructionHeader,
): VariableSizeDecoder<CompiledInstruction> {
    return transformDecoder(
        getStructDecoder([
            ['accountIndices', getArrayDecoder(getU8Decoder(), { size: instructionHeader.numInstructionAccounts })],
            ['data', fixDecoderSize(getBytesDecoder(), instructionHeader.numInstructionDataBytes)],
        ]),
        ({ accountIndices, data }) => {
            const compiledInstruction: CompiledInstruction = {
                programAddressIndex: instructionHeader.programAddressIndex,
                ...(accountIndices.length ? { accountIndices } : null),
                ...(data.byteLength ? { data } : null),
            };
            return compiledInstruction;
        },
    );
}
