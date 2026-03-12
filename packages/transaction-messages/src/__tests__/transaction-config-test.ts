import '@solana/test-matchers/toBeFrozenObject';

import { TransactionMessage } from '../transaction-message';
import { setTransactionMessageConfig, V1TransactionConfig } from '../v1-transaction-config';

const COMPUTE_UNIT_LIMIT_A = 200_000;
const COMPUTE_UNIT_LIMIT_B = 400_000;

const HEAP_SIZE_A = 30_000;
const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A = 60_000;
const PRIORITY_FEE_LAMPORTS_A = 5_000n;

const baseTx: TransactionMessage & { version: 1 } = {
    instructions: [],
    version: 1,
};

describe('setTransactionMessageConfig', () => {
    it('sets a complete config on the transaction', () => {
        const config: V1TransactionConfig = {
            computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
            heapSize: HEAP_SIZE_A,
            loadedAccountsDataSizeLimit: LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
            priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
        };
        const txWithConfig = setTransactionMessageConfig(config, baseTx);
        expect(txWithConfig).toHaveProperty('config', config);
    });

    it('sets a partial config on the transaction', () => {
        const config: V1TransactionConfig = {
            computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
        };
        const txWithConfig = setTransactionMessageConfig(config, baseTx);
        expect(txWithConfig).toHaveProperty('config', { computeUnitLimit: COMPUTE_UNIT_LIMIT_A });
    });

    it('sets multiple properties at once', () => {
        const config: V1TransactionConfig = {
            computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
            priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
        };
        const txWithConfig = setTransactionMessageConfig(config, baseTx);
        expect(txWithConfig.config).toMatchObject({
            computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
            priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
        });
    });

    it('freezes the transaction object', () => {
        const config: V1TransactionConfig = {
            computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
        };
        const txWithConfig = setTransactionMessageConfig(config, baseTx);
        expect(txWithConfig).toBeFrozenObject();
    });

    it('freezes the config object', () => {
        const config: V1TransactionConfig = {
            computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
        };
        const txWithConfig = setTransactionMessageConfig(config, baseTx);
        expect(txWithConfig.config).toBeFrozenObject();
    });

    describe('empty config normalization', () => {
        it('removes config when setting empty object', () => {
            const txWithConfig = setTransactionMessageConfig({}, baseTx);
            expect(txWithConfig).not.toHaveProperty('config');
        });

        it('removes config when all properties are undefined', () => {
            const config: V1TransactionConfig = {
                computeUnitLimit: undefined,
                heapSize: undefined,
                loadedAccountsDataSizeLimit: undefined,
                priorityFeeLamports: undefined,
            };
            const txWithConfig = setTransactionMessageConfig(config, baseTx);
            expect(txWithConfig).not.toHaveProperty('config');
        });

        it('returns same reference when config stays absent', () => {
            const txWithEmptyConfig = setTransactionMessageConfig({}, baseTx);
            expect(txWithEmptyConfig).toBe(baseTx);
        });
    });

    describe('given a transaction with no existing config', () => {
        it('sets a new config object', () => {
            const config: V1TransactionConfig = {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
            };
            const txWithConfig = setTransactionMessageConfig(config, baseTx);
            expect(txWithConfig.config).toMatchObject(config);
        });
    });

    describe('given a transaction with an existing config', () => {
        const txWithConfig = {
            ...baseTx,
            config: {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
            },
        };

        it('merges new config properties with existing ones', () => {
            const newConfig: V1TransactionConfig = {
                priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
            };
            const txWithMergedConfig = setTransactionMessageConfig(newConfig, txWithConfig);
            expect(txWithMergedConfig.config).toMatchObject({
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
                priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
            });
        });

        it('preserves existing config properties not being updated', () => {
            const newConfig: V1TransactionConfig = {
                loadedAccountsDataSizeLimit: LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
            };
            const txWithMergedConfig = setTransactionMessageConfig(newConfig, txWithConfig);
            expect(txWithMergedConfig.config).toHaveProperty('computeUnitLimit', COMPUTE_UNIT_LIMIT_A);
            expect(txWithMergedConfig.config).toHaveProperty('heapSize', HEAP_SIZE_A);
        });

        it('overwrites existing config properties with new values', () => {
            const newConfig: V1TransactionConfig = {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_B,
            };
            const txWithUpdatedConfig = setTransactionMessageConfig(newConfig, txWithConfig);
            expect(txWithUpdatedConfig.config).toHaveProperty('computeUnitLimit', COMPUTE_UNIT_LIMIT_B);
        });

        it('returns the same reference when setting identical config', () => {
            const sameConfig: V1TransactionConfig = {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
            };
            const txWithSameConfig = setTransactionMessageConfig(sameConfig, txWithConfig);
            expect(txWithSameConfig).toBe(txWithConfig);
        });

        it('returns a new reference when setting different config', () => {
            const differentConfig: V1TransactionConfig = {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_B,
            };
            const txWithDifferentConfig = setTransactionMessageConfig(differentConfig, txWithConfig);
            expect(txWithDifferentConfig).not.toBe(txWithConfig);
        });

        it('removes config when overwriting all values with undefined', () => {
            const undefinedConfig: V1TransactionConfig = {
                computeUnitLimit: undefined,
                heapSize: undefined,
            };
            const txWithoutConfig = setTransactionMessageConfig(undefinedConfig, txWithConfig);
            expect(txWithoutConfig).not.toHaveProperty('config');
        });
    });

    describe('setting undefined values', () => {
        it('can set individual properties to undefined', () => {
            const txWithConfig = setTransactionMessageConfig(
                { computeUnitLimit: COMPUTE_UNIT_LIMIT_A, heapSize: HEAP_SIZE_A },
                baseTx,
            );
            const txWithUndefined = setTransactionMessageConfig({ computeUnitLimit: undefined }, txWithConfig);
            expect(txWithUndefined.config).toHaveProperty('computeUnitLimit', undefined);
            expect(txWithUndefined.config).toHaveProperty('heapSize', HEAP_SIZE_A);
        });

        it('removes config when last property set to undefined', () => {
            const txWithConfig = setTransactionMessageConfig({ computeUnitLimit: COMPUTE_UNIT_LIMIT_A }, baseTx);
            const txWithoutConfig = setTransactionMessageConfig({ computeUnitLimit: undefined }, txWithConfig);
            expect(txWithoutConfig).not.toHaveProperty('config');
        });
    });
});
