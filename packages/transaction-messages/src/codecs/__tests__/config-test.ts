import { TransactionConfig } from '../../transaction-config';
import { getTransactionConfigMaskEncoder, getTransactionConfigValuesEncoder } from '../config';

describe('getConfigMaskEncoder', () => {
    const encoder = getTransactionConfigMaskEncoder();

    it('should encode a mask with all values unset correctly', () => {
        const config: TransactionConfig = {};
        const encoded = encoder.encode(config);

        // All bits 0, the lowest 5 are our config bits
        const expectedFirstByte = 0b00000000;
        expect(encoded).toEqual(new Uint8Array([expectedFirstByte, 0, 0, 0]));
    });

    it('should encode a mask with all values set correctly', () => {
        const config: TransactionConfig = {
            computeUnitLimit: 100,
            heapSize: 100,
            loadedAccountsDataSizeLimit: 100,
            priorityFeeLamports: 100n,
        };
        const encoded = encoder.encode(config);

        // Lowest 5 bits set to 1, rest are 0
        // Followed by 3 bytes of 0 for padding to 4 bytes total
        const expectedFirstByte = 0b00011111;
        expect(encoded).toEqual(new Uint8Array([expectedFirstByte, 0, 0, 0]));
    });

    it('should encode a mask with just priority fee set correctly', () => {
        const config: TransactionConfig = {
            priorityFeeLamports: 100n,
        };
        const encoded = encoder.encode(config);

        // Lowest two bits set to 1, rest are 0
        // Followed by 3 bytes of 0 for padding to 4 bytes total
        const expectedFirstByte = 0b00000011;
        expect(encoded).toEqual(new Uint8Array([expectedFirstByte, 0, 0, 0]));
    });

    it('should encode a mask with just compute unit limit set correctly', () => {
        const config: TransactionConfig = {
            computeUnitLimit: 100,
        };
        const encoded = encoder.encode(config);

        // Third lowest bit set to 1, rest are 0
        // Followed by 3 bytes of 0 for padding to 4 bytes total
        const expectedFirstByte = 0b00000100;
        expect(encoded).toEqual(new Uint8Array([expectedFirstByte, 0, 0, 0]));
    });

    it('should encode a mask with just loaded accounts data size limit set correctly', () => {
        const config: TransactionConfig = {
            loadedAccountsDataSizeLimit: 100,
        };
        const encoded = encoder.encode(config);

        // Fourth lowest bit set to 1, rest are 0
        // Followed by 3 bytes of 0 for padding to 4 bytes total
        const expectedFirstByte = 0b00001000;
        expect(encoded).toEqual(new Uint8Array([expectedFirstByte, 0, 0, 0]));
    });

    it('should encode a mask with just heap size set correctly', () => {
        const config: TransactionConfig = {
            heapSize: 100,
        };
        const encoded = encoder.encode(config);

        // Fifth lowest bit set to 1, rest are 0
        // Followed by 3 bytes of 0 for padding to 4 bytes total
        const expectedFirstByte = 0b00010000;
        expect(encoded).toEqual(new Uint8Array([expectedFirstByte, 0, 0, 0]));
    });

    it('should encode a mask with some values set correctly', () => {
        const config: TransactionConfig = {
            loadedAccountsDataSizeLimit: 100,
            priorityFeeLamports: 100n,
        };
        const encoded = encoder.encode(config);

        // First, second and fourth lowest bits set to 1, rest are 0
        // Followed by 3 bytes of 0 for padding to 4 bytes total
        const expectedFirstByte = 0b00001011;
        expect(encoded).toEqual(new Uint8Array([expectedFirstByte, 0, 0, 0]));
    });
});

