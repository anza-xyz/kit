import {
    TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK,
    TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK,
    TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK,
    TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK,
} from '../../v1-transaction-config';
import { V1TransactionConfig } from '../../v1-transaction-config';

export function getTransactionConfigMask(config: V1TransactionConfig): number {
    let mask = 0;
    // Set the lowest 2 bits for priority fee lamports
    if (config.priorityFeeLamports !== undefined) mask |= TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK;
    // Set the 3rd lowest bit for compute unit limit
    if (config.computeUnitLimit !== undefined) mask |= TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK;
    // Set the 4th lowest bit for loaded accounts data size limit
    if (config.loadedAccountsDataSizeLimit !== undefined)
        mask |= TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK;
    // Set the 5th lowest bit for heap size
    if (config.heapSize !== undefined) mask |= TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK;
    return mask;
}

export type CompiledTransactionConfigValue =
    | {
          kind: 'u32';
          value: number;
      }
    | {
          kind: 'u64';
          value: bigint;
      };

export function getTransactionConfigValues(config: V1TransactionConfig): CompiledTransactionConfigValue[] {
    const values: CompiledTransactionConfigValue[] = [];
    if (config.priorityFeeLamports !== undefined) {
        values.push({ kind: 'u64', value: config.priorityFeeLamports });
    }
    if (config.computeUnitLimit !== undefined) {
        values.push({ kind: 'u32', value: config.computeUnitLimit });
    }
    if (config.loadedAccountsDataSizeLimit !== undefined) {
        values.push({ kind: 'u32', value: config.loadedAccountsDataSizeLimit });
    }
    if (config.heapSize !== undefined) {
        values.push({ kind: 'u32', value: config.heapSize });
    }
    return values;
}
