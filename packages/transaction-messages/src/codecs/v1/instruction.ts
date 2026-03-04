import {
    combineCodec,
    createEncoder,
    fixDecoderSize,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    fixEncoderSize,
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

import { InstructionHeader, InstructionPayload } from '../../compile/v1/instructions';

/**
 * Encode the fixed size {@link InstructionHeader}
 * @returns A FixedSizeEncoder for the instruction header
 */
export function getInstructionHeaderEncoder(): FixedSizeEncoder<InstructionHeader> {
    return getStructEncoder([
        ['programAccountIndex', getU8Encoder()],
        ['numInstructionAccounts', getU8Encoder()],
        ['numInstructionDataBytes', getU16Encoder()],
    ]);
}

/**
 * Decode an {@link InstructionHeader} from a byte array
 * @returns A FixedSizeDecoder for the instruction header
 */
export function getInstructionHeaderDecoder(): FixedSizeDecoder<InstructionHeader> {
    return getStructDecoder([
        ['programAccountIndex', getU8Decoder()],
        ['numInstructionAccounts', getU8Decoder()],
        ['numInstructionDataBytes', getU16Decoder()],
    ]);
}

/**
 * Get a codec for the {@link InstructionHeader}, which includes both the encoder and decoder
 * @returns A FixedSizeCodec for the instruction header
 */
export function getInstructionHeaderCodec(): FixedSizeCodec<InstructionHeader> {
    return combineCodec(getInstructionHeaderEncoder(), getInstructionHeaderDecoder());
}

/**
 * Encode the variable size {@link InstructionPayload}, which includes the account indices and instruction data.
 * Both arrays may be empty
 * @returns A VariableSizeEncoder for the instruction payload
 */
export function getInstructionPayloadEncoder(): VariableSizeEncoder<InstructionPayload> {
    return createEncoder({
        getSizeFromValue(instructionPayload) {
            return instructionPayload.instructionAccountIndices.length + instructionPayload.instructionData.byteLength;
        },
        write(instructionPayload, bytes, offset) {
            return getStructEncoder([
                [
                    'instructionAccountIndices',
                    getArrayEncoder(getU8Encoder(), { size: instructionPayload.instructionAccountIndices.length }),
                ],
                ['instructionData', fixEncoderSize(getBytesEncoder(), instructionPayload.instructionData.byteLength)],
            ]).write(instructionPayload, bytes, offset);
        },
    });
}

/**
 * Decode an {@link InstructionPayload} from a byte array, given the instruction header
 * @param instructionHeader The header for the instruction
 * @returns A decoder for InstructionPayload
 */
export function getInstructionPayloadDecoder(
    instructionHeader: Pick<InstructionHeader, 'numInstructionAccounts' | 'numInstructionDataBytes'>,
): VariableSizeDecoder<InstructionPayload> {
    return getStructDecoder([
        [
            'instructionAccountIndices',
            getArrayDecoder(getU8Decoder(), { size: instructionHeader.numInstructionAccounts }),
        ],
        ['instructionData', fixDecoderSize(getBytesDecoder(), instructionHeader.numInstructionDataBytes)],
    ]);
}
