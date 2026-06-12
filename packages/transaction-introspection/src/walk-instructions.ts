import type { CompiledTransactionMessage } from '@solana/transaction-messages';

import { getInnerInstructionsFromMeta, type MetaWithInnerInstructions } from './get-inner-instructions';
import {
    getAccountMetasFromCompiledTransactionMessage,
    getInstructionsFromCompiledTransactionMessageWithMetas,
} from './get-instructions';
import type { LoadedAddresses } from './loaded-addresses';
import type { TracedInstruction } from './types';

/**
 * Returns every instruction in a confirmed transaction as
 * {@link TracedInstruction}s, in the order an explorer displays them: each
 * outer instruction followed immediately by the inner instructions its CPIs
 * produced.
 *
 * Each returned instruction has its account indices resolved to
 * {@link AccountMeta}s and its data exposed as a `ReadonlyUint8Array`
 * (omitted when empty), making it directly usable with the auto-generated
 * `@solana-program/*` `identifyXInstruction` and `parseXInstruction`
 * functions, and with `isInstructionForProgram` from `@solana/instructions`.
 *
 * If `meta` is omitted, only outer instructions are returned. If
 * `loadedAddresses` is omitted, only static accounts are used to resolve
 * indices — pass `meta?.loadedAddresses` for v0 transactions that load
 * accounts from address lookup tables.
 *
 * @example
 * ```ts
 * import { isInstructionForProgram, isInstructionWithData } from '@solana/instructions';
 * import { TOKEN_PROGRAM_ADDRESS, identifyTokenInstruction, TokenInstruction } from '@solana-program/token';
 *
 * const instructions = walkInstructions({ compiledMessage, meta, loadedAddresses });
 * for (const ix of instructions) {
 *     if (isInstructionForProgram(ix, TOKEN_PROGRAM_ADDRESS) &&
 *         isInstructionWithData(ix) &&
 *         identifyTokenInstruction(ix) === TokenInstruction.SyncNative) {
 *         console.log(ix.trace);
 *     }
 * }
 * ```
 */
export function walkInstructions(args: {
    compiledMessage: CompiledTransactionMessage;
    loadedAddresses?: LoadedAddresses | null;
    meta?: MetaWithInnerInstructions | null;
}): TracedInstruction[] {
    const { compiledMessage, loadedAddresses, meta } = args;
    const accountMetas = getAccountMetasFromCompiledTransactionMessage(compiledMessage, loadedAddresses);
    const outerInstructions = getInstructionsFromCompiledTransactionMessageWithMetas(compiledMessage, accountMetas);

    const innerByOuterIndex = new Map<number, TracedInstruction[]>();
    if (meta) {
        for (const inner of getInnerInstructionsFromMeta(meta, accountMetas)) {
            if (inner.trace.kind !== 'inner') continue;
            const group = innerByOuterIndex.get(inner.trace.outerIndex);
            if (group) {
                group.push(inner);
            } else {
                innerByOuterIndex.set(inner.trace.outerIndex, [inner]);
            }
        }
    }

    const result: TracedInstruction[] = [];
    outerInstructions.forEach((instruction, index) => {
        result.push({ ...instruction, trace: { index, kind: 'outer' } });
        const group = innerByOuterIndex.get(index);
        if (group) {
            result.push(...group);
            innerByOuterIndex.delete(index);
        }
    });
    // Inner groups whose index matches no outer instruction can only come
    // from malformed input (e.g. `meta` paired with the wrong message).
    // Append them rather than dropping them so no instruction is ever lost.
    for (const group of innerByOuterIndex.values()) {
        result.push(...group);
    }
    return result;
}
