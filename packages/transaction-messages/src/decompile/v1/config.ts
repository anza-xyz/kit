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

/**
 * Decodes the compiled `configMask` and `configValues` of a version 1 compiled
 * transaction message into a {@link V1TransactionConfig}.
 *
 * Use this to read a v1 transaction's compute budget without decompiling the
 * whole message via {@link decompileTransactionMessage}.
 *
 * @param configMask - The bitmask indicating which config fields are present.
 * @param configValues - The config values, ordered by mask bit.
 * @return The decoded config, containing only the fields present in the mask.
 *
 * @throws {SolanaError} Throws `SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS`
 * if only one of the two priority fee bits is set.
 * @throws {SolanaError} Throws `SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND` if a value's
 * kind does not match the field it is decoded into.
 *
 * @example
 * ```ts
 * const compiledMessage = getCompiledTransactionMessageDecoder().decode(messageBytes);
 * if (compiledMessage.version === 1) {
 *     const { computeUnitLimit, priorityFeeLamports } = decompileTransactionConfig(
 *         compiledMessage.configMask,
 *         compiledMessage.configValues,
 *     );
 * }
 * ```
 */
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
