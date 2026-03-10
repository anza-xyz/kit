import { SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND, SolanaError } from '@solana/errors';

import { CompiledTransactionConfigValue } from '../../compile/v1/config';
import {
    transactionConfigMaskHasComputeUnitLimit,
    transactionConfigMaskHasHeapSize,
    transactionConfigMaskHasLoadedAccountsDataSizeLimit,
    transactionConfigMaskHasPriorityFee,
    V1TransactionConfig,
} from '../../v1-transaction-config';

type SupportedConfig = [keyof V1TransactionConfig, 'u32' | 'u64', (mask: number) => boolean];

export function decompileTransactionConfig(
    configMask: number,
    configValues: CompiledTransactionConfigValue[],
): V1TransactionConfig {
    const supportedConfigs: SupportedConfig[] = [
        ['priorityFeeLamports', 'u64', transactionConfigMaskHasPriorityFee],
        ['computeUnitLimit', 'u32', transactionConfigMaskHasComputeUnitLimit],
        ['loadedAccountsDataSizeLimit', 'u32', transactionConfigMaskHasLoadedAccountsDataSizeLimit],
        ['heapSize', 'u32', transactionConfigMaskHasHeapSize],
    ];

    const [config] = supportedConfigs.reduce(
        ([acc, index], [name, kind, predicate]) => {
            if (!predicate(configMask)) return [acc, index];
            const configValue = configValues[index];
            if (configValue.kind !== kind) {
                throw new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND, {
                    actualKind: configValue.kind,
                    configName: name,
                    expectedKind: kind,
                });
            }
            return [{ ...acc, [name]: configValue.value }, index + 1];
        },
        [{}, 0] as [V1TransactionConfig, number],
    );

    return config;
}
