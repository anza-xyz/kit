import type { Address } from '@solana/addresses';
import type { CompiledTransactionMessage } from '@solana/transaction-messages';

import type { LoadedAddresses } from './get-all-addresses';
import { type MetaWithInnerInstructions, walkInnerInstructionsFromMeta } from './get-inner-instructions';
import {
    getAccountMetasFromCompiledTransactionMessage,
    getInstructionsFromCompiledTransactionMessageWithMetas,
    type ResolvedInstruction,
} from './get-instructions';
import type { TracedInstruction } from './types';

/**
 * Yields every instruction in a confirmed transaction — outer first, then
 * inner instructions interleaved by their outer-instruction index — as
 * {@link TracedInstruction}s.
 *
 * Each yielded instruction has its account indices resolved to
 * {@link AccountMeta}s and its data exposed as a `ReadonlyUint8Array`,
 * making it directly usable with the auto-generated `@solana-program/*`
 * `identifyXInstruction` and `parseXInstruction` functions.
 *
 * If `meta` is omitted, only outer instructions are yielded. If
 * `loadedAddresses` is omitted, only static accounts are used to resolve
 * indices — pass `meta?.loadedAddresses` for v0 transactions that load
 * accounts from address lookup tables.
 *
 * @example
 * ```ts
 * for (const traced of walkInstructions({ compiledMessage, meta, loadedAddresses })) {
 *     if (traced.instruction.programAddress === TOKEN_PROGRAM_ADDRESS) {
 *         const kind = identifyTokenInstruction(traced.instruction);
 *         // ...
 *     }
 * }
 * ```
 */
export function* walkInstructions(args: {
    compiledMessage: CompiledTransactionMessage;
    loadedAddresses?: LoadedAddresses | null;
    meta?: MetaWithInnerInstructions | null;
}): Generator<TracedInstruction, void, void> {
    const { compiledMessage, loadedAddresses, meta } = args;
    const accountMetas = getAccountMetasFromCompiledTransactionMessage(compiledMessage, loadedAddresses);
    const outerInstructions = getInstructionsFromCompiledTransactionMessageWithMetas(compiledMessage, accountMetas);
    for (let index = 0; index < outerInstructions.length; index++) {
        yield { instruction: outerInstructions[index], trace: { index, kind: 'outer' } };
    }
    if (meta) {
        yield* walkInnerInstructionsFromMeta(meta, accountMetas);
    }
}

/**
 * A {@link TracedInstruction} whose `instruction.programAddress` has been
 * narrowed to a specific program address — yielded by
 * {@link filterInstructionsForProgram}.
 */
type TracedInstructionForProgram<TProgramAddress extends string> = Omit<TracedInstruction, 'instruction'> & {
    instruction: ResolvedInstruction<TProgramAddress>;
};

/**
 * Filters a stream of {@link TracedInstruction}s to those invoking a
 * specific program, narrowing the yielded instruction's `programAddress`
 * type accordingly.
 *
 * @example
 * ```ts
 * const tokenIxs = filterInstructionsForProgram(
 *     walkInstructions({ compiledMessage, meta, loadedAddresses }),
 *     TOKEN_PROGRAM_ADDRESS,
 * );
 * for (const { instruction } of tokenIxs) {
 *     // `instruction.programAddress` is narrowed to TOKEN_PROGRAM_ADDRESS.
 *     const kind = identifyTokenInstruction(instruction);
 *     // ...
 * }
 * ```
 */
export function* filterInstructionsForProgram<TProgramAddress extends string>(
    instructions: Iterable<TracedInstruction>,
    programAddress: Address<TProgramAddress>,
): Generator<TracedInstructionForProgram<TProgramAddress>, void, void> {
    for (const traced of instructions) {
        if (traced.instruction.programAddress === programAddress) {
            yield traced as TracedInstructionForProgram<TProgramAddress>;
        }
    }
}
