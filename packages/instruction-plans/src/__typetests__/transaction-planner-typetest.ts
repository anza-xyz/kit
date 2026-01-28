/* eslint-disable @typescript-eslint/no-floating-promises */

import { Instruction } from '@solana/instructions';
import {
    appendTransactionMessageInstruction,
    TransactionMessage,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';

import {
    createTransactionPlanner,
    type InstructionPlan,
    type TransactionPlan,
    type TransactionPlanner,
} from '../index';

// [DESCRIBE] TransactionPlanner
{
    // Its return type satisfies TransactionPlan.
    {
        const instructionPlan = null as unknown as InstructionPlan;
        const planner = null as unknown as TransactionPlanner;
        const transactionPlan = planner(instructionPlan);
        transactionPlan satisfies Promise<TransactionPlan>;
    }
}

// [DESCRIBE] createTransactionPlanner
{
    // `onTransactionMessageUpdated` always receives a transaction message with fee payer.
    {
        createTransactionPlanner({
            createTransactionMessage: {} as unknown as Parameters<
                typeof createTransactionPlanner
            >[0]['createTransactionMessage'],
            onTransactionMessageUpdated: message => {
                message satisfies TransactionMessage & TransactionMessageWithFeePayer;
                return message;
            },
        });
    }

    // `onTransactionMessageUpdated` may return a different transaction message then the one received.
    {
        createTransactionPlanner({
            createTransactionMessage: {} as unknown as Parameters<
                typeof createTransactionPlanner
            >[0]['createTransactionMessage'],
            onTransactionMessageUpdated: message => {
                return appendTransactionMessageInstruction({} as unknown as Instruction, message);
            },
        });
    }
}
