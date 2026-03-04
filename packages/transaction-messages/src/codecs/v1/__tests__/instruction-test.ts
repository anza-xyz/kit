import { InstructionHeader, InstructionPayload } from '../../../compile/v1/instructions';
import {
    getInstructionHeaderCodec,
    getInstructionHeaderDecoder,
    getInstructionHeaderEncoder,
    getInstructionPayloadDecoder,
    getInstructionPayloadEncoder,
} from '../instruction';

describe.each([getInstructionHeaderEncoder, getInstructionHeaderCodec])(
    'instruction header encoder %p',
    encoderFactory => {
        const encoder = encoderFactory();

        it('encodes the instruction header when all fields are defined', () => {
            const instructionHeader: InstructionHeader = {
                numInstructionAccounts: 2,
                numInstructionDataBytes: 3,
                programAccountIndex: 1,
            };
            expect(encoder.encode(instructionHeader)).toEqual(
                new Uint8Array([
                    1, // programAccountIndex (1 byte)
                    2, // numInstructionAccounts (1 byte)
                    3,
                    0, // numInstructionDataBytes (2 bytes)
                ]),
            );
        });
    },
);

describe.each([getInstructionHeaderDecoder, getInstructionHeaderCodec])(
    'instruction header decoder %p',
    decoderFactory => {
        const decoder = decoderFactory();

        it('decodes the instruction header when all fields are defined', () => {
            // pretter-ignore
            const encoded = new Uint8Array([
                1, // programAccountIndex (1 byte)
                2, // numInstructionAccounts (1 byte)
                3,
                0, // numInstructionDataBytes (2 bytes)
            ]);
            expect(decoder.decode(encoded)).toEqual({
                numInstructionAccounts: 2,
                numInstructionDataBytes: 3,
                programAccountIndex: 1,
            });
        });
    },
);

describe('getInstructionPayloadEncoder', () => {
    const encoder = getInstructionPayloadEncoder();

    it('encodes the instruction payload when all fields are defined', () => {
        const instruction: InstructionPayload = {
            instructionAccountIndices: [2, 3],
            instructionData: new Uint8Array([1, 2, 3]),
        };
        expect(encoder.encode(instruction)).toEqual(
            new Uint8Array([
                2,
                3, // account indices (2 bytes)
                1,
                2,
                3, // data bytes (3 bytes)
            ]),
        );
    });

    it('encodes just the data when `instructionAccountIndices` is empty', () => {
        const instruction: InstructionPayload = {
            instructionAccountIndices: [],
            instructionData: new Uint8Array([1, 2, 3]),
        };
        expect(encoder.encode(instruction)).toEqual(
            new Uint8Array([
                1,
                2,
                3, // data bytes (3 bytes)
            ]),
        );
    });

    it('encodes just the account indices when `instructionData` is empty', () => {
        const instruction: InstructionPayload = {
            instructionAccountIndices: [2, 3],
            instructionData: new Uint8Array([]),
        };
        expect(encoder.encode(instruction)).toEqual(
            new Uint8Array([
                2,
                3, // account indices (2 bytes)
            ]),
        );
    });

    it('encodes an empty payload when both `instructionAccountIndices` and `instructionData` are empty', () => {
        const instruction: InstructionPayload = {
            instructionAccountIndices: [],
            instructionData: new Uint8Array([]),
        };
        expect(encoder.encode(instruction)).toEqual(new Uint8Array([]));
    });
});

describe('getInstructionPayloadDecoder', () => {
    it('decodes the instruction payload when all fields are defined', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 2,
            numInstructionDataBytes: 3,
        });
        const bytes = new Uint8Array([
            1,
            2, // account indices (2 bytes)
            3,
            4,
            5, // data bytes (3 bytes)
        ]);
        const expected: InstructionPayload = {
            instructionAccountIndices: [1, 2],
            instructionData: new Uint8Array([3, 4, 5]),
        };
        expect(decoder.decode(bytes)).toEqual(expected);
    });

    it('reads empty `accountIndices` when `numInstructionAccounts` is 0', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 0,
            numInstructionDataBytes: 3,
        });
        const bytes = new Uint8Array([
            1,
            2,
            3, // data bytes (3 bytes)
        ]);
        const expected: InstructionPayload = {
            instructionAccountIndices: [],
            instructionData: new Uint8Array([1, 2, 3]),
        };
        expect(decoder.decode(bytes)).toEqual(expected);
    });

    it('reads empty `data` when `numInstructionDataBytes` is 0', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 2,
            numInstructionDataBytes: 0,
        });
        const bytes = new Uint8Array([
            2,
            3, // account indices (2 bytes)
        ]);
        const expected: InstructionPayload = {
            instructionAccountIndices: [2, 3],
            instructionData: new Uint8Array([]),
        };
        expect(decoder.decode(bytes)).toEqual(expected);
    });

    it('decodes an empty payload when both `numInstructionAccounts` and `numInstructionDataBytes` are 0', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 0,
            numInstructionDataBytes: 0,
        });
        expect(decoder.decode(new Uint8Array([]))).toEqual({
            instructionAccountIndices: [],
            instructionData: new Uint8Array([]),
        });
    });

    it('only reads the number of bytes specified by `numInstructionDataBytes`', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 0,
            numInstructionDataBytes: 2,
        });
        const bytes = new Uint8Array([
            1,
            2, // data bytes (2 bytes)
            3, // additional byte that should not be read as data
        ]);
        const expected: InstructionPayload = {
            instructionAccountIndices: [],
            instructionData: new Uint8Array([1, 2]),
        };
        expect(decoder.decode(bytes)).toEqual(expected);
    });

    it('only reads the number of account indices specified by `numInstructionAccounts`', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 2,
            numInstructionDataBytes: 0,
        });
        const bytes = new Uint8Array([
            2,
            3, // account indices (2 bytes)
            4, // additional byte that should not be read as an account index
        ]);
        const expected: InstructionPayload = {
            instructionAccountIndices: [2, 3],
            instructionData: new Uint8Array([]),
        };
        expect(decoder.decode(bytes)).toEqual(expected);
    });
});
