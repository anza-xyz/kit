import type { Address } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs-core';
import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_ACCOUNT_INDEX_OUT_OF_RANGE,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
    SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED,
    SolanaError,
} from '@solana/errors';
import {
    type AccountMeta,
    AccountRole,
    type Instruction,
    type InstructionWithAccounts,
    type InstructionWithData,
} from '@solana/instructions';
import type { CompiledTransactionMessage } from '@solana/transaction-messages';

import type { LoadedAddresses } from './get-all-addresses';

/**
 * An outer transaction instruction with its account indices resolved to
 * full {@link AccountMeta}s and its data exposed as a `ReadonlyUint8Array`.
 *
 * @example
 * ```ts
 * for (const ix of getInstructionsFromCompiledTransactionMessage(compiled)) {
 *     // `ix` is a `ResolvedInstruction` — directly usable with auto-generated
 *     // `parseXInstruction` / `identifyXInstruction` helpers, and with
 *     // `isInstructionForProgram` from `@solana/instructions`.
 *     identifyTokenInstruction(ix);
 * }
 * ```
 */
export type ResolvedInstruction<TProgramAddress extends string = string> = Instruction<
    TProgramAddress,
    readonly AccountMeta[]
> &
    InstructionWithAccounts<readonly AccountMeta[]> &
    InstructionWithData<ReadonlyUint8Array>;

/**
 * The normalized shape of an instruction inside a compiled transaction
 * message — `legacy`, `0`, and `1` are all reduced to this form before
 * resolution.
 */
type NormalizedCompiledInstruction = Readonly<{
    accountIndices: readonly number[];
    data: ReadonlyUint8Array;
    programAddressIndex: number;
}>;

/**
 * Builds the full ordered list of {@link AccountMeta}s for a compiled
 * transaction message.
 *
 * The order matches the runtime's resolution order:
 *
 * 1. Static accounts, with role bits derived from the message header
 *    (writable signers, readonly signers, writable non-signers, readonly
 *    non-signers).
 * 2. ALT-loaded writable accounts (always non-signer, writable).
 * 3. ALT-loaded readonly accounts (always non-signer, readonly).
 *
 * Inner-instruction account indices reference the same flat list, so this
 * helper is also useful for resolving inner instructions.
 */
export function getAccountMetasFromCompiledTransactionMessage(
    compiledMessage: CompiledTransactionMessage,
    loadedAddresses?: LoadedAddresses | null,
): AccountMeta[] {
    const { header, staticAccounts } = compiledMessage;
    const numWritableSignerAccounts = header.numSignerAccounts - header.numReadonlySignerAccounts;
    const numWritableNonSignerAccounts =
        staticAccounts.length - header.numSignerAccounts - header.numReadonlyNonSignerAccounts;

    const metas: AccountMeta[] = [];
    let i = 0;
    for (let n = 0; n < numWritableSignerAccounts; n++, i++) {
        metas.push({ address: staticAccounts[i], role: AccountRole.WRITABLE_SIGNER });
    }
    for (let n = 0; n < header.numReadonlySignerAccounts; n++, i++) {
        metas.push({ address: staticAccounts[i], role: AccountRole.READONLY_SIGNER });
    }
    for (let n = 0; n < numWritableNonSignerAccounts; n++, i++) {
        metas.push({ address: staticAccounts[i], role: AccountRole.WRITABLE });
    }
    for (let n = 0; n < header.numReadonlyNonSignerAccounts; n++, i++) {
        metas.push({ address: staticAccounts[i], role: AccountRole.READONLY });
    }

    if (loadedAddresses) {
        for (const address of loadedAddresses.writable) {
            metas.push({ address, role: AccountRole.WRITABLE });
        }
        for (const address of loadedAddresses.readonly) {
            metas.push({ address, role: AccountRole.READONLY });
        }
    }

    return metas;
}

