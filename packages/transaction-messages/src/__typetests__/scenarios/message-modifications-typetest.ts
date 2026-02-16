import { Address } from '@solana/addresses';
import { pipe } from '@solana/functional';
import { Instruction } from '@solana/instructions';

import {
    appendTransactionMessageInstruction,
    appendTransactionMessageInstructions,
    decompileTransactionMessage,
    prependTransactionMessageInstruction,
    prependTransactionMessageInstructions,
} from '../..';
import { setTransactionMessageLifetimeUsingBlockhash, TransactionMessageWithBlockhashLifetime } from '../../blockhash';
import { compressTransactionMessageUsingAddressLookupTables } from '../../compress-transaction-message';
import { createTransactionMessage } from '../../create-transaction-message';
import {
    setTransactionMessageLifetimeUsingDurableNonce,
    TransactionMessageWithDurableNonceLifetime,
} from '../../durable-nonce';
import { setTransactionMessageFeePayer, TransactionMessageWithFeePayer } from '../../fee-payer';
import { TransactionMessage, TransactionVersion } from '../../transaction-message';

const blockhashLifetime = null as unknown as Parameters<typeof setTransactionMessageLifetimeUsingBlockhash>[0];
const durableNonceLifetime = null as unknown as Parameters<typeof setTransactionMessageLifetimeUsingDurableNonce>[0];
const addressesByLookupTableAddress = null as unknown as Parameters<
    typeof compressTransactionMessageUsingAddressLookupTables
>[1];
const compiledTransactionMessage = null as unknown as Parameters<typeof decompileTransactionMessage>[0];
const feePayer = null as unknown as Address;
const instruction = null as unknown as Instruction;

// Temporary, until we support v1 transactions in `createTransactionMessage`
// When this is removed, use `TransactionVersion`
type TransactionVersionWithoutV1 = Exclude<TransactionVersion, 1>;

// [DESCRIBE] setTransactionMessageLifetimeUsingBlockhash
{
    // It sets the blockhash after `createTransactionMessage`
    {
        const message = pipe(createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }), m =>
            setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
        );
        message satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;
    }

    // It sets the blockhash after other transformations
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageFeePayer(null as unknown as Address, m),
            m => setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
        );
        message satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime & TransactionMessageWithFeePayer;
    }

    // It sets the blockhash after a durable nonce lifetime
    {
        const messageWithDurableNonce = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, m),
        );
        messageWithDurableNonce satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;

        const messageWithBlockhash = setTransactionMessageLifetimeUsingBlockhash(
            blockhashLifetime,
            messageWithDurableNonce,
        );
        messageWithBlockhash satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;
        // @ts-expect-error It should strip the durable nonce lifetime
        messageWithBlockhash satisfies TransactionMessageWithDurableNonceLifetime;
    }

    // It sets the blockhash after compressing a transaction message
    {
        const message = pipe(
            createTransactionMessage({ version: 0 }), // only supported for v0
            m => compressTransactionMessageUsingAddressLookupTables(m, addressesByLookupTableAddress),
        );
        const messageWithBlockhash = setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, message);
        messageWithBlockhash satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;
    }

    // It sets the blockhash after decompiling a message
    {
        const message = pipe(decompileTransactionMessage(compiledTransactionMessage), m =>
            setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
        );
        message satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;
    }

    // It sets the blockhash with instructions
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => appendTransactionMessageInstruction(instruction, m),
            m => prependTransactionMessageInstruction(instruction, m),
            m => appendTransactionMessageInstructions([instruction], m),
            m => prependTransactionMessageInstructions([instruction], m),
            m => setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
        );
        message satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;
    }

    // It sets the blockhash multiple times
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
            m => setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
            m => setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
        );
        message satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;
    }
}

