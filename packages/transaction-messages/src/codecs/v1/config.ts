import { transformDecoder, transformEncoder, VariableSizeDecoder, VariableSizeEncoder } from '@solana/codecs-core';
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

type U32Value = Extract<CompiledTransactionConfigValue, { kind: 'u32' }>;
type U64Value = Extract<CompiledTransactionConfigValue, { kind: 'u64' }>;

/* `getPatternMatchEncoder` correctly infers a variable-size encoder when its branches are
 * fixed-size encoders of *differing* sizes. It cannot do so here, however, because
 * `getStructEncoder` types its `fixedSize` as the broad `number` rather than a literal (`4` vs
 * `8`), so the two branches look like identically-sized fixed encoders and the union widens to a
 * plain `Encoder`. The runtime result is genuinely variable-size, so we cast accordingly. Once
 * `getStructEncoder` preserves literal sizes, this cast can be removed.
 * See https://github.com/anza-xyz/kit/issues/1738
 */
function getCompiledTransactionConfigValueEncoder(): VariableSizeEncoder<CompiledTransactionConfigValue> {
    return getPatternMatchEncoder([
        [
            (value: CompiledTransactionConfigValue) => value.kind === 'u32',
            transformEncoder(getStructEncoder([['value', getU32Encoder()]]), (value: U32Value) => value),
        ],
        [
            (value: CompiledTransactionConfigValue) => value.kind === 'u64',
            transformEncoder(getStructEncoder([['value', getU64Encoder()]]), (value: U64Value) => value),
        ],
    ]) as VariableSizeEncoder<CompiledTransactionConfigValue>;
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
