import { Address } from '@solana/addresses';
import { pipe } from '@solana/functional';
import { Instruction } from '@solana/instructions';
import {
    InstructionWithSigners,
    setTransactionMessageFeePayerSigner,
    TransactionMessageWithSigners,
    TransactionSigner,
} from '@solana/signers';
import {
    appendTransactionMessageInstructions,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    TransactionMessage,
    TransactionMessageWithFeePayer,
    TransactionVersion,
} from '@solana/transaction-messages';

// Temporary, until we support v1 transactions in `createTransactionMessage`
// When this is removed, use `TransactionVersion`
type TransactionVersionWithoutV1 = Exclude<TransactionVersion, 1>;

// [DESCRIBE] TransactionMessageWithSigners type
{
    // It is satisfied by a transaction message from `createTransactionMessage`
    {
        const result = createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 });
        result satisfies TransactionMessage & TransactionMessageWithSigners;
    }

    // It is satisfied after adding an address fee payer
    {
        const result = pipe(createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }), m =>
            setTransactionMessageFeePayer(null as unknown as Address, m),
        );
        result satisfies TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithSigners;
    }

    // It is satisfied after adding a signer fee payer
    {
        const result = pipe(createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }), m =>
            setTransactionMessageFeePayerSigner(null as unknown as TransactionSigner, m),
        );
        result satisfies TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithSigners;
    }

    // It is satisfied after appending instructions
    {
        const result = pipe(createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }), m =>
            appendTransactionMessageInstructions(null as unknown as Instruction[], m),
        );
        result satisfies TransactionMessage & TransactionMessageWithSigners;
    }

    // It is satisfied after appending instructions with signers
    {
        const result = pipe(createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }), m =>
            appendTransactionMessageInstructions(null as unknown as (Instruction & InstructionWithSigners)[], m),
        );
        result satisfies TransactionMessage & TransactionMessageWithSigners;
    }

    // It is satisfied after adding a fee payer and instructions
    {
        const result = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageFeePayer(null as unknown as Address, m),
            m => appendTransactionMessageInstructions(null as unknown as Instruction[], m),
        );
        result satisfies TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithSigners;
    }

    // It is satisfied after adding a signer fee payer and instructions
    {
        const result = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageFeePayerSigner(null as unknown as TransactionSigner, m),
            m => appendTransactionMessageInstructions(null as unknown as (Instruction & InstructionWithSigners)[], m),
        );
        result satisfies TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithSigners;
    }

    // It is satisfied after adding a fee payer and instructions with signers
    {
        const result = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageFeePayer(null as unknown as Address, m),
            m => appendTransactionMessageInstructions(null as unknown as (Instruction & InstructionWithSigners)[], m),
        );
        result satisfies TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithSigners;
    }

    // It is satisfied after adding a signer fee payer and instructions with signers
    {
        const result = pipe(
            createTransactionMessage({ version: null as unknown as TransactionVersionWithoutV1 }),
            m => setTransactionMessageFeePayerSigner(null as unknown as TransactionSigner, m),
            m => appendTransactionMessageInstructions(null as unknown as (Instruction & InstructionWithSigners)[], m),
        );
        result satisfies TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithSigners;
    }
}
