import { getBase58Encoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_ACCOUNT_INDEX_OUT_OF_RANGE,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
    SolanaError,
} from '@solana/errors';
import type { AccountMeta } from '@solana/instructions';
import type { GetTransactionApiResponseBase64 } from '@solana/rpc-api';

import type { TracedInstruction } from './types';

/**
 * The shape of an inner-instructions group as returned by the JSON-RPC
 * `getTransaction` endpoint when not using `jsonParsed` encoding. Derived
 * from `@solana/rpc-api` via indexed access so the two stay in sync.
 */
type RpcInnerInstructionsGroup = NonNullable<
    NonNullable<GetTransactionApiResponseBase64<0>['meta']>['innerInstructions']
>[number];

/**
 * The minimum shape of `getTransaction`'s `meta` field that this helper
 * needs. Accepting a structural type keeps callers free to pass the full
 * RPC response without coupling to a specific overload.
 *
 * @example
 * ```ts
 * const inner = getInnerInstructionsFromMeta(rpcResponse.meta, accountMetas);
 * ```
 */
export type MetaWithInnerInstructions = Readonly<{
    innerInstructions?: readonly RpcInnerInstructionsGroup[] | null;
}>;

/**
 * Returns the inner instructions in a `getTransaction` response as
 * {@link TracedInstruction}s.
 *
 * The RPC returns inner instructions in a different shape from the wire
 * format: indices reference the same flat account list as the outer
 * instructions, but `data` is a base58-encoded string. This helper decodes
 * the data, resolves the indices against the supplied {@link AccountMeta}
 * list, and tags each instruction with an `inner` trace.
 *
 * Throws if any `programIdIndex` or account index falls outside the
 * supplied `accountMetas` list.
 *
 * @example
 * ```ts
 * const accountMetas = getAccountMetasFromCompiledTransactionMessage(compiledMessage, loadedAddresses);
 * const inner = getInnerInstructionsFromMeta(rpcResponse.meta, accountMetas);
 * ```
 */
export function getInnerInstructionsFromMeta(
    meta: MetaWithInnerInstructions,
    accountMetas: readonly AccountMeta[],
): TracedInstruction[] {
    if (!meta.innerInstructions) return [];
    const base58 = getBase58Encoder();
    const result: TracedInstruction[] = [];
    for (const group of meta.innerInstructions) {
        for (let innerIndex = 0; innerIndex < group.instructions.length; innerIndex++) {
            const ix = group.instructions[innerIndex];
            const programMeta = accountMetas[ix.programIdIndex];
            if (!programMeta) {
                throw new SolanaError(
                    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
                    { index: ix.programIdIndex },
                );
            }
            const accounts: AccountMeta[] = ix.accounts.map(i => {
                const accountMeta = accountMetas[i];
                if (!accountMeta) {
                    throw new SolanaError(
                        SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_ACCOUNT_INDEX_OUT_OF_RANGE,
                        { index: i },
                    );
                }
                return accountMeta;
            });
            const data = base58.encode(ix.data);
            result.push({
                ...(accounts.length ? { accounts } : null),
                ...(data.byteLength ? { data } : null),
                programAddress: programMeta.address,
                trace: {
                    innerIndex,
                    kind: 'inner',
                    outerIndex: group.index,
                    ...(ix.stackHeight != null ? { stackHeight: ix.stackHeight } : {}),
                },
            });
        }
    }
    return result;
}