/**
 * Returns the outer instructions of a compiled transaction message as kit
 * {@link Instruction} objects.
 *
 * Each returned instruction has its account indices resolved to
 * {@link AccountMeta}s (with the proper signer/writable bits) and its data
 * exposed as a `ReadonlyUint8Array` — the form the auto-generated
 * `@solana-program/*` `parseXInstruction` functions expect.
 *
 * Supports `legacy`, `v0`, and `v1` compiled messages. Throws
 * {@link SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED} for any
 * other version,
 * {@link SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND}
 * if a `programAddressIndex` falls outside the resolved account list, and
 * {@link SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_ACCOUNT_INDEX_OUT_OF_RANGE}
 * if an account index does.
 *
 * @example
 * ```ts
 * const instructions = getInstructionsFromCompiledTransactionMessage(
 *     compiled,
 *     rpcResponse.meta?.loadedAddresses,
 * );
 * for (const ix of instructions) {
 *     if (ix.programAddress === TOKEN_PROGRAM_ADDRESS) {
 *         const kind = identifyTokenInstruction(ix);
 *         // ...
 *     }
 * }
 * ```
 */
export function getInstructionsFromCompiledTransactionMessage(
    compiledMessage: CompiledTransactionMessage,
    loadedAddresses?: LoadedAddresses | null,
): ResolvedInstruction[] {
    const metas = getAccountMetasFromCompiledTransactionMessage(compiledMessage, loadedAddresses);
    return normalizeCompiledInstructions(compiledMessage).map(ix => resolveInstruction(ix, metas));
}

/**
 * Internal variant of {@link getInstructionsFromCompiledTransactionMessage}
 * that takes pre-built {@link AccountMeta}s. Used by {@link walkInstructions}
 * to avoid rebuilding the meta list when it is already needed for resolving
 * inner instructions.
 *
 * @internal
 */
export function getInstructionsFromCompiledTransactionMessageWithMetas(
    compiledMessage: CompiledTransactionMessage,
    accountMetas: readonly AccountMeta[],
): ResolvedInstruction[] {
    return normalizeCompiledInstructions(compiledMessage).map(ix => resolveInstruction(ix, accountMetas));
}

function normalizeCompiledInstructions(compiledMessage: CompiledTransactionMessage): NormalizedCompiledInstruction[] {
    if (compiledMessage.version === 'legacy' || compiledMessage.version === 0) {
        return compiledMessage.instructions.map(ix => ({
            accountIndices: ix.accountIndices ?? [],
            data: ix.data ?? new Uint8Array(),
            programAddressIndex: ix.programAddressIndex,
        }));
    }
    if (compiledMessage.version === 1) {
        const { instructionHeaders, instructionPayloads } = compiledMessage;
        return instructionHeaders.map((header, i) => ({
            accountIndices: instructionPayloads[i].instructionAccountIndices,
            data: instructionPayloads[i].instructionData,
            programAddressIndex: header.programAccountIndex,
        }));
    }
    // Compile-time exhaustiveness: if a future `CompiledTransactionMessage`
    // variant is added, `compiledMessage` will no longer narrow to `never`
    // here and this assignment will fail to typecheck — forcing us to handle
    // the new version explicitly.
    const _exhaustiveCheck: never = compiledMessage;
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
        unsupportedVersion: (_exhaustiveCheck as { version: number }).version,
    });
}

function resolveInstruction(ix: NormalizedCompiledInstruction, metas: readonly AccountMeta[]): ResolvedInstruction {
    const programMeta = metas[ix.programAddressIndex];
    if (!programMeta) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
            index: ix.programAddressIndex,
        });
    }
    const accounts: AccountMeta[] = ix.accountIndices.map(i => {
        const meta = metas[i];
        if (!meta) {
            throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_ACCOUNT_INDEX_OUT_OF_RANGE, {
                index: i,
            });
        }
        return meta;
    });
    return {
        accounts,
        data: ix.data,
        programAddress: programMeta.address as Address,
    };
}
