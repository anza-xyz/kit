import { Address, assertIsAddress } from '@solana/addresses';
import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_FEE_PAYER_MISSING,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
    SolanaError,
} from '@solana/errors';
import { pipe } from '@solana/functional';
import { AccountLookupMeta, AccountMeta, AccountRole, Instruction } from '@solana/instructions';
import type { Blockhash } from '@solana/rpc-types';

import { AddressesByLookupTableAddress } from './addresses-by-lookup-table-address';
import { setTransactionMessageLifetimeUsingBlockhash } from './blockhash';
import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from './compile';
import type { getCompiledAddressTableLookups } from './compile/address-table-lookups';
import { createTransactionMessage } from './create-transaction-message';
import { Nonce, setTransactionMessageLifetimeUsingDurableNonce } from './durable-nonce';
import { isAdvanceNonceAccountInstruction } from './durable-nonce-instruction';
import { setTransactionMessageFeePayer, TransactionMessageWithFeePayer } from './fee-payer';
import { appendTransactionMessageInstruction } from './instructions';
import { TransactionMessageWithLifetime } from './lifetime';
import { BaseTransactionMessage, TransactionVersion } from './transaction-message';

function getAccountMetas(message: CompiledTransactionMessage): AccountMeta[] {
    const { header } = message;
    const numWritableSignerAccounts = header.numSignerAccounts - header.numReadonlySignerAccounts;
    const numWritableNonSignerAccounts =
        message.staticAccounts.length - header.numSignerAccounts - header.numReadonlyNonSignerAccounts;

    const accountMetas: AccountMeta[] = [];

    let accountIndex = 0;
    for (let i = 0; i < numWritableSignerAccounts; i++) {
        accountMetas.push({
            address: message.staticAccounts[accountIndex],
            role: AccountRole.WRITABLE_SIGNER,
            static: true,
        });
        accountIndex++;
    }

    for (let i = 0; i < header.numReadonlySignerAccounts; i++) {
        accountMetas.push({
            address: message.staticAccounts[accountIndex],
            role: AccountRole.READONLY_SIGNER,
            static: true,
        });
        accountIndex++;
    }

    for (let i = 0; i < numWritableNonSignerAccounts; i++) {
        accountMetas.push({
            address: message.staticAccounts[accountIndex],
            role: AccountRole.WRITABLE,
            static: true,
        });
        accountIndex++;
    }

    for (let i = 0; i < header.numReadonlyNonSignerAccounts; i++) {
        accountMetas.push({
            address: message.staticAccounts[accountIndex],
            role: AccountRole.READONLY,
            static: true,
        });
        accountIndex++;
    }

    return accountMetas;
}

function getAddressLookupMetas(
    compiledAddressTableLookups: ReturnType<typeof getCompiledAddressTableLookups>,
    addressesByLookupTableAddress: AddressesByLookupTableAddress,
): AccountLookupMeta[] {
    // check that all message lookups are known
    const compiledAddressTableLookupAddresses = compiledAddressTableLookups.map(l => l.lookupTableAddress);
    const missing = compiledAddressTableLookupAddresses.filter(a => addressesByLookupTableAddress[a] === undefined);
    if (missing.length > 0) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING, {
            lookupTableAddresses: missing,
        });
    }

    const readOnlyMetas: AccountLookupMeta[] = [];
    const writableMetas: AccountLookupMeta[] = [];

    // we know that for each lookup, knownLookups[lookup.lookupTableAddress] is defined
    for (const lookup of compiledAddressTableLookups) {
        const addresses = addressesByLookupTableAddress[lookup.lookupTableAddress];
        const readonlyIndexes =
            lookup.readonlyIndexes ??
            /** @deprecated Remove in a future major version */
            lookup.readableIndices;
        const writableIndexes =
            lookup.writableIndexes ??
            /** @deprecated Remove in a future major version */
            lookup.writableIndices;

        const highestIndex = Math.max(...readonlyIndexes, ...writableIndexes);
        if (highestIndex >= addresses.length) {
            throw new SolanaError(
                SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
                {
                    highestKnownIndex: addresses.length - 1,
                    highestRequestedIndex: highestIndex,
                    lookupTableAddress: lookup.lookupTableAddress,
                },
            );
        }

        const readOnlyForLookup: AccountLookupMeta[] = readonlyIndexes.map(r => ({
            address: addresses[r],
            addressIndex: r,
            lookupTableAddress: lookup.lookupTableAddress,
            role: AccountRole.READONLY,
        }));
        readOnlyMetas.push(...readOnlyForLookup);

        const writableForLookup: AccountLookupMeta[] = writableIndexes.map(w => ({
            address: addresses[w],
            addressIndex: w,
            lookupTableAddress: lookup.lookupTableAddress,
            role: AccountRole.WRITABLE,
        }));
        writableMetas.push(...writableForLookup);
    }

    return [...writableMetas, ...readOnlyMetas];
}

