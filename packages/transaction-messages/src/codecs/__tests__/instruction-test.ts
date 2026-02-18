import { getCompiledInstructions } from '../../compile/instructions';
import {
    getInstructionCodec,
    getInstructionDecoder,
    getInstructionEncoder,
    getInstructionHeaderEncoder,
} from '../instruction';

type CompiledInstruction = ReturnType<typeof getCompiledInstructions>[number];

describe('Instruction codec', () => {
    describe.each([getInstructionEncoder, getInstructionCodec])('instruction encoder %p', encoderFactory => {
        let instruction: ReturnType<typeof getInstructionEncoder>;
        beforeEach(() => {
            instruction = encoderFactory();
        });
        it('serializes an instruction according to spec', () => {
            expect(
                instruction.encode({
                    accountIndices: [1, 2],
                    data: new Uint8Array([4, 5, 6]),
                    programAddressIndex: 7,
                }),
            ).toEqual(
                new Uint8Array([
                    // Program id index
                    7,
                    // Compact array of account indices
                    2, // Compact-u16 length
                    1,
                    2,
                    // Compact array of instruction data
                    3, // Compact-u16 length
                    4,
                    5,
                    6,
                ]),
            );
        });
        it('serializes a zero-length compact array when `accountIndices` is `undefined`', () => {
            expect(
                instruction.encode({
                    data: new Uint8Array([3, 4]),
                    programAddressIndex: 1,
                }),
            ).toEqual(
                new Uint8Array([
                    // Program id index
                    1,
                    // Compact array of account indices
                    0, // Compact-u16 length
                    // Compact array of instruction data
                    2, // Compact-u16 length
                    3,
                    4,
                ]),
            );
        });
        it('serializes a zero-length compact array when `data` is `undefined`', () => {
            expect(
                instruction.encode({
                    accountIndices: [3, 4],
                    programAddressIndex: 1,
                }),
            ).toEqual(
                new Uint8Array([
                    // Program id index
                    1,
                    // Compact array of account indices
                    2, // Compact-u16 length
                    3,
                    4,
                    // Compact array of instruction data
                    0, // Compact-u16 length
                ]),
            );
        });
    });

    describe.each([getInstructionDecoder, getInstructionCodec])('instruction decoder %p', decoderFactory => {
        let instruction: ReturnType<typeof getInstructionDecoder>;
        beforeEach(() => {
            instruction = decoderFactory();
        });
        it('deserializes an instruction according to spec', () => {
            expect(
                instruction.decode(
                    new Uint8Array([
                        // Program id index
                        1,
                        // Compact array of account indices
                        2, // Compact-u16 length
                        3,
                        4,
                        // Compact array of instruction data
                        5, // Compact-u16 length
                        6,
                        7,
                        8,
                        9,
                        10,
                    ]),
                ),
            ).toEqual({
                accountIndices: [3, 4],
                data: new Uint8Array([6, 7, 8, 9, 10]),
                programAddressIndex: 1,
            });
        });
        it('omits the `accountIndices` property when the indices data is zero-length', () => {
            expect(
                instruction.decode(
                    new Uint8Array([
                        // Program id index
                        1,
                        // Compact array of account indices
                        0, // Compact-u16 length
                        // Compact array of instruction data
                        2, // Compact-u16 length
                        3,
                        4,
                    ]),
                ),
            ).not.toHaveProperty('accountIndices');
        });
        it('omits the `data` property when the instruction data is zero-length', () => {
            expect(
                instruction.decode(
                    new Uint8Array([
                        // Program id index
                        1,
                        // Compact array of account indices
                        2, // Compact-u16 length
                        3,
                        4,
                        // Compact array of instruction data
                        0, // Compact-u16 length
                    ]),
                ),
            ).not.toHaveProperty('data');
        });
    });
});

describe('getInstructionHeaderEncoder', () => {
    const encoder = getInstructionHeaderEncoder();

    it('encodes the instruction header when all fields are defined', () => {
        const instruction: CompiledInstruction = {
            accountIndices: [2, 3],
            data: Uint8Array.from({ length: 2 ** 16 - 1 }, (_, i) => i),
            programAddressIndex: 1,
        };
        expect(encoder.encode(instruction)).toEqual(
            new Uint8Array([
                1, // programAddressIndex (1 byte)
                2, // numInstructionAccounts (1 byte)
                255,
                255, // numInstructionDataBytes (2 bytes)
            ]),
        );
    });

    it('encodes 0 accounts when accounts is missing', () => {
        const instruction: CompiledInstruction = {
            data: new Uint8Array([1, 2, 3]),
            programAddressIndex: 1,
        };
        expect(encoder.encode(instruction)).toEqual(
            new Uint8Array([
                1, // programAddressIndex (1 byte)
                0, // numInstructionAccounts (1 byte)
                3,
                0, // numInstructionDataBytes (2 bytes)
            ]),
        );
    });

    it('encodes 0 data bytes when data is missing', () => {
        const instruction: CompiledInstruction = {
            accountIndices: [2, 3],
            programAddressIndex: 1,
        };
        expect(encoder.encode(instruction)).toEqual(
            new Uint8Array([
                1, // programAddressIndex (1 byte)
                2, // numInstructionAccounts (1 byte)
                0,
                0, // numInstructionDataBytes (2 bytes)
            ]),
        );
    });
});
