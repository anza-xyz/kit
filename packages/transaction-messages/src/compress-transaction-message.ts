import { Address } from '@solana/addresses';
import { AccountRole, IAccountLookupMeta, IAccountMeta, IInstruction, isSignerRole } from '@solana/instructions';

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
): IAccountLookupMeta | undefined {
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

// Each account can be IAccountLookupMeta | IAccountMeta
type WidenInstructionAccounts<TInstruction extends IInstruction> =
    TInstruction extends IInstruction<infer TProgramAddress, infer TAccounts>
        ? IInstruction<
              TProgramAddress,
              {
                  [K in keyof TAccounts]: TAccounts[K] extends IAccountMeta<infer TAddress>
                      ? IAccountLookupMeta<TAddress> | IAccountMeta<TAddress>
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
 * accounts that are found in the given lookup tables represented by an {@link IAccountLookupMeta}
 * instead of an {@link IAccountMeta}.
 *
 * This means that these accounts will take up less space in the compiled transaction message. This
 * size reduction is most significant when the transaction includes many accounts from the same
 * lookup table.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 * import { compressTransactionMessageUsingAddressLookupTables } from '@solana/transaction-messages';
 *
 * const lookupTableAddress = address('4QwSwNriKPrz8DLW4ju5uxC2TN5cksJx6tPUPj7DGLAW');
 * const accountAddress = address('5n2ADjHPsqB4EVUNEX48xRqtnmuLu5XSHDwkJRR98qpM');
 * const lookupTableAddresses: AddressesByLookupTableAddress = {
 *     [lookupTableAddress]: [accountAddress],
 * };
 *
 * const compressedTransactionMessage = compressTransactionMessageUsingAddressLookupTables(
 *     transactionMessage,
 *     lookupTableAddresses,
 * );
 * ```
 *
 */
export function compressTransactionMessageUsingAddressLookupTables<
    TTransactionMessage extends TransactionMessageNotLegacy = TransactionMessageNotLegacy,
>(
    transactionMessage: TTransactionMessage,
    addressesByLookupTableAddress: AddressesByLookupTableAddress,
): TTransactionMessage | WidenTransactionMessageInstructions<TTransactionMessage> {
    const lookupTableAddresses = new Set(Object.values(addressesByLookupTableAddress).flatMap(a => a));

    const newInstructions: IInstruction[] = [];
    let updatedAnyInstructions = false;
    for (const instruction of transactionMessage.instructions) {
        if (!instruction.accounts) {
            newInstructions.push(instruction);
            continue;
        }

        const newAccounts: Mutable<NonNullable<IInstruction['accounts']>> = [];
        let updatedAnyAccounts = false;
        for (const account of instruction.accounts) {
            // If the address is already a lookup, is not in any lookup tables, or is a signer role, return as-is
            if (
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
