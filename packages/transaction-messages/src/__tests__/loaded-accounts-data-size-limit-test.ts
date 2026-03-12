import '@solana/test-matchers/toBeFrozenObject';

import { setTransactionMessageLoadedAccountsDataSizeLimit } from '../loaded-accounts-data-size-limit';
import { TransactionMessage } from '../transaction-message';

const COMPUTE_UNIT_LIMIT_A = 200_000;

const HEAP_SIZE_A = 30_000;

const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A = 60_000;
const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_B = 100_000;

const baseTx: TransactionMessage & { version: 1 } = {
    instructions: [],
    version: 1,
};

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