// [DESCRIBE] setTransactionMessageLifetimeUsingDurableNonce
{
    // It sets the durable nonce after `createTransactionMessage`
    {
        const message = pipe(createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }), m =>
            setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, m),
        );
        message satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;
    }

    // It sets the durable nonce after other transformations
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageFeePayer(null as unknown as Address, m),
            m => setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, m),
        );
        message satisfies TransactionMessage &
            TransactionMessageWithDurableNonceLifetime &
            TransactionMessageWithFeePayer;
    }

    // It sets the durable nonce after a blockhash lifetime
    {
        const messageWithBlockhash = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
        );
        messageWithBlockhash satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;

        const messageWithDurableNonce = setTransactionMessageLifetimeUsingDurableNonce(
            durableNonceLifetime,
            messageWithBlockhash,
        );
        messageWithDurableNonce satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;
        // @ts-expect-error It should strip the blockhash lifetime
        messageWithDurableNonce satisfies TransactionMessageWithBlockhashLifetime;
    }

    // It sets the durable nonce after compressing a transaction message
    {
        const message = pipe(
            createTransactionMessage({ version: 0 }), // only supported for v0
            m => compressTransactionMessageUsingAddressLookupTables(m, addressesByLookupTableAddress),
        );
        const messageWithDurableNonce = setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, message);
        messageWithDurableNonce satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;
    }

    // It sets the durable nonce after decompiling a message
    {
        const message = pipe(decompileTransactionMessage(compiledTransactionMessage), m =>
            setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, m),
        );
        message satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;
    }

    // It sets the durable nonce with instructions
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => appendTransactionMessageInstruction(instruction, m),
            m => prependTransactionMessageInstruction(instruction, m),
            m => appendTransactionMessageInstructions([instruction], m),
            m => prependTransactionMessageInstructions([instruction], m),
            m => setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, m),
        );
        message satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;
    }

    // It sets the durable nonce multiple times
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, m),
            m => setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, m),
            m => setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, m),
        );
        message satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;
    }
}

// [DESCRIBE] compressTransactionMessageUsingAddressLookupTables
{
    // It compresses after `createTransactionMessage`
    {
        const message = createTransactionMessage({ version: 0 }); // only supported for v0
        const compressedMessage = compressTransactionMessageUsingAddressLookupTables(
            message,
            addressesByLookupTableAddress,
        );
        compressedMessage satisfies TransactionMessage & { version: 0 };
    }

    // It cannot be used with legacy messages from `createTransactionMessage`
    {
        const message = createTransactionMessage({ version: 'legacy' });
        compressTransactionMessageUsingAddressLookupTables(
            // @ts-expect-error Only v0 messages are accepted.
            message,
            addressesByLookupTableAddress,
        );
    }

    // It compresses after other transformations
    {
        const message = pipe(
            createTransactionMessage({ version: 0 }), // only supported for v0
            m => setTransactionMessageFeePayer(null as unknown as Address, m),
            m => setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
            m => appendTransactionMessageInstruction(instruction, m),
            m => prependTransactionMessageInstruction(instruction, m),
            m => appendTransactionMessageInstructions([instruction], m),
            m => prependTransactionMessageInstructions([instruction], m),
        );
        const compressedMessage = compressTransactionMessageUsingAddressLookupTables(
            message,
            addressesByLookupTableAddress,
        );
        compressedMessage satisfies TransactionMessage & { version: 0 };
        compressedMessage satisfies TransactionMessageWithBlockhashLifetime;
        compressedMessage satisfies TransactionMessageWithFeePayer;
    }

    // It compresses after decompiling a message
    {
        const message = decompileTransactionMessage(compiledTransactionMessage);
        if (message.version === 0) {
            const compressedMessage = compressTransactionMessageUsingAddressLookupTables(
                message,
                addressesByLookupTableAddress,
            );
            compressedMessage satisfies TransactionMessage & { version: 0 };
        }
    }
}

