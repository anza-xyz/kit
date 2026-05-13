import type { Address } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs-core';
import {
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
 * A version-agnostic compiled transaction message that has top-level
 * instructions. (V1 messages don't carry instructions directly and are
 * out of scope here.)
 */
type CompiledTransactionMessageWithInstructions = Extract<CompiledTransactionMessage, { version: 'legacy' | 0 }>;

/**
 * An outer transaction instruction with its account indices resolved to
 * full {@link AccountMeta}s and its data exposed as a `ReadonlyUint8Array`.
 *
 * @example
 * ```ts
 * for (const ix of getInstructionsFromCompiledTransactionMessage(compiled)) {
 *     // `ix` is a `ResolvedInstruction` — directly usable with auto-generated
 *     // `parseXInstruction` / `identifyXInstruction` helpers.
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
 * Each yielded instruction has its account indices resolved to
 * {@link AccountMeta}s (with the proper signer/writable bits) and its data
 * exposed as a `ReadonlyUint8Array` — the form the auto-generated
 * `@solana-program/*` `parseXInstruction` functions expect.
 *
 * Throws {@link SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND}
 * if a `programAddressIndex` falls outside the resolved account list.
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
    const message = assertCompiledMessageVersionIsSupported(compiledMessage);
    const metas = getAccountMetasFromCompiledTransactionMessage(message, loadedAddresses);
    return message.instructions.map(ix => resolveInstruction(ix, metas));
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
    const message = assertCompiledMessageVersionIsSupported(compiledMessage);
    return message.instructions.map(ix => resolveInstruction(ix, accountMetas));
}

function assertCompiledMessageVersionIsSupported(
    compiledMessage: CompiledTransactionMessage,
): CompiledTransactionMessageWithInstructions {
    if (compiledMessage.version !== 'legacy' && compiledMessage.version !== 0) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
            unsupportedVersion: compiledMessage.version,
        });
    }
    return compiledMessage as CompiledTransactionMessageWithInstructions;
}

function resolveInstruction(
    ix: CompiledTransactionMessageWithInstructions['instructions'][number],
    metas: readonly AccountMeta[],
): ResolvedInstruction {
    const programMeta = metas[ix.programAddressIndex];
    if (!programMeta) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
            index: ix.programAddressIndex,
        });
    }
    const accounts: AccountMeta[] = (ix.accountIndices ?? []).map(i => {
        const meta = metas[i];
        if (!meta) {
            throw new SolanaError(
                SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
                { index: i },
            );
        }
        return meta;
    });
    const data: ReadonlyUint8Array = ix.data ?? new Uint8Array();
    return {
        accounts,
        data,
        programAddress: programMeta.address as Address,
    };
}
