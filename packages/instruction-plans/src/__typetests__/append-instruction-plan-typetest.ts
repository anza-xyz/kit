import { Instruction } from '@solana/instructions';
import {
    TransactionMessage,
    TransactionMessageWithFeePayer,
    TransactionMessageWithinSizeLimit,
} from '@solana/transaction-messages';

import { appendTransactionMessageInstructionPlan } from '../append-instruction-plan';
import { InstructionPlan } from '../instruction-plan';

// [DESCRIBE] appendTransactionMessageInstructionPlan
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as TransactionMessage & TransactionMessageWithFeePayer & { some: 1 };
        const newMessage = appendTransactionMessageInstructionPlan(null as unknown as InstructionPlan, message);
        newMessage satisfies TransactionMessage & TransactionMessageWithFeePayer & { some: 1 };
    }

    // It maintains the existing instruction types
    {
        type InstructionA = Instruction & { identifier: 'A' };

        const message = null as unknown as {
            feePayer: TransactionMessageWithFeePayer['feePayer'];
            instructions: [InstructionA];
            version: 0;
        };
        const newMessage = appendTransactionMessageInstructionPlan(null as unknown as InstructionPlan, message);
        newMessage.instructions[0] satisfies InstructionA;
    }

    // It removes the size limit type safety.
    {
        const message = null as unknown as TransactionMessage &
            TransactionMessageWithFeePayer &
            TransactionMessageWithinSizeLimit;
        const newMessage = appendTransactionMessageInstructionPlan(null as unknown as InstructionPlan, message);
        // @ts-expect-error Potentially no longer within size limit.
        newMessage satisfies TransactionMessageWithinSizeLimit;
    }
}