// [DESCRIBE] setTransactionMessageFeePayer
{
    // It sets the fee payer after `createTransactionMessage`
    {
        const message = createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 });
        const newMessage = setTransactionMessageFeePayer(feePayer, message);
        newMessage satisfies TransactionMessage & TransactionMessageWithFeePayer;
    }

    // It sets the fee payer after setting a blockhash lifetime
    {
        const message = pipe(createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }), m =>
            setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
        );
        const newMessage = setTransactionMessageFeePayer(feePayer, message);
        newMessage satisfies TransactionMessage &
            TransactionMessageWithBlockhashLifetime &
            TransactionMessageWithFeePayer;
    }

    // It sets the fee payer after setting a durable nonce lifetime
    {
        const message = pipe(createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }), m =>
            setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, m),
        );
        const newMessage = setTransactionMessageFeePayer(feePayer, message);
        newMessage satisfies TransactionMessage &
            TransactionMessageWithDurableNonceLifetime &
            TransactionMessageWithFeePayer;
    }

    // It sets the fee payer multiple times
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageFeePayer(feePayer, m),
            m => setTransactionMessageFeePayer(feePayer, m),
            m => setTransactionMessageFeePayer(feePayer, m),
        );
        message satisfies TransactionMessage & TransactionMessageWithFeePayer;
    }
}

// [DESCRIBE] instructions functions
{
    // It can call instruction functions after `createTransactionMessage`
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => appendTransactionMessageInstruction(instruction, m),
            m => prependTransactionMessageInstruction(instruction, m),
            m => appendTransactionMessageInstructions([instruction], m),
            m => prependTransactionMessageInstructions([instruction], m),
        );
        message satisfies TransactionMessage;
    }

    // It can call instruction functions after setting a blockhash lifetime
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageLifetimeUsingBlockhash(blockhashLifetime, m),
            m => appendTransactionMessageInstruction(instruction, m),
            m => prependTransactionMessageInstruction(instruction, m),
            m => appendTransactionMessageInstructions([instruction], m),
            m => prependTransactionMessageInstructions([instruction], m),
        );
        message satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;
    }

    // It can call append instruction functions after setting a durable nonce lifetime
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, m),
            m => appendTransactionMessageInstruction(instruction, m),
            m => appendTransactionMessageInstructions([instruction], m),
        );
        message satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;
    }

    // It can call prepend instruction functions after setting a durable nonce lifetime, but
    // the durable nonce lifetime is stripped because the first instruction must be the AdvanceNonceAccount instruction
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageLifetimeUsingDurableNonce(durableNonceLifetime, m),
            m => prependTransactionMessageInstruction(instruction, m),
            m => prependTransactionMessageInstructions([instruction], m),
        );
        message satisfies TransactionMessage;
        // @ts-expect-error It should strip the durable nonce lifetime
        message satisfies TransactionMessageWithDurableNonceLifetime;
    }

    // It can call instruction functions after setting a fee payer
    {
        const message = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageFeePayer(feePayer, m),
            m => appendTransactionMessageInstruction(instruction, m),
            m => prependTransactionMessageInstruction(instruction, m),
            m => appendTransactionMessageInstructions([instruction], m),
            m => prependTransactionMessageInstructions([instruction], m),
        );
        message satisfies TransactionMessage & TransactionMessageWithFeePayer;
    }

    // It can call instruction functions after compressing a transaction message
    {
        const message = pipe(
            createTransactionMessage({ version: 0 }), // only supported for v0
            m => compressTransactionMessageUsingAddressLookupTables(m, addressesByLookupTableAddress),
            m => appendTransactionMessageInstruction(instruction, m),
            m => prependTransactionMessageInstruction(instruction, m),
            m => appendTransactionMessageInstructions([instruction], m),
            m => prependTransactionMessageInstructions([instruction], m),
        );
        message satisfies TransactionMessage & { version: 0 };
    }

    // It can call instruction functions after decompiling a message
    {
        const message = pipe(
            decompileTransactionMessage(compiledTransactionMessage),
            m => appendTransactionMessageInstruction(instruction, m),
            m => prependTransactionMessageInstruction(instruction, m),
            m => appendTransactionMessageInstructions([instruction], m),
            m => prependTransactionMessageInstructions([instruction], m),
        );
        message satisfies TransactionMessage;
    }
}
