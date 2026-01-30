import { AccountLookupMeta, AccountMeta, AccountRole, Instruction } from '@solana/instructions';

import { TransactionMessageWithBlockhashLifetime } from '../blockhash';
import { compressTransactionMessageUsingAddressLookupTables } from '../compress-transaction-message';
import { TransactionMessageWithFeePayer } from '../fee-payer';
import { TransactionMessage } from '../transaction-message';

type v0TransactionMessage = TransactionMessage & { version: 0 };

type AddressesByLookupTableAddress = Parameters<typeof compressTransactionMessageUsingAddressLookupTables>[1];
const addressesByLookupTableAddress = null as unknown as AddressesByLookupTableAddress;

// [DESCRIBE] compressTransactionMessageUsingAddressLookupTables
{
    // It returns the input type or a widened version of it
    {
        const message = null as unknown as v0TransactionMessage;
        const result = compressTransactionMessageUsingAddressLookupTables(message, addressesByLookupTableAddress);
        result satisfies v0TransactionMessage;
    }

    // It accepts only v0 transaction messages
    {
        const invalidMessage = null as unknown as Exclude<TransactionMessage, { version: 0 }>;
        // @ts-expect-error Only v0 messages are accepted.
        compressTransactionMessageUsingAddressLookupTables(invalidMessage, addressesByLookupTableAddress);
    }

    // It preserves the fee payer type
    {
        const message = null as unknown as TransactionMessageWithFeePayer & v0TransactionMessage;
        const result = compressTransactionMessageUsingAddressLookupTables(message, addressesByLookupTableAddress);
        result satisfies TransactionMessageWithFeePayer;
    }

    // It preserves the blockhash lifetime type
    {
        const message = null as unknown as TransactionMessageWithBlockhashLifetime & v0TransactionMessage;
        const result = compressTransactionMessageUsingAddressLookupTables(message, addressesByLookupTableAddress);
        result satisfies TransactionMessageWithBlockhashLifetime;
    }

    // It preserves additional properties
    {
        const message = null as unknown as v0TransactionMessage & { some: 1 };
        const result = compressTransactionMessageUsingAddressLookupTables(message, addressesByLookupTableAddress);
        result satisfies { some: 1 };
    }

    // It widens AccountMeta to include AccountLookupMeta in instruction accounts
    {
        type MyInstruction = Instruction<
            '1111',
            readonly [AccountMeta<'aaaa'> & { readonly role: AccountRole.WRITABLE }]
        >;
        const message = null as unknown as { readonly instructions: readonly MyInstruction[]; readonly version: 0 };
        const result = compressTransactionMessageUsingAddressLookupTables(message, addressesByLookupTableAddress);
        const accounts = result.instructions[0].accounts!;
        accounts[0] satisfies AccountLookupMeta<'aaaa'> | AccountMeta<'aaaa'>;
    }
}
