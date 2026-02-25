import { getCompiledInstructions } from '../../../compile/v0/instructions';
import {
    getInstructionHeaderDecoder,
    getInstructionHeaderEncoder,
    getInstructionPayloadDecoder,
    getInstructionPayloadEncoder,
} from '../instruction';

type CompiledInstruction = ReturnType<typeof getCompiledInstructions>[number];

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

describe('getInstructionPayloadEncoder', () => {
    const encoder = getInstructionPayloadEncoder();

    it('encodes the instruction payload when all fields are defined', () => {
        const instruction: CompiledInstruction = {
            accountIndices: [2, 3],
            data: new Uint8Array([1, 2, 3]),
            programAddressIndex: 1,
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

    it('encodes just the data when `accountIndices` is missing', () => {
        const instruction: CompiledInstruction = {
            data: new Uint8Array([1, 2, 3]),
            programAddressIndex: 1,
        };
        expect(encoder.encode(instruction)).toEqual(
            new Uint8Array([
                1,
                2,
                3, // data bytes (3 bytes)
            ]),
        );
    });

    it('encodes just the account indices when `data` is missing', () => {
        const instruction: CompiledInstruction = {
            accountIndices: [2, 3],
            programAddressIndex: 1,
        };
        expect(encoder.encode(instruction)).toEqual(
            new Uint8Array([
                2,
                3, // account indices (2 bytes)
            ]),
        );
    });

    it('encodes an empty payload when both `accountIndices` and `data` are missing', () => {
        const instruction: CompiledInstruction = {
            programAddressIndex: 1,
        };
        expect(encoder.encode(instruction)).toEqual(new Uint8Array([]));
    });
});

describe('getInstructionHeaderDecoder', () => {
    const decoder = getInstructionHeaderDecoder();

    it('decodes the instruction header when all fields are defined', () => {
        // pretter-ignore
        const encoded = new Uint8Array([
            // programAddressIndex (1 byte)
            1,
            // numInstructionAccounts (1 byte)
            2,
            // numInstructionDataBytes (2 bytes)
            255, 255,
        ]);
        expect(decoder.decode(encoded)).toEqual({
            numInstructionAccounts: 2,
            numInstructionDataBytes: 2 ** 16 - 1,
            programAddressIndex: 1,
        });
    });

    it('decodes to all 0s when all fields are 0', () => {
        const encoded = new Uint8Array(4); // all bytes are 0
        expect(decoder.decode(encoded)).toEqual({
            numInstructionAccounts: 0,
            numInstructionDataBytes: 0,
            programAddressIndex: 0,
        });
    });
});

describe('getInstructionPayloadDecoder', () => {
    it('decodes the instruction payload when all fields are defined', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 2,
            numInstructionDataBytes: 3,
            programAddressIndex: 1,
        });
        expect(
            decoder.decode(
                new Uint8Array([
                    2,
                    3, // account indices (2 bytes)
                    1,
                    2,
                    3, // data bytes (3 bytes)
                ]),
            ),
        ).toEqual({
            accountIndices: [2, 3],
            data: new Uint8Array([1, 2, 3]),
            programAddressIndex: 1,
        });
    });

    it('omits `accountIndices` when `numInstructionAccounts` is 0', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 0,
            numInstructionDataBytes: 3,
            programAddressIndex: 1,
        });
        expect(
            decoder.decode(
                new Uint8Array([
                    1,
                    2,
                    3, // data bytes (3 bytes)
                ]),
            ),
        ).toEqual({
            data: new Uint8Array([1, 2, 3]),
            programAddressIndex: 1,
        });
    });

    it('omits `data` when `numInstructionDataBytes` is 0', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 2,
            numInstructionDataBytes: 0,
            programAddressIndex: 1,
        });
        expect(
            decoder.decode(
                new Uint8Array([
                    2,
                    3, // account indices (2 bytes)
                ]),
            ),
        ).toEqual({
            accountIndices: [2, 3],
            programAddressIndex: 1,
        });
    });

    it('decodes an empty payload when both `numInstructionAccounts` and `numInstructionDataBytes` are 0', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 0,
            numInstructionDataBytes: 0,
            programAddressIndex: 1,
        });
        expect(decoder.decode(new Uint8Array([]))).toEqual({
            programAddressIndex: 1,
        });
    });

    it('only reads the number of bytes specified by `numInstructionDataBytes`', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 0,
            numInstructionDataBytes: 2,
            programAddressIndex: 1,
        });
        expect(
            decoder.decode(
                new Uint8Array([
                    1,
                    2, // data bytes (2 bytes)
                    3, // additional byte that should not be read as data
                ]),
            ),
        ).toEqual({
            data: new Uint8Array([1, 2]),
            programAddressIndex: 1,
        });
    });

    it('only reads the number of account indices specified by `numInstructionAccounts`', () => {
        const decoder = getInstructionPayloadDecoder({
            numInstructionAccounts: 2,
            numInstructionDataBytes: 0,
            programAddressIndex: 1,
        });
        expect(
            decoder.decode(
                new Uint8Array([
                    2,
                    3, // account indices (2 bytes)
                    4, // additional byte that should not be read as an account index
                ]),
            ),
        ).toEqual({
            accountIndices: [2, 3],
            programAddressIndex: 1,
        });
    });
});