function convertInstruction(
    instruction: CompiledTransactionMessage['instructions'][0],
    accountMetas: AccountMeta[],
): Instruction {
    const programAddress = accountMetas[instruction.programAddressIndex]?.address;
    if (!programAddress) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
            index: instruction.programAddressIndex,
        });
    }

    const accounts = instruction.accountIndices?.map(accountIndex => accountMetas[accountIndex]);
    const { data } = instruction;

    return Object.freeze({
        programAddress,
        ...(accounts && accounts.length ? { accounts: Object.freeze(accounts) } : {}),
        ...(data && data.length ? { data } : {}),
    });
}

type LifetimeConstraint =
    | {
          blockhash: Blockhash;
          lastValidBlockHeight: bigint;
      }
    | {
          nonce: Nonce;
          nonceAccountAddress: Address;
          nonceAuthorityAddress: Address;
      };

function getLifetimeConstraint(
    messageLifetimeToken: string,
    firstInstruction?: Instruction,
    lastValidBlockHeight?: bigint,
): LifetimeConstraint {
    if (!firstInstruction || !isAdvanceNonceAccountInstruction(firstInstruction)) {
        // first instruction is not advance durable nonce, so use blockhash lifetime constraint
        return {
            blockhash: messageLifetimeToken as Blockhash,
            lastValidBlockHeight: lastValidBlockHeight ?? 2n ** 64n - 1n, // U64 MAX
        };
    } else {
        // We know these accounts are defined because we checked `isAdvanceNonceAccountInstruction`
        const nonceAccountAddress = firstInstruction.accounts[0].address;
        assertIsAddress(nonceAccountAddress);

        const nonceAuthorityAddress = firstInstruction.accounts[2].address;
        assertIsAddress(nonceAuthorityAddress);

        return {
            nonce: messageLifetimeToken as Nonce,
            nonceAccountAddress,
            nonceAuthorityAddress,
        };
    }
}

export type DecompileTransactionMessageConfig = {
    /**
     * If the compiled message loads addresses from one or more address lookup tables, you will have
     * to supply a map of those tables to an array of the addresses they contained at the time that
     * the transaction message was constructed.
     *
     * @see {@link decompileTransactionMessageFetchingLookupTables} if you do not already have this.
     */
    addressesByLookupTableAddress?: AddressesByLookupTableAddress;
    /**
     * If the compiled message has a blockhash-based lifetime constraint, you will have to supply
     * the block height after which that blockhash is no longer valid for use as a lifetime
     * constraint.
     */
    lastValidBlockHeight?: bigint;
};

/**
 * Converts the type of transaction message data structure appropriate for execution on the network
 * to the type of transaction message data structure designed for use in your application.
 *
 * Because compilation is a lossy process, you can not fully reconstruct a source message from a
 * compiled message without extra information. In order to faithfully reconstruct the original
 * source message you will need to supply supporting details about the lifetime constraint and the
 * concrete addresses of any accounts sourced from account lookup tables.
 *
 * @see {@link compileTransactionMessage}
 */
export function decompileTransactionMessage(
    compiledTransactionMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime,
    config?: DecompileTransactionMessageConfig,
): BaseTransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime {
    const feePayer = compiledTransactionMessage.staticAccounts[0];
    if (!feePayer) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_FEE_PAYER_MISSING);
    }

    const accountMetas = getAccountMetas(compiledTransactionMessage);
    const accountLookupMetas =
        'addressTableLookups' in compiledTransactionMessage &&
        compiledTransactionMessage.addressTableLookups !== undefined &&
        compiledTransactionMessage.addressTableLookups.length > 0
            ? getAddressLookupMetas(
                  compiledTransactionMessage.addressTableLookups,
                  config?.addressesByLookupTableAddress ?? {},
              )
            : [];
    const transactionMetas = [...accountMetas, ...accountLookupMetas];

    const instructions: Instruction[] = compiledTransactionMessage.instructions.map(compiledInstruction =>
        convertInstruction(compiledInstruction, transactionMetas),
    );

    const firstInstruction = instructions[0];
    const lifetimeConstraint = getLifetimeConstraint(
        compiledTransactionMessage.lifetimeToken,
        firstInstruction,
        config?.lastValidBlockHeight,
    );

    return pipe(
        createTransactionMessage({ version: compiledTransactionMessage.version as TransactionVersion }),
        m => setTransactionMessageFeePayer(feePayer, m),
        m =>
            instructions.reduce(
                (acc, instruction) => appendTransactionMessageInstruction(instruction, acc),
                m as BaseTransactionMessage & TransactionMessageWithFeePayer,
            ),
        m =>
            'blockhash' in lifetimeConstraint
                ? setTransactionMessageLifetimeUsingBlockhash(lifetimeConstraint, m)
                : setTransactionMessageLifetimeUsingDurableNonce(lifetimeConstraint, m),
    );
}
