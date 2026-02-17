import {
    createDecoder,
    createEncoder,
    FixedSizeEncoder,
    fixEncoderSize,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getBitArrayEncoder } from '@solana/codecs-data-structures';
import { getU32Decoder, getU32Encoder, getU64Decoder, getU64Encoder } from '@solana/codecs-numbers';
import { SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK, SolanaError } from '@solana/errors';

import { TransactionMessageConfig } from '../config';

/**
 * Encode a {@link TransactionMessageConfig} into a 4 byte mask, where the lowest bits indicate which fields are set
 * @returns An Encoder for {@link TransactionMessageConfig}
 */
export function getConfigMaskEncoder(): FixedSizeEncoder<TransactionMessageConfig, 4> {
    return createEncoder<TransactionMessageConfig, 4>({
        fixedSize: 4,
        write(config, bytes, offset) {
            return fixEncoderSize(getBitArrayEncoder(1, { backward: true }), 4).write(
                [
                    config.priorityFeeLamports !== undefined,
                    config.priorityFeeLamports !== undefined, // duplicate, we set 2 bits for lamports
                    config.computeUnitLimit !== undefined,
                    config.loadedAccountsDataSizeLimit !== undefined,
                    config.heapSize !== undefined,
                ],
                bytes,
                offset,
            );
        },
    });
}

/**
 * Encode a {@link TransactionMessageConfig} into a variable length byte array, where the fields set are encoded based on their data size.
 * @returns An Encoder for {@link TransactionMessageConfig}
 */
export function getConfigValuesEncoder(): VariableSizeEncoder<TransactionMessageConfig> {
    return createEncoder<TransactionMessageConfig>({
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
export function getConfigValuesDecoder(mask: number): VariableSizeDecoder<TransactionMessageConfig> {
    // bits 0 and 1 must both be set or both be unset
    const priorityFeeBits = mask & 0b00000011;
    if (priorityFeeBits === 0b01 || priorityFeeBits === 0b10) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK, { mask });
    }
    const hasPriorityFee = priorityFeeBits === 0b11;

    // the rest are just checking a single bit
    const hasComputeUnitLimit = (mask & 0b00000100) !== 0;
    const hasLoadedAccountsDataSizeLimit = (mask & 0b00001000) !== 0;
    const hasHeapSize = (mask & 0b00010000) !== 0;

    return createDecoder({
        read(bytes, offset) {
            let nextOffset = offset;
            const config: TransactionMessageConfig = {};

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
