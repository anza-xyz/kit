import { transformDecoder, VariableSizeDecoder, VariableSizeEncoder } from '@solana/codecs-core';
import {
    getArrayEncoder,
    getPatternMatchEncoder,
    getStructEncoder,
    getTupleDecoder,
    getUnitDecoder,
} from '@solana/codecs-data-structures';
import { getU32Decoder, getU32Encoder, getU64Decoder, getU64Encoder } from '@solana/codecs-numbers';

import { CompiledTransactionConfigValue } from '../../compile/v1/config';
import {
    transactionConfigMaskHasComputeUnitLimit,
    transactionConfigMaskHasHeapSize,
    transactionConfigMaskHasLoadedAccountsDataSizeLimit,
    transactionConfigMaskHasPriorityFee,
} from '../../v1-transaction-config';

/* TODO issue #1143 - we have a type error on `getPatternMatchEncoder` where it incorrectly
 * types the return as FixedSizeEncoder when used with differently sized FixedSizEencoder
 * inputs. For now we cast to VariableSizeEncoder, which is what the underlying union codec
 * actually returns.
 */
function getCompiledTransactionConfigValueEncoder(): VariableSizeEncoder<CompiledTransactionConfigValue> {
    return getPatternMatchEncoder<CompiledTransactionConfigValue>([
        [value => value.kind === 'u32', getStructEncoder([['value', getU32Encoder()]])],
        [value => value.kind === 'u64', getStructEncoder([['value', getU64Encoder()]])],
    ]) as unknown as VariableSizeEncoder<CompiledTransactionConfigValue>;
}

/**
 * Encode a {@link TransactionMessageConfig} into a variable length byte array, where the fields set are encoded based on their data size.
 * @returns An Encoder for {@link TransactionMessageConfig}
 */
export function getCompiledTransactionConfigValuesEncoder(): VariableSizeEncoder<CompiledTransactionConfigValue[]> {
    return getArrayEncoder(getCompiledTransactionConfigValueEncoder(), { size: 'remainder' });
}

/**
 * Decode a {@link TransactionMessageConfig} from a byte array of values, using the provided mask.
 * @param mask A mask indicating which fields are set
 * @returns A Decoder for {@link TransactionMessageConfig}
 */
export function getCompiledTransactionConfigValuesDecoder(
    mask: number,
): VariableSizeDecoder<CompiledTransactionConfigValue[]> {
    const hasPriorityFee = transactionConfigMaskHasPriorityFee(mask);
    const hasComputeUnitLimit = transactionConfigMaskHasComputeUnitLimit(mask);
    const hasLoadedAccountsDataSizeLimit = transactionConfigMaskHasLoadedAccountsDataSizeLimit(mask);
    const hasHeapSize = transactionConfigMaskHasHeapSize(mask);

    const u32Decoder = transformDecoder(getU32Decoder(), value => ({ kind: 'u32', value }));
    const u64Decoder = transformDecoder(getU64Decoder(), value => ({ kind: 'u64', value }));
    const unitDecoder = getUnitDecoder();

    return transformDecoder(
        getTupleDecoder([
            hasPriorityFee ? u64Decoder : unitDecoder,
            hasComputeUnitLimit ? u32Decoder : unitDecoder,
            hasLoadedAccountsDataSizeLimit ? u32Decoder : unitDecoder,
            hasHeapSize ? u32Decoder : unitDecoder,
        ]),
        arr => arr.filter(Boolean) as CompiledTransactionConfigValue[],
    );
}
