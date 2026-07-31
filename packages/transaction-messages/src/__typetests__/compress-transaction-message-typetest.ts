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

    // It rejects legacy transaction messages
    {
        const legacyMessage = null as unknown as Extract<TransactionMessage, { version: 'legacy' }>;
        // @ts-expect-error Legacy messages are not accepted.
        compressTransactionMessageUsingAddressLookupTables(legacyMessage, addressesByLookupTableAddress);
    }

    // It rejects v1 transaction messages
    {
        const v1Message = null as unknown as Extract<TransactionMessage, { version: 1 }>;
        // @ts-expect-error Only v0 messages are accepted, not v1.
        compressTransactionMessageUsingAddressLookupTables(v1Message, addressesByLookupTableAddress);
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
