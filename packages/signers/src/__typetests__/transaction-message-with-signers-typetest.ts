import { AccountLookupMeta, AccountMeta, Instruction } from '@solana/instructions';

import { AccountMetaWithSigner, AccountSignerMeta } from '../account-signer-meta';
import { InstructionWithSigners, NonSignerInstruction, TransactionMessageWithSigners } from '../transaction-message-with-signers';
import { TransactionSigner } from '../transaction-signer';
import { BaseTransactionMessage, TransactionMessageWithFeePayer, TransactionVersion } from '@solana/transaction-messages';
import { NonSignerFeePayer, TransactionMessageWithFeePayerSigner } from '../fee-payer-signer';
import { Address } from '@solana/addresses';
import { TransactionModifyingSigner } from '../transaction-modifying-signer';
import { TransactionPartialSigner } from '../transaction-partial-signer';

// [DESCRIBE] NonSignerInstruction
{
    // It allows an instruction that does not have any signer account metas.
    {
        const instruction = null as unknown as Instruction<string, AccountMeta[]>;
        instruction satisfies NonSignerInstruction;
    }

    // It allows an instruction with lookup metas that are not signers.
    {
        const instruction = null as unknown as Instruction<string, (AccountLookupMeta | AccountMeta)[]>;
        instruction satisfies NonSignerInstruction;
    }

    // It fails if the instruction has any signer account metas.
    {
        const instruction = null as unknown as Instruction<
            string,
            (AccountMeta | (AccountMeta & { signer: TransactionSigner }))[]
        >;
        // @ts-expect-error Instruction has a signer account meta.
        instruction satisfies NonSignerInstruction;
    }
}

// [DESCRIBE] InstructionWithSigners
{
    // It allows an instruction with signer account metas.
    {
        const instruction = null as unknown as Instruction<string, AccountSignerMeta[]>;
        instruction satisfies InstructionWithSigners;
    }

    // It allows an instruction with no signer account metas.
    {
        const instruction = null as unknown as Instruction<string, AccountMeta[]>;
        instruction satisfies InstructionWithSigners;
    }

    // It allows an instruction with a mix of signer and non-signer account metas.
    {
        const instruction = null as unknown as Instruction<string, (AccountMeta | AccountSignerMeta)[]>;
        instruction satisfies InstructionWithSigners;
    }

    // It fails for a signer type that does not match the account meta signer.
    {
        type CustomSigner = TransactionSigner & { customProperty: true };
        const instruction = null as unknown as Instruction<string, AccountSignerMeta[]>;
        // @ts-expect-error Signer type does not match account meta signer type.
        instruction satisfies InstructionWithSigners<CustomSigner>;
    }
}

// [DESCRIBE] TransactionMessageWithSigners
{
    // It allows a transaction with a fee payer that is not a signer.
    {
        const transactionMessage = null as unknown as BaseTransactionMessage & TransactionMessageWithFeePayer;
        transactionMessage satisfies TransactionMessageWithSigners;
    }

    // It allows a transaction with a fee payer that is a signer.
    {
        const transactionMessage = null as unknown as BaseTransactionMessage &
            TransactionMessageWithFeePayerSigner;
        transactionMessage satisfies TransactionMessageWithSigners;
    }

    // It fails for a fee payer signer that does not match the signer type
    {
        type CustomSigner = TransactionSigner & { customProperty: true };
        const transactionMessage = null as unknown as BaseTransactionMessage &
            TransactionMessageWithFeePayerSigner<Address, TransactionSigner>;
        // @ts-expect-error Fee payer signer type does not match.
        transactionMessage satisfies TransactionMessageWithSigners<Address, CustomSigner>;
    }

    // It allows instructions with non-signer accounts
    {
        const transactionMessage = null as unknown as BaseTransactionMessage & {
            instructions: NonSignerInstruction[];
        };
        transactionMessage satisfies TransactionMessageWithSigners;
    }

    // It allows instructions with signer accounts
    {
        const transactionMessage = null as unknown as BaseTransactionMessage & {
            instructions: Instruction<string, AccountSignerMeta[]>[];
        };
        transactionMessage satisfies TransactionMessageWithSigners;
    }

    // It allows instructions with a mix of signer and non-signer accounts
    {
        const transactionMessage = null as unknown as BaseTransactionMessage & {
            instructions: Instruction<string, (AccountMeta | AccountSignerMeta)[]>[];
        };
        transactionMessage satisfies TransactionMessageWithSigners;
    }

    // It allows multiple instructions with different account meta types
    {
        const transactionMessage = null as unknown as BaseTransactionMessage & {
            instructions: [
                NonSignerInstruction,
                Instruction<string, AccountSignerMeta[]>,
                Instruction<string, (AccountMeta | AccountSignerMeta)[]>,
            ];
        };
        transactionMessage satisfies TransactionMessageWithSigners;
    }

    // It fails if the instruction signer type does not match the signer type
    {
        type CustomSigner = TransactionSigner & { customProperty: true };
        const transactionMessage = null as unknown as {
            instructions: Instruction<string, (AccountMeta | AccountSignerMeta)[]>[];
        };

        // this should error
        transactionMessage satisfies TransactionMessageWithSigners<Address, CustomSigner>;


        const instruction = transactionMessage.instructions[0];
        // @ts-expect-error Errors as expected
        instruction satisfies NonSignerInstruction;
        instruction satisfies Instruction & InstructionWithSigners<TransactionSigner>;
        // @ts-expect-error Errors as expected
        instruction satisfies Instruction & InstructionWithSigners<CustomSigner>;
    }
}