describe('getConfigValuesEncoder', () => {
    const encoder = getTransactionConfigValuesEncoder();

    it('should encode to an empty array when no values are set', () => {
        const config: TransactionConfig = {};
        const encoded = encoder.encode(config);
        expect(encoded).toEqual(new Uint8Array([]));
    });

    it('should encode to an array of all values correctly', () => {
        const config: TransactionConfig = {
            computeUnitLimit: 20,
            heapSize: 40,
            loadedAccountsDataSizeLimit: 30,
            priorityFeeLamports: 10n,
        };
        const encoded = encoder.encode(config);
        expect(encoded).toEqual(
            // prettier-ignore
            new Uint8Array([
                // priority fee lamports (8 bytes)
                10, 0, 0, 0, 0, 0, 0, 0,
                // computeUnitLimit (4 bytes)
                20, 0, 0, 0,
                // loadedAccountsDataSizeLimit (4 bytes)
                30, 0, 0, 0,
                // heapSize (4 bytes)
                40, 0, 0, 0
            ]),
        );
    });

    it('should encode to an array of just priority fee correctly', () => {
        const config: TransactionConfig = {
            priorityFeeLamports: 10n,
        };
        const encoded = encoder.encode(config);
        expect(encoded).toEqual(
            // prettier-ignore
            new Uint8Array([
                // priority fee lamports (8 bytes)
                10, 0, 0, 0, 0, 0, 0, 0,
            ]),
        );
    });

    it('should encode a large priority fee value correctly', () => {
        const config: TransactionConfig = {
            priorityFeeLamports: 2n ** 64n - 1n,
        };
        const encoded = encoder.encode(config);
        expect(encoded).toEqual(
            // prettier-ignore
            new Uint8Array([
                // priority fee lamports (8 bytes)
                255, 255, 255, 255, 255, 255, 255, 255,
            ]),
        );
    });

    it('should encode to an array of just compute unit limit correctly', () => {
        const config: TransactionConfig = {
            computeUnitLimit: 20,
        };
        const encoded = encoder.encode(config);
        expect(encoded).toEqual(
            // prettier-ignore
            new Uint8Array([
                // computeUnitLimit (4 bytes)
                20, 0, 0, 0
            ]),
        );
    });

    it('should encode to an array of just loaded accounts data size limit correctly', () => {
        const config: TransactionConfig = {
            loadedAccountsDataSizeLimit: 30,
        };
        const encoded = encoder.encode(config);
        expect(encoded).toEqual(
            // prettier-ignore
            new Uint8Array([
                // loadedAccountsDataSizeLimit (4 bytes)
                30, 0, 0, 0
            ]),
        );
    });

    it('should encode to an array of just heap size correctly', () => {
        const config: TransactionConfig = {
            heapSize: 40,
        };
        const encoded = encoder.encode(config);
        expect(encoded).toEqual(
            // prettier-ignore
            new Uint8Array([
                // heapSize (4 bytes)
                40, 0, 0, 0
            ]),
        );
    });

    it('should encode to an array of some values correctly', () => {
        const config: TransactionConfig = {
            loadedAccountsDataSizeLimit: 30,
            priorityFeeLamports: 10n,
        };
        const encoded = encoder.encode(config);
        expect(encoded).toEqual(
            // prettier-ignore
            new Uint8Array([
                // priorityFeeLamports (8 bytes)
                10, 0, 0, 0, 0, 0, 0, 0,
                // loadedAccountsDataSizeLimit (4 bytes)
                30, 0, 0, 0
            ]),
        );
    });

    it('should encode a large priority fee value correctly with some other values', () => {
        const config: TransactionConfig = {
            computeUnitLimit: 20,
            priorityFeeLamports: 2n ** 64n - 1n,
        };
        const encoded = encoder.encode(config);
        expect(encoded).toEqual(
            // prettier-ignore
            new Uint8Array([
                // priorityFeeLamports (8 bytes)
                255, 255, 255, 255, 255, 255, 255, 255,
                // computeUnitLimit (4 bytes)
                20, 0, 0, 0
            ]),
        );
    });
});
