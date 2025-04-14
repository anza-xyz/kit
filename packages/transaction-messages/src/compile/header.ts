import { isSignerRole, isWritableRole } from '@solana/instructions';

import { OrderedAccounts } from '../compile/accounts';

type MessageHeader = Readonly<{
    /**
     * The number of accounts in the static accounts list that are neither writable nor
     * signers.
     *
     * Adding this number to `numSignerAccounts` yields the index of the first read-only non-signer
     * account in the static accounts list.
     */
    numReadonlyNonSignerAccounts: number;
    /**
     * The number of read-only accounts in the static accounts list that must sign this
     * transaction.
     *
     * Subtracting this number from `numSignerAccounts` yields the index of the first read-only
     * signer account in the static accounts list.
     */
    numReadonlySignerAccounts: number;
    /**
     * The number of accounts in the static accounts list that must sign this transaction.
     *
     * Subtracting `numReadonlySignerAccounts` from this number yields the number of
     * writable signer accounts in the static accounts list. Writable signer accounts always
     * begin at index zero in the static accounts list.
     *
     * This number itself is the index of the first non-signer account in the static
     * accounts list.
     */
    numSignerAccounts: number;
}>;

export function getCompiledMessageHeader(orderedAccounts: OrderedAccounts): MessageHeader {
    let numReadonlyNonSignerAccounts = 0;
    let numReadonlySignerAccounts = 0;
    let numSignerAccounts = 0;
    for (const account of orderedAccounts) {
        if ('lookupTableAddress' in account) {
            break;
        }
        const accountIsWritable = isWritableRole(account.role);
        if (isSignerRole(account.role)) {
            numSignerAccounts++;
            if (!accountIsWritable) {
                numReadonlySignerAccounts++;
            }
        } else if (!accountIsWritable) {
            numReadonlyNonSignerAccounts++;
        }
    }
    return {
        numReadonlyNonSignerAccounts,
        numReadonlySignerAccounts,
        numSignerAccounts,
    };
}
