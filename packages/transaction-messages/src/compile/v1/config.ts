import { TransactionConfig } from '../../transaction-config';

const PRIORITY_FEE_LAMPORTS_BIT_MASK = 0b11;
const COMPUTE_UNIT_LIMIT_BIT_MASK = 0b100;
const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK = 0b1000;
const HEAP_SIZE_BIT_MASK = 0b10000;

export function getTransactionConfigMask(config: TransactionConfig): number {
    let mask = 0;
    // Set the lowest 2 bits for priority fee lamports
    if (config.priorityFeeLamports !== undefined) mask |= PRIORITY_FEE_LAMPORTS_BIT_MASK;
    // Set the 3rd lowest bit for compute unit limit
    if (config.computeUnitLimit !== undefined) mask |= COMPUTE_UNIT_LIMIT_BIT_MASK;
    // Set the 4th lowest bit for loaded accounts data size limit
    if (config.loadedAccountsDataSizeLimit !== undefined) mask |= LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK;
    // Set the 5th lowest bit for heap size
    if (config.heapSize !== undefined) mask |= HEAP_SIZE_BIT_MASK;
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

export function getTransactionConfigValues(config: TransactionConfig): CompiledTransactionConfigValue[] {
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
