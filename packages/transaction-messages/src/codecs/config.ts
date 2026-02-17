import { createEncoder, FixedSizeEncoder, fixEncoderSize, VariableSizeEncoder } from '@solana/codecs-core';
import { getBitArrayEncoder } from '@solana/codecs-data-structures';
import { getU32Encoder, getU64Encoder } from '@solana/codecs-numbers';

import { TransactionMessageConfig } from '../config';

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
