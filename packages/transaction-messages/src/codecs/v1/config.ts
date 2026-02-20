import {
    createDecoder,
    createEncoder,
    FixedSizeEncoder,
    transformEncoder,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getU32Decoder, getU32Encoder, getU64Decoder, getU64Encoder } from '@solana/codecs-numbers';
import { SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS, SolanaError } from '@solana/errors';

import { TransactionConfig } from '../../transaction-config';

const PRIORITY_FEE_LAMPORTS_BIT_MASK = 0b11;
const COMPUTE_UNIT_LIMIT_BIT_MASK = 0b100;
const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK = 0b1000;
const HEAP_SIZE_BIT_MASK = 0b10000;

/**
 * Encode a {@link TransactionMessageConfig} into a 4 byte mask, where the lowest bits indicate which fields are set
 * @returns An Encoder for {@link TransactionMessageConfig}
 */
export function getTransactionConfigMaskEncoder(): FixedSizeEncoder<TransactionConfig, 4> {
    return transformEncoder(getU32Encoder(), config => {
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
    });
}

/**
 * Encode a {@link TransactionMessageConfig} into a variable length byte array, where the fields set are encoded based on their data size.
 * @returns An Encoder for {@link TransactionMessageConfig}
 */
export function getTransactionConfigValuesEncoder(): VariableSizeEncoder<TransactionConfig> {
    return createEncoder<TransactionConfig>({
        getSizeFromValue(config) {
            let size = 0;
            // Lamports is 8 bytes, the rest are 4 bytes each
            if (config.priorityFeeLamports !== undefined) size += 8;
            if (config.computeUnitLimit !== undefined) size += 4;
            if (config.loadedAccountsDataSizeLimit !== undefined) size += 4;
            if (config.heapSize !== undefined) size += 4;
            return size;
        },
        write(config, bytes, offset) {
            let nextOffset = offset;
            if (config.priorityFeeLamports !== undefined) {
                nextOffset = getU64Encoder().write(config.priorityFeeLamports, bytes, nextOffset);
            }
            if (config.computeUnitLimit !== undefined) {
                nextOffset = getU32Encoder().write(BigInt(config.computeUnitLimit), bytes, nextOffset);
            }
            if (config.loadedAccountsDataSizeLimit !== undefined) {
                nextOffset = getU32Encoder().write(BigInt(config.loadedAccountsDataSizeLimit), bytes, nextOffset);
            }
            if (config.heapSize !== undefined) {
                nextOffset = getU32Encoder().write(BigInt(config.heapSize), bytes, nextOffset);
            }
            return nextOffset;
        },
    });
}

/**
 * Decode a {@link TransactionMessageConfig} from a byte array of values, using the provided mask.
 * @param mask A mask indicating which fields are set
 * @returns A Decoder for {@link TransactionMessageConfig}
 */
export function getConfigValuesDecoder(mask: number): VariableSizeDecoder<TransactionConfig> {
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

    return createDecoder({
        read(bytes, offset) {
            let nextOffset = offset;
            const config: TransactionConfig = {};

            if (hasPriorityFee) {
                [config.priorityFeeLamports, nextOffset] = getU64Decoder().read(bytes, nextOffset);
            }
            if (hasComputeUnitLimit) {
                const [value, next] = getU32Decoder().read(bytes, nextOffset);
                config.computeUnitLimit = Number(value);
                nextOffset = next;
            }
            if (hasLoadedAccountsDataSizeLimit) {
                const [value, next] = getU32Decoder().read(bytes, nextOffset);
                config.loadedAccountsDataSizeLimit = Number(value);
                nextOffset = next;
            }
            if (hasHeapSize) {
                const [value, next] = getU32Decoder().read(bytes, nextOffset);
                config.heapSize = Number(value);
                nextOffset = next;
            }

            return [config, nextOffset];
        },
    });
}
