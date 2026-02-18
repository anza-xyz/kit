import {
    addDecoderSizePrefix,
    addEncoderSizePrefix,
    combineCodec,
    createEncoder,
    FixedSizeEncoder,
    transformDecoder,
    transformEncoder,
    VariableSizeCodec,
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
import {
    getShortU16Decoder,
    getShortU16Encoder,
    getU8Decoder,
    getU8Encoder,
    getU16Encoder,
} from '@solana/codecs-numbers';

import { getCompiledInstructions } from '../compile/instructions';

type CompiledInstruction = ReturnType<typeof getCompiledInstructions>[number];

let memoizedGetInstructionEncoder: VariableSizeEncoder<CompiledInstruction> | undefined;
export function getInstructionEncoder(): VariableSizeEncoder<CompiledInstruction> {
    if (!memoizedGetInstructionEncoder) {
        memoizedGetInstructionEncoder = transformEncoder<Required<CompiledInstruction>, CompiledInstruction>(
            getStructEncoder([
                ['programAddressIndex', getU8Encoder()],
                ['accountIndices', getArrayEncoder(getU8Encoder(), { size: getShortU16Encoder() })],
                ['data', addEncoderSizePrefix(getBytesEncoder(), getShortU16Encoder())],
            ]),
            // Convert an instruction to have all fields defined
            (instruction: CompiledInstruction): Required<CompiledInstruction> => {
                if (instruction.accountIndices !== undefined && instruction.data !== undefined) {
                    return instruction as Required<CompiledInstruction>;
                }
                return {
                    ...instruction,
                    accountIndices: instruction.accountIndices ?? [],
                    data: instruction.data ?? new Uint8Array(0),
                } as Required<CompiledInstruction>;
            },
        );
    }

    return memoizedGetInstructionEncoder;
}

let memoizedGetInstructionDecoder: VariableSizeDecoder<CompiledInstruction> | undefined;
export function getInstructionDecoder(): VariableSizeDecoder<CompiledInstruction> {
    if (!memoizedGetInstructionDecoder) {
        memoizedGetInstructionDecoder = transformDecoder<Required<CompiledInstruction>, CompiledInstruction>(
            getStructDecoder([
                ['programAddressIndex', getU8Decoder()],
                ['accountIndices', getArrayDecoder(getU8Decoder(), { size: getShortU16Decoder() })],
                [
                    'data',
                    addDecoderSizePrefix(getBytesDecoder(), getShortU16Decoder()) as VariableSizeDecoder<Uint8Array>,
                ],
            ]),
            // Convert an instruction to exclude optional fields if they are empty
            (instruction: Required<CompiledInstruction>): CompiledInstruction => {
                if (instruction.accountIndices.length && instruction.data.byteLength) {
                    return instruction;
                }
                const { accountIndices, data, ...rest } = instruction;
                return {
                    ...rest,
                    ...(accountIndices.length ? { accountIndices } : null),
                    ...(data.byteLength ? { data } : null),
                };
            },
        );
    }
    return memoizedGetInstructionDecoder;
}

export function getInstructionCodec(): VariableSizeCodec<CompiledInstruction> {
    return combineCodec(getInstructionEncoder(), getInstructionDecoder());
}

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
