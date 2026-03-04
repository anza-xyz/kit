import { createDecoder, createEncoder, VariableSizeDecoder, VariableSizeEncoder } from '@solana/codecs-core';
import { getU32Decoder, getU32Encoder, getU64Decoder, getU64Encoder } from '@solana/codecs-numbers';
import { SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS, SolanaError } from '@solana/errors';

import { CompiledTransactionConfigValue } from '../../compile/v1/config';

/**
 * Encode a {@link TransactionMessageConfig} into a variable length byte array, where the fields set are encoded based on their data size.
 * @returns An Encoder for {@link TransactionMessageConfig}
 */
export function getConfigValuesEncoder(): VariableSizeEncoder<CompiledTransactionConfigValue[]> {
    return createEncoder({
        getSizeFromValue(configValues) {
            return configValues.reduce((size, configValue) => {
                return size + (configValue.kind === 'u32' ? 4 : 8);
            }, 0);
        },
        write(configValues, bytes, offset) {
            let nextOffset = offset;
            const u32Encoder = getU32Encoder();
            const u64Encoder = getU64Encoder();
            for (const configValue of configValues) {
                if (configValue.kind === 'u32') {
                    nextOffset = u32Encoder.write(configValue.value, bytes, nextOffset);
                } else {
                    nextOffset = u64Encoder.write(configValue.value, bytes, nextOffset);
                }
            }
            return nextOffset;
        },
    });
}

const PRIORITY_FEE_LAMPORTS_BIT_MASK = 0b11;
const COMPUTE_UNIT_LIMIT_BIT_MASK = 0b100;
const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK = 0b1000;
const HEAP_SIZE_BIT_MASK = 0b10000;

/**
 * Decode a {@link TransactionMessageConfig} from a byte array of values, using the provided mask.
 * @param mask A mask indicating which fields are set
 * @returns A Decoder for {@link TransactionMessageConfig}
 */
export function getConfigValuesDecoder(mask: number): VariableSizeDecoder<CompiledTransactionConfigValue[]> {
    // bits 0 and 1 must both be set or both be unset
    const priorityFeeBits = mask & PRIORITY_FEE_LAMPORTS_BIT_MASK;
    if (priorityFeeBits === 0b01 || priorityFeeBits === 0b10) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS, { mask });
    }
    const hasPriorityFee = priorityFeeBits === PRIORITY_FEE_LAMPORTS_BIT_MASK;

    // the rest are just checking a single bit
    const hasComputeUnitLimit = (mask & COMPUTE_UNIT_LIMIT_BIT_MASK) !== 0;
    const hasLoadedAccountsDataSizeLimit = (mask & LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK) !== 0;
    const hasHeapSize = (mask & HEAP_SIZE_BIT_MASK) !== 0;

    const u32Decoder = getU32Decoder();
    const u64Decoder = getU64Decoder();

    return createDecoder({
        read(bytes, offset) {
            let nextOffset = offset;
            const configValues: CompiledTransactionConfigValue[] = [];

            if (hasPriorityFee) {
                const [value, next] = u64Decoder.read(bytes, nextOffset);
                configValues.push({ kind: 'u64', value });
                nextOffset = next;
            }
            if (hasComputeUnitLimit) {
                const [value, next] = u32Decoder.read(bytes, nextOffset);
                configValues.push({ kind: 'u32', value: Number(value) });
                nextOffset = next;
            }
            if (hasLoadedAccountsDataSizeLimit) {
                const [value, next] = u32Decoder.read(bytes, nextOffset);
                configValues.push({ kind: 'u32', value: Number(value) });
                nextOffset = next;
            }
            if (hasHeapSize) {
                const [value, next] = u32Decoder.read(bytes, nextOffset);
                configValues.push({ kind: 'u32', value: Number(value) });
                nextOffset = next;
            }

            return [configValues, nextOffset];
        },
    });
}
