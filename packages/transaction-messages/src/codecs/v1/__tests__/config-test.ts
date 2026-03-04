import { SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS, SolanaError } from '@solana/errors';

import { CompiledTransactionConfigValue } from '../../../compile/v1/config';
import { getCompiledTransactionConfigValuesDecoder, getCompiledTransactionConfigValuesEncoder } from '../config';

describe('getTransactionConfigValuesEncoder', () => {
    const encoder = getCompiledTransactionConfigValuesEncoder();

    it('should encode to an empty array when no values are set', () => {
        const config: CompiledTransactionConfigValue[] = [];
        const encoded = encoder.encode(config);
        expect(encoded).toEqual(new Uint8Array([]));
    });

    it('should encode an array of config values correctly', () => {
        const config: CompiledTransactionConfigValue[] = [
            { kind: 'u64', value: 40n },
            { kind: 'u32', value: 30 },
            { kind: 'u32', value: 20 },
            { kind: 'u32', value: 10 },
        ];
        const encoded = encoder.encode(config);
        expect(encoded).toEqual(
            // prettier-ignore
            new Uint8Array([
                // first value (8 bytes)
                40, 0, 0, 0, 0, 0, 0, 0,
                // second value (4 bytes)
                30, 0, 0, 0,
                // third value (4 bytes)
                20, 0, 0, 0,
                // fourth value (4 bytes)
                10, 0, 0, 0
            ]),
        );
    });
});

describe('getTransactionConfigValuesDecoder', () => {
    it('should decode an empty array when no values are set', () => {
        const mask = 0b00000000;
        const decoder = getCompiledTransactionConfigValuesDecoder(mask);
        const decoded = decoder.decode(new Uint8Array([]));
        const expected: CompiledTransactionConfigValue[] = [];
        expect(decoded).toEqual(expected);
    });

    it('should decode all values correctly', () => {
        // Mask with all 5 lowest bits set
        const mask = 0b00011111;
        const decoder = getCompiledTransactionConfigValuesDecoder(mask);
        const decoded = decoder.decode(
            // prettier-ignore
            new Uint8Array([
                // priorityFeeLamports (8 bytes)
                10, 0, 0, 0, 0, 0, 0, 0,
                // computeUnitLimit (4 bytes)
                20, 0, 0, 0,
                // loadedAccountsDataSizeLimit (4 bytes)
                30, 0, 0, 0,
                // heapSize (4 bytes)
                40, 0, 0, 0
            ]),
        );
        const expected: CompiledTransactionConfigValue[] = [
            { kind: 'u64', value: 10n },
            { kind: 'u32', value: 20 },
            { kind: 'u32', value: 30 },
            { kind: 'u32', value: 40 },
        ];
        expect(decoded).toEqual(expected);
    });

    it('should decode just priority fee correctly', () => {
        const mask = 0b00000011;
        const decoder = getCompiledTransactionConfigValuesDecoder(mask);
        const decoded = decoder.decode(
            // prettier-ignore
            new Uint8Array([
                // priorityFeeLamports (8 bytes)
                10, 0, 0, 0, 0, 0, 0, 0,
            ]),
        );
        const expected: CompiledTransactionConfigValue[] = [{ kind: 'u64', value: 10n }];
        expect(decoded).toEqual(expected);
    });

    it('should decode a large priority fee value correctly', () => {
        const mask = 0b00000011;
        const decoder = getCompiledTransactionConfigValuesDecoder(mask);
        const decoded = decoder.decode(
            // prettier-ignore
            new Uint8Array([
                // priorityFeeLamports (8 bytes)
                255, 255, 255, 255, 255, 255, 255, 255,
            ]),
        );
        const expected: CompiledTransactionConfigValue[] = [{ kind: 'u64', value: 2n ** 64n - 1n }];
        expect(decoded).toEqual(expected);
    });

    it('should decode just compute unit limit correctly', () => {
        const mask = 0b00000100;
        const decoder = getCompiledTransactionConfigValuesDecoder(mask);
        const decoded = decoder.decode(
            // prettier-ignore
            new Uint8Array([
                // computeUnitLimit (4 bytes)
                20, 0, 0, 0
            ]),
        );
        const expected: CompiledTransactionConfigValue[] = [{ kind: 'u32', value: 20 }];
        expect(decoded).toEqual(expected);
    });

    it('should decode just loaded accounts data size limit correctly', () => {
        const mask = 0b00001000;
        const decoder = getCompiledTransactionConfigValuesDecoder(mask);
        const decoded = decoder.decode(
            // prettier-ignore
            new Uint8Array([
                // loadedAccountsDataSizeLimit (4 bytes)
                30, 0, 0, 0
            ]),
        );
        const expected: CompiledTransactionConfigValue[] = [{ kind: 'u32', value: 30 }];
        expect(decoded).toEqual(expected);
    });

    it('should decode just heap size correctly', () => {
        const mask = 0b00010000;
        const decoder = getCompiledTransactionConfigValuesDecoder(mask);
        const decoded = decoder.decode(
            // prettier-ignore
            new Uint8Array([
                // heapSize (4 bytes)
                40, 0, 0, 0
            ]),
        );
        const expected: CompiledTransactionConfigValue[] = [{ kind: 'u32', value: 40 }];
        expect(decoded).toEqual(expected);
    });

    it('should decode multiple values correctly', () => {
        const mask = 0b00001011;
        const decoder = getCompiledTransactionConfigValuesDecoder(mask);
        const decoded = decoder.decode(
            // prettier-ignore
            new Uint8Array([
                // priorityFeeLamports (8 bytes)
                10, 0, 0, 0, 0, 0, 0, 0,
                // loadedAccountsDataSizeLimit (4 bytes)
                30, 0, 0, 0
            ]),
        );
        const expected: CompiledTransactionConfigValue[] = [
            { kind: 'u64', value: 10n },
            { kind: 'u32', value: 30 },
        ];
        expect(decoded).toEqual(expected);
    });

    it('should decode a large priority fee value correctly with another value', () => {
        const mask = 0b00000111;
        const decoder = getCompiledTransactionConfigValuesDecoder(mask);
        const decoded = decoder.decode(
            // prettier-ignore
            new Uint8Array([
                // priorityFeeLamports (8 bytes)
                255, 255, 255, 255, 255, 255, 255, 255,
                // computeUnitLimit (4 bytes)
                20, 0, 0, 0
            ]),
        );
        const expected: CompiledTransactionConfigValue[] = [
            { kind: 'u64', value: 2n ** 64n - 1n },
            { kind: 'u32', value: 20 },
        ];
        expect(decoded).toEqual(expected);
    });

    it('should throw an error if only one priority fee bit is set (malformed)', () => {
        // Only bit 0 set - malformed, bits 0 and 1 must match
        const mask = 0b01;
        expect(() => getCompiledTransactionConfigValuesDecoder(mask)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS, { mask }),
        );
    });

    it('should throw an error if only the other priority fee bit is set (malformed)', () => {
        // Only bit 1 set - malformed, bits 0 and 1 must match
        const mask = 0b10;
        expect(() => getCompiledTransactionConfigValuesDecoder(mask)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS, { mask }),
        );
    });
});
