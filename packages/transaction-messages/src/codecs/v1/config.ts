import { transformDecoder, VariableSizeDecoder, VariableSizeEncoder } from '@solana/codecs-core';
import {
    getArrayEncoder,
    getPatternMatchEncoder,
    getStructEncoder,
    getTupleDecoder,
    getUnitDecoder,
} from '@solana/codecs-data-structures';
import { getU32Decoder, getU32Encoder, getU64Decoder, getU64Encoder } from '@solana/codecs-numbers';
import { SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS, SolanaError } from '@solana/errors';

import { CompiledTransactionConfigValue } from '../../compile/v1/config';

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

const PRIORITY_FEE_LAMPORTS_BIT_MASK = 0b11;
const COMPUTE_UNIT_LIMIT_BIT_MASK = 0b100;
const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK = 0b1000;
const HEAP_SIZE_BIT_MASK = 0b10000;

/**
 * Decode a {@link TransactionMessageConfig} from a byte array of values, using the provided mask.
 * @param mask A mask indicating which fields are set
 * @returns A Decoder for {@link TransactionMessageConfig}
 */
export function getCompiledTransactionConfigValuesDecoder(
    mask: number,
): VariableSizeDecoder<CompiledTransactionConfigValue[]> {
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
