import { Instruction } from '@solana/instructions';
import { TransactionMessage } from '@solana/transaction-messages';

import { InstructionWithSigners, TransactionMessageWithSigners } from '../account-signer-meta';
import { addSignersToInstruction, addSignersToTransactionMessage } from '../add-signers';
import { TransactionSigner } from '../transaction-signer';

const aliceSigner = null as unknown as TransactionSigner<'alice'>;
const bobSigner = null as unknown as TransactionSigner<'bob'>;

const instruction = null as unknown as Instruction;
const message = null as unknown as TransactionMessage;

// [DESCRIBE] addSignersToInstruction
{
    // It adds the `WithSigners` type expansion to the instruction
    {
        const instructionWithSigners = addSignersToInstruction([aliceSigner, bobSigner], instruction);
        instructionWithSigners satisfies InstructionWithSigners;
    }
}

// [DESCRIBE] addSignersToTransactionMessage
{
    // It adds the `WithSigners` type expansion to the transaction message
    {
        const messageWithSigners = addSignersToTransactionMessage([aliceSigner, bobSigner], message);
        messageWithSigners satisfies TransactionMessageWithSigners;
    }
}
