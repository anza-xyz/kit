import '@solana/test-matchers/toBeFrozenObject';

import {
    setTransactionMessageComputeUnitLimit,
    setTransactionMessageConfig,
    setTransactionMessageHeapSize,
    setTransactionMessageLoadedAccountsDataSizeLimit,
    setTransactionMessagePriorityFeeLamports,
    TransactionConfig,
} from '../transaction-config';
import { TransactionMessage } from '../transaction-message';

const COMPUTE_UNIT_LIMIT_A = 200_000;
const COMPUTE_UNIT_LIMIT_B = 400_000;

const HEAP_SIZE_A = 30_000;
const HEAP_SIZE_B = 50_000;

const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A = 60_000;
const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_B = 100_000;

const PRIORITY_FEE_LAMPORTS_A = 5_000n;
const PRIORITY_FEE_LAMPORTS_B = 10_000n;

const baseTx: TransactionMessage & { version: 1 } = {
    instructions: [],
    version: 1,
};

describe('setTransactionMessageConfig', () => {
    it('sets a complete config on the transaction', () => {
        const config: TransactionConfig = {
            computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
            heapSize: HEAP_SIZE_A,
            loadedAccountsDataSizeLimit: LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
            priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
        };
        const txWithConfig = setTransactionMessageConfig(config, baseTx);
        expect(txWithConfig).toHaveProperty('config', config);
    });

    it('sets a partial config on the transaction', () => {
        const config: TransactionConfig = {
            computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
        };
        const txWithConfig = setTransactionMessageConfig(config, baseTx);
        expect(txWithConfig).toHaveProperty('config', { computeUnitLimit: COMPUTE_UNIT_LIMIT_A });
    });

    it('sets multiple properties at once', () => {
        const config: TransactionConfig = {
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
        const config: TransactionConfig = {
            computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
        };
        const txWithConfig = setTransactionMessageConfig(config, baseTx);
        expect(txWithConfig).toBeFrozenObject();
    });

    it('freezes the config object', () => {
        const config: TransactionConfig = {
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
            const config: TransactionConfig = {
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
            const config: TransactionConfig = {
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
            const newConfig: TransactionConfig = {
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
            const newConfig: TransactionConfig = {
                loadedAccountsDataSizeLimit: LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
            };
            const txWithMergedConfig = setTransactionMessageConfig(newConfig, txWithConfig);
            expect(txWithMergedConfig.config).toHaveProperty('computeUnitLimit', COMPUTE_UNIT_LIMIT_A);
            expect(txWithMergedConfig.config).toHaveProperty('heapSize', HEAP_SIZE_A);
        });

        it('overwrites existing config properties with new values', () => {
            const newConfig: TransactionConfig = {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_B,
            };
            const txWithUpdatedConfig = setTransactionMessageConfig(newConfig, txWithConfig);
            expect(txWithUpdatedConfig.config).toHaveProperty('computeUnitLimit', COMPUTE_UNIT_LIMIT_B);
        });

        it('returns the same reference when setting identical config', () => {
            const sameConfig: TransactionConfig = {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
            };
            const txWithSameConfig = setTransactionMessageConfig(sameConfig, txWithConfig);
            expect(txWithSameConfig).toBe(txWithConfig);
        });

        it('returns a new reference when setting different config', () => {
            const differentConfig: TransactionConfig = {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_B,
            };
            const txWithDifferentConfig = setTransactionMessageConfig(differentConfig, txWithConfig);
            expect(txWithDifferentConfig).not.toBe(txWithConfig);
        });

        it('removes config when overwriting all values with undefined', () => {
            const undefinedConfig: TransactionConfig = {
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

describe('setTransactionMessageComputeUnitLimit', () => {
    it('sets the compute unit limit on the transaction', () => {
        const txWithLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
        expect(txWithLimit).toHaveProperty('config', { computeUnitLimit: COMPUTE_UNIT_LIMIT_A });
    });

    it('freezes the transaction object', () => {
        const txWithLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
        expect(txWithLimit).toBeFrozenObject();
    });

    it('freezes the config object', () => {
        const txWithLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
        expect(txWithLimit.config).toBeFrozenObject();
    });

    describe('given a transaction with an existing config', () => {
        const txWithConfig = {
            ...baseTx,
            config: {
                heapSize: HEAP_SIZE_A,
                priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
            },
        };

        it('sets the compute unit limit while preserving other config properties', () => {
            const txWithLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, txWithConfig);
            expect(txWithLimit.config).toMatchObject({
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
                priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
            });
        });

        it('returns the same reference when setting the same compute unit limit', () => {
            const txWithLimitA = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
            const txWithSameLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, txWithLimitA);
            expect(txWithLimitA).toBe(txWithSameLimit);
        });

        it('returns a new reference when setting a different compute unit limit', () => {
            const txWithLimitA = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
            const txWithLimitB = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_B, txWithLimitA);
            expect(txWithLimitA).not.toBe(txWithLimitB);
            expect(txWithLimitB.config).toHaveProperty('computeUnitLimit', COMPUTE_UNIT_LIMIT_B);
        });
    });

    describe('empty config normalization', () => {
        it('removes config when setting to undefined as only property', () => {
            const txWithLimit = setTransactionMessageComputeUnitLimit(COMPUTE_UNIT_LIMIT_A, baseTx);
            const txWithoutConfig = setTransactionMessageComputeUnitLimit(undefined, txWithLimit);
            expect(txWithoutConfig).not.toHaveProperty('config');
        });

        it('preserves config when setting to undefined with other properties present', () => {
            const txWithConfig = {
                ...baseTx,
                config: {
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    heapSize: HEAP_SIZE_A,
                },
            };
            const txWithoutLimit = setTransactionMessageComputeUnitLimit(undefined, txWithConfig);
            expect(txWithoutLimit).toHaveProperty('config', {
                computeUnitLimit: undefined,
                heapSize: HEAP_SIZE_A,
            });
        });
    });
});

describe('setTransactionMessageHeapSize', () => {
    it('sets the heap size on the transaction', () => {
        const txWithHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
        expect(txWithHeapSize).toHaveProperty('config', { heapSize: HEAP_SIZE_A });
    });

    it('freezes the transaction object', () => {
        const txWithHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
        expect(txWithHeapSize).toBeFrozenObject();
    });

    it('freezes the config object', () => {
        const txWithHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
        expect(txWithHeapSize.config).toBeFrozenObject();
    });

    describe('given a transaction with an existing config', () => {
        const txWithConfig = {
            ...baseTx,
            config: {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
            },
        };

        it('sets the heap size while preserving other config properties', () => {
            const txWithHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, txWithConfig);
            expect(txWithHeapSize.config).toMatchObject({
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
                priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
            });
        });

        it('returns the same reference when setting the same heap size', () => {
            const txWithHeapSizeA = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
            const txWithSameHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, txWithHeapSizeA);
            expect(txWithHeapSizeA).toBe(txWithSameHeapSize);
        });

        it('returns a new reference when setting a different heap size', () => {
            const txWithHeapSizeA = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
            const txWithHeapSizeB = setTransactionMessageHeapSize(HEAP_SIZE_B, txWithHeapSizeA);
            expect(txWithHeapSizeA).not.toBe(txWithHeapSizeB);
            expect(txWithHeapSizeB.config).toHaveProperty('heapSize', HEAP_SIZE_B);
        });
    });

    describe('empty config normalization', () => {
        it('removes config when setting to undefined as only property', () => {
            const txWithHeapSize = setTransactionMessageHeapSize(HEAP_SIZE_A, baseTx);
            const txWithoutConfig = setTransactionMessageHeapSize(undefined, txWithHeapSize);
            expect(txWithoutConfig).not.toHaveProperty('config');
        });

        it('preserves config when setting to undefined with other properties present', () => {
            const txWithConfig = {
                ...baseTx,
                config: {
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    heapSize: HEAP_SIZE_A,
                },
            };
            const txWithoutHeapSize = setTransactionMessageHeapSize(undefined, txWithConfig);
            expect(txWithoutHeapSize).toHaveProperty('config', {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: undefined,
            });
        });
    });
});

describe('setTransactionMessageLoadedAccountsDataSizeLimit', () => {
    it('sets the loaded accounts data size limit on the transaction', () => {
        const txWithLimit = setTransactionMessageLoadedAccountsDataSizeLimit(LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A, baseTx);
        expect(txWithLimit).toHaveProperty('config', {
            loadedAccountsDataSizeLimit: LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
        });
    });

    it('freezes the transaction object', () => {
        const txWithLimit = setTransactionMessageLoadedAccountsDataSizeLimit(LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A, baseTx);
        expect(txWithLimit).toBeFrozenObject();
    });

    it('freezes the config object', () => {
        const txWithLimit = setTransactionMessageLoadedAccountsDataSizeLimit(LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A, baseTx);
        expect(txWithLimit.config).toBeFrozenObject();
    });

    describe('given a transaction with an existing config', () => {
        const txWithConfig = {
            ...baseTx,
            config: {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
            },
        };

        it('sets the loaded accounts data size limit while preserving other config properties', () => {
            const txWithLimit = setTransactionMessageLoadedAccountsDataSizeLimit(
                LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                txWithConfig,
            );
            expect(txWithLimit.config).toMatchObject({
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
                loadedAccountsDataSizeLimit: LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
            });
        });

        it('returns the same reference when setting the same loaded accounts data size limit', () => {
            const txWithLimitA = setTransactionMessageLoadedAccountsDataSizeLimit(
                LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                baseTx,
            );
            const txWithSameLimit = setTransactionMessageLoadedAccountsDataSizeLimit(
                LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                txWithLimitA,
            );
            expect(txWithLimitA).toBe(txWithSameLimit);
        });

        it('returns a new reference when setting a different loaded accounts data size limit', () => {
            const txWithLimitA = setTransactionMessageLoadedAccountsDataSizeLimit(
                LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                baseTx,
            );
            const txWithLimitB = setTransactionMessageLoadedAccountsDataSizeLimit(
                LOADED_ACCOUNTS_DATA_SIZE_LIMIT_B,
                txWithLimitA,
            );
            expect(txWithLimitA).not.toBe(txWithLimitB);
            expect(txWithLimitB.config).toHaveProperty(
                'loadedAccountsDataSizeLimit',
                LOADED_ACCOUNTS_DATA_SIZE_LIMIT_B,
            );
        });
    });

    describe('empty config normalization', () => {
        it('removes config when setting to undefined as only property', () => {
            const txWithLimit = setTransactionMessageLoadedAccountsDataSizeLimit(
                LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                baseTx,
            );
            const txWithoutConfig = setTransactionMessageLoadedAccountsDataSizeLimit(undefined, txWithLimit);
            expect(txWithoutConfig).not.toHaveProperty('config');
        });

        it('preserves config when setting to undefined with other properties present', () => {
            const txWithConfig = {
                ...baseTx,
                config: {
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    loadedAccountsDataSizeLimit: LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                },
            };
            const txWithoutLimit = setTransactionMessageLoadedAccountsDataSizeLimit(undefined, txWithConfig);
            expect(txWithoutLimit).toHaveProperty('config', {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                loadedAccountsDataSizeLimit: undefined,
            });
        });
    });
});

describe('setTransactionMessagePriorityFeeLamports', () => {
    it('sets the priority fee lamports on the transaction', () => {
        const txWithFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
        expect(txWithFee).toHaveProperty('config', { priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A });
    });

    it('freezes the transaction object', () => {
        const txWithFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
        expect(txWithFee).toBeFrozenObject();
    });

    it('freezes the config object', () => {
        const txWithFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
        expect(txWithFee.config).toBeFrozenObject();
    });

    describe('given a transaction with an existing config', () => {
        const txWithConfig = {
            ...baseTx,
            config: {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
            },
        };

        it('sets the priority fee lamports while preserving other config properties', () => {
            const txWithFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, txWithConfig);
            expect(txWithFee.config).toMatchObject({
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                heapSize: HEAP_SIZE_A,
                priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
            });
        });

        it('returns the same reference when setting the same priority fee lamports', () => {
            const txWithFeeA = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
            const txWithSameFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, txWithFeeA);
            expect(txWithFeeA).toBe(txWithSameFee);
        });

        it('returns a new reference when setting different priority fee lamports', () => {
            const txWithFeeA = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
            const txWithFeeB = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_B, txWithFeeA);
            expect(txWithFeeA).not.toBe(txWithFeeB);
            expect(txWithFeeB.config).toHaveProperty('priorityFeeLamports', PRIORITY_FEE_LAMPORTS_B);
        });
    });

    describe('empty config normalization', () => {
        it('removes config when setting to undefined as only property', () => {
            const txWithFee = setTransactionMessagePriorityFeeLamports(PRIORITY_FEE_LAMPORTS_A, baseTx);
            const txWithoutConfig = setTransactionMessagePriorityFeeLamports(undefined, txWithFee);
            expect(txWithoutConfig).not.toHaveProperty('config');
        });

        it('preserves config when setting to undefined with other properties present', () => {
            const txWithConfig = {
                ...baseTx,
                config: {
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    priorityFeeLamports: PRIORITY_FEE_LAMPORTS_A,
                },
            };
            const txWithoutFee = setTransactionMessagePriorityFeeLamports(undefined, txWithConfig);
            expect(txWithoutFee).toHaveProperty('config', {
                computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                priorityFeeLamports: undefined,
            });
        });
    });
});
