import { TransactionConfig } from '../../../transaction-config';
import { getTransactionConfigMask, getTransactionConfigValues } from '../config';

describe('getTransactionConfigMask', () => {
    it('should return a mask with all values unset correctly', () => {
        const config: TransactionConfig = {};
        const mask = getTransactionConfigMask(config);

        // All bits 0
        expect(mask).toBe(0b00000000);
    });

    it('should return a mask with all values set correctly', () => {
        const config: TransactionConfig = {
            computeUnitLimit: 100,
            heapSize: 100,
            loadedAccountsDataSizeLimit: 100,
            priorityFeeLamports: 100n,
        };
        const mask = getTransactionConfigMask(config);

        // Lowest 5 bits set to 1, rest are 0
        expect(mask).toBe(0b00011111);
    });

    it('should return a mask with just priority fee set correctly', () => {
        const config: TransactionConfig = {
            priorityFeeLamports: 100n,
        };
        const mask = getTransactionConfigMask(config);

        // Lowest two bits set to 1, rest are 0
        expect(mask).toBe(0b00000011);
    });

    it('should return a mask with just compute unit limit set correctly', () => {
        const config: TransactionConfig = {
            computeUnitLimit: 100,
        };
        const mask = getTransactionConfigMask(config);

        // Third lowest bit set to 1, rest are 0
        expect(mask).toBe(0b00000100);
    });

    it('should return a mask with just loaded accounts data size limit set correctly', () => {
        const config: TransactionConfig = {
            loadedAccountsDataSizeLimit: 100,
        };
        const mask = getTransactionConfigMask(config);

        // Fourth lowest bit set to 1, rest are 0
        expect(mask).toBe(0b00001000);
    });

    it('should return a mask with just heap size set correctly', () => {
        const config: TransactionConfig = {
            heapSize: 100,
        };
        const mask = getTransactionConfigMask(config);

        // Fifth lowest bit set to 1, rest are 0
        expect(mask).toBe(0b00010000);
    });

    it('should return a mask with multiple values set correctly', () => {
        const config: TransactionConfig = {
            loadedAccountsDataSizeLimit: 100,
            priorityFeeLamports: 100n,
        };
        const mask = getTransactionConfigMask(config);

        // First, second and fourth lowest bits set to 1, rest are 0
        expect(mask).toBe(0b00001011);
    });
});

describe('getTransactionConfigValues', () => {
    it('should return an empty array when no values are set', () => {
        const config: TransactionConfig = {};
        const values = getTransactionConfigValues(config);
        expect(values).toEqual([]);
    });

    it('should return all values correctly', () => {
        const config: TransactionConfig = {
            computeUnitLimit: 20,
            heapSize: 40,
            loadedAccountsDataSizeLimit: 30,
            priorityFeeLamports: 10n,
        };
        const values = getTransactionConfigValues(config);
        expect(values).toEqual([
            { kind: 'u64', value: 10n },
            { kind: 'u32', value: 20 },
            { kind: 'u32', value: 30 },
            { kind: 'u32', value: 40 },
        ]);
    });

    it('should return just priority fee correctly', () => {
        const config: TransactionConfig = {
            priorityFeeLamports: 10n,
        };
        const values = getTransactionConfigValues(config);
        expect(values).toEqual([{ kind: 'u64', value: 10n }]);
    });

    it('should return a large priority fee value correctly', () => {
        const config: TransactionConfig = {
            priorityFeeLamports: 2n ** 64n - 1n,
        };
        const values = getTransactionConfigValues(config);
        expect(values).toEqual([{ kind: 'u64', value: 2n ** 64n - 1n }]);
    });

    it('should return just compute unit limit correctly', () => {
        const config: TransactionConfig = {
            computeUnitLimit: 20,
        };
        const values = getTransactionConfigValues(config);
        expect(values).toEqual([{ kind: 'u32', value: 20 }]);
    });

    it('should return just loaded accounts data size limit correctly', () => {
        const config: TransactionConfig = {
            loadedAccountsDataSizeLimit: 30,
        };
        const values = getTransactionConfigValues(config);
        expect(values).toEqual([{ kind: 'u32', value: 30 }]);
    });

    it('should return just heap size correctly', () => {
        const config: TransactionConfig = {
            heapSize: 40,
        };
        const values = getTransactionConfigValues(config);
        expect(values).toEqual([{ kind: 'u32', value: 40 }]);
    });

    it('should return multiple values correctly', () => {
        const config: TransactionConfig = {
            loadedAccountsDataSizeLimit: 30,
            priorityFeeLamports: 10n,
        };
        const values = getTransactionConfigValues(config);
        expect(values).toEqual([
            { kind: 'u64', value: 10n },
            { kind: 'u32', value: 30 },
        ]);
    });

    it('should return a large priority fee value correctly with another value', () => {
        const config: TransactionConfig = {
            computeUnitLimit: 20,
            priorityFeeLamports: 2n ** 64n - 1n,
        };
        const values = getTransactionConfigValues(config);
        expect(values).toEqual([
            { kind: 'u64', value: 2n ** 64n - 1n },
            { kind: 'u32', value: 20 },
        ]);
    });
});
