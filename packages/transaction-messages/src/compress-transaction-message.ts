import { Address } from '@solana/addresses';
import { AccountLookupMeta, AccountMeta, AccountRole, Instruction, isSignerRole } from '@solana/instructions';

import { AddressesByLookupTableAddress } from './addresses-by-lookup-table-address';
import { BaseTransactionMessage, TransactionMessage } from './transaction-message';

type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

// Look up the address in lookup tables, return a lookup meta if it is found in any of them
function findAddressInLookupTables(
    address: Address,
    role: AccountRole.READONLY | AccountRole.WRITABLE,
    addressesByLookupTableAddress: AddressesByLookupTableAddress,
): AccountLookupMeta | undefined {
    for (const [lookupTableAddress, addresses] of Object.entries(addressesByLookupTableAddress)) {
        for (let i = 0; i < addresses.length; i++) {
            if (address === addresses[i]) {
                return {
                    address,
                    addressIndex: i,
                    lookupTableAddress: lookupTableAddress as Address,
                    role,
                };
            }
        }
    }
}

type TransactionMessageNotLegacy = Exclude<TransactionMessage, { version: 'legacy' }>;

// Each account can be AccountLookupMeta | AccountMeta
type WidenInstructionAccounts<TInstruction extends Instruction> =
    TInstruction extends Instruction<infer TProgramAddress, infer TAccounts>
        ? Instruction<
              TProgramAddress,
              {
                  [K in keyof TAccounts]: TAccounts[K] extends AccountMeta<infer TAddress>
                      ? AccountLookupMeta<TAddress> | AccountMeta<TAddress>
                      : TAccounts[K];
              }
          >
        : TInstruction;

type ExtractAdditionalProps<T, U> = Omit<T, keyof U>;

type WidenTransactionMessageInstructions<TTransactionMessage extends TransactionMessage> =
    TTransactionMessage extends BaseTransactionMessage<infer TVersion, infer TInstruction>
        ? BaseTransactionMessage<TVersion, WidenInstructionAccounts<TInstruction>> &
              ExtractAdditionalProps<
                  TTransactionMessage,
                  BaseTransactionMessage<TVersion, WidenInstructionAccounts<TInstruction>>
              >
        : TTransactionMessage;

/**
 * Given a transaction message and a mapping of lookup tables to the addresses stored in them, this
 * function will return a new transaction message with the same instructions but with all non-signer
 * accounts that are found in the given lookup tables represented by an {@link AccountLookupMeta}
 * instead of an {@link AccountMeta}.
 *
 * This means that these accounts will take up less space in the compiled transaction message. This
 * size reduction is most significant when the transaction includes many accounts from the same
 * lookup table.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 * import {
 *     AddressesByLookupTableAddress,
 *     compressTransactionMessageUsingAddressLookupTables,
 * } from '@solana/transaction-messages';
 * import { fetchAddressLookupTable } from '@solana-program/address-lookup-table';
 *
 * const lookupTableAddress = address('4QwSwNriKPrz8DLW4ju5uxC2TN5cksJx6tPUPj7DGLAW');
 * const {
 *     data: { addresses },
 * } = await fetchAddressLookupTable(rpc, lookupTableAddress);
 * const addressesByAddressLookupTable: AddressesByLookupTableAddress = {
 *     [lookupTableAddress]: addresses,
 * };
 *
 * const compressedTransactionMessage = compressTransactionMessageUsingAddressLookupTables(
 *     transactionMessage,
 *     addressesByAddressLookupTable,
 * );
 * ```
 */
export function compressTransactionMessageUsingAddressLookupTables<
    TTransactionMessage extends TransactionMessageNotLegacy = TransactionMessageNotLegacy,
>(
    transactionMessage: TTransactionMessage,
    addressesByLookupTableAddress: AddressesByLookupTableAddress,
): TTransactionMessage | WidenTransactionMessageInstructions<TTransactionMessage> {
    const lookupTableAddresses = new Set(Object.values(addressesByLookupTableAddress).flatMap(a => a));
    const programAddresses = new Set(transactionMessage.instructions.map(ix => ix.programAddress));

    const newInstructions: Instruction[] = [];
    let updatedAnyInstructions = false;
    for (const instruction of transactionMessage.instructions) {
        if (!instruction.accounts) {
            newInstructions.push(instruction);
            continue;
        }

        const newAccounts: Mutable<NonNullable<Instruction['accounts']>> = [];
        let updatedAnyAccounts = false;
        for (const account of instruction.accounts) {
            // If the address is already a lookup, is not in any lookup tables, or is a signer role or programAddress, return as-is 
            if (
                programAddresses.has(account.address) ||
                'lookupTableAddress' in account ||
                !lookupTableAddresses.has(account.address) ||
                isSignerRole(account.role)
            ) {
                newAccounts.push(account);
                continue;
            }

            // We already checked it's in one of the lookup tables
            const lookupMetaAccount = findAddressInLookupTables(
                account.address,
                account.role,
                addressesByLookupTableAddress,
            )!;
            newAccounts.push(Object.freeze(lookupMetaAccount));
            updatedAnyAccounts = true;
            updatedAnyInstructions = true;
        }

        newInstructions.push(
            Object.freeze(updatedAnyAccounts ? { ...instruction, accounts: newAccounts } : instruction),
        );
    }

    return Object.freeze(
        updatedAnyInstructions ? { ...transactionMessage, instructions: newInstructions } : transactionMessage,
    );
}
