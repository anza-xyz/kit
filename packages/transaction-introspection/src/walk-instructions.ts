import type { CompiledTransactionMessage } from '@solana/transaction-messages';

import type { LoadedAddresses } from './get-all-addresses';
import { getInnerInstructionsFromMeta, type MetaWithInnerInstructions } from './get-inner-instructions';
import {
    getAccountMetasFromCompiledTransactionMessage,
    getInstructionsFromCompiledTransactionMessageWithMetas,
} from './get-instructions';
import type { TracedInstruction } from './types';

/**
 * Returns every instruction in a confirmed transaction — outer first, then
 * inner instructions grouped by their outer-instruction index — as
 * {@link TracedInstruction}s.
 *
 * Each returned instruction has its account indices resolved to
 * {@link AccountMeta}s and its data exposed as a `ReadonlyUint8Array`,
 * making it directly usable with the auto-generated `@solana-program/*`
 * `identifyXInstruction` and `parseXInstruction` functions, and with
 * `isInstructionForProgram` from `@solana/instructions`.
 *
 * If `meta` is omitted, only outer instructions are returned. If
 * `loadedAddresses` is omitted, only static accounts are used to resolve
 * indices — pass `meta?.loadedAddresses` for v0 transactions that load
 * accounts from address lookup tables.
 *
 * @example
 * ```ts
 * import { isInstructionForProgram } from '@solana/instructions';
 * import { TOKEN_PROGRAM_ADDRESS, identifyTokenInstruction, TokenInstruction } from '@solana-program/token';
 *
 * const instructions = walkInstructions({ compiledMessage, meta, loadedAddresses });
 * for (const ix of instructions) {
 *     if (isInstructionForProgram(ix, TOKEN_PROGRAM_ADDRESS) &&
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
    const result: TracedInstruction[] = outerInstructions.map((instruction, index) => ({
        ...instruction,
        trace: { index, kind: 'outer' },
    }));
    if (meta) {
        result.push(...getInnerInstructionsFromMeta(meta, accountMetas));
    }
    return result;
}
