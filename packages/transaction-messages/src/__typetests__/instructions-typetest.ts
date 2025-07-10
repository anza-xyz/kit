import { Address } from '@solana/addresses';
import { pipe } from '@solana/functional';

import { setTransactionMessageLifetimeUsingBlockhash, TransactionMessageWithBlockhashLifetime } from '../blockhash';
import { createTransactionMessage } from '../create-transaction-message';
import {
    setTransactionMessageLifetimeUsingDurableNonce,
    TransactionMessageWithDurableNonceLifetime,
} from '../durable-nonce';
import { AdvanceNonceAccountInstruction } from '../durable-nonce-instruction';
import { setTransactionMessageFeePayer, TransactionMessageWithFeePayer } from '../fee-payer';
import {
    appendTransactionMessageInstruction,
    appendTransactionMessageInstructions,
    prependTransactionMessageInstruction,
    prependTransactionMessageInstructions,
} from '../instructions';
import { BaseTransactionMessage } from '../transaction-message';
import { TransactionMessageWithinSizeLimit } from '../transaction-message-size';

type Instruction = BaseTransactionMessage['instructions'][number];
type InstructionA = Instruction & { identifier: 'A' };
type InstructionB = Instruction & { identifier: 'B' };
type InstructionC = Instruction & { identifier: 'C' };

// [DESCRIBE] appendTransactionMessageInstruction
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        const newMessage = appendTransactionMessageInstruction(null as unknown as Instruction, message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
    }

    // It concatenates the instruction types
    {
        const message = null as unknown as { instructions: [InstructionA]; version: 0 };
        const newMessage = appendTransactionMessageInstruction(null as unknown as InstructionB, message);
        newMessage.instructions satisfies readonly [InstructionA, InstructionB];
        // @ts-expect-error Wrong order.
        newMessage.instructions satisfies readonly [InstructionB, InstructionA];
        // @ts-expect-error Not readonly.
        newMessage.instructions satisfies [InstructionA, InstructionB];
    }

    // It adds instruction types to base transaction messages
    {
        const message = null as unknown as BaseTransactionMessage;
        const newMessage = appendTransactionMessageInstruction(null as unknown as InstructionA, message);
        newMessage.instructions satisfies readonly [...Instruction[], InstructionA];
    }

    // It keeps the blockhash lifetime type safety.
    {
        const feePayer = null as unknown as Address;
        const blockhash = null as unknown as Parameters<typeof setTransactionMessageLifetimeUsingBlockhash>[0];
        const message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer(feePayer, m),
            m => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
            m => appendTransactionMessageInstruction(null as unknown as InstructionA, m),
        );

        message satisfies BaseTransactionMessage &
            TransactionMessageWithBlockhashLifetime &
            TransactionMessageWithFeePayer;
        message.instructions satisfies readonly [InstructionA];
    }

    // It keeps the durable nonce lifetime type safety.
    {
        const feePayer = null as unknown as Address;
        const nonceConfig = null as unknown as Parameters<typeof setTransactionMessageLifetimeUsingDurableNonce>[0];
        const message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer(feePayer, m),
            m => setTransactionMessageLifetimeUsingDurableNonce(nonceConfig, m),
            m => appendTransactionMessageInstruction(null as unknown as InstructionA, m),
        );

        message satisfies BaseTransactionMessage &
            TransactionMessageWithDurableNonceLifetime &
            TransactionMessageWithFeePayer;
        message.instructions satisfies readonly [AdvanceNonceAccountInstruction, InstructionA];
    }

    // It removes the size limit type safety.
    {
        const message = null as unknown as BaseTransactionMessage & TransactionMessageWithinSizeLimit;
        const newMessage = appendTransactionMessageInstruction(null as unknown as Instruction, message);
        // @ts-expect-error Potentially no longer within size limit.
        newMessage satisfies TransactionMessageWithinSizeLimit;
    }
}

// [DESCRIBE] appendTransactionMessageInstructions
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        const newMessage = appendTransactionMessageInstructions(null as unknown as Instruction[], message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
    }

    // It concatenates the instruction types
    {
        const message = null as unknown as { instructions: [InstructionA]; version: 0 };
        const newMessage = appendTransactionMessageInstructions(
            [null as unknown as InstructionB, null as unknown as InstructionC],
            message,
        );
        newMessage.instructions satisfies readonly [InstructionA, InstructionB, InstructionC];
        // @ts-expect-error Wrong order.
        newMessage.instructions satisfies readonly [InstructionC, InstructionB, InstructionA];
        // @ts-expect-error Not readonly.
        newMessage.instructions satisfies [InstructionA, InstructionB, InstructionC];
    }

    // It adds instruction types to base transaction messages
    {
        const message = null as unknown as BaseTransactionMessage;
        const newMessage = appendTransactionMessageInstructions(
            [null as unknown as InstructionA, null as unknown as InstructionB],
            message,
        );
        newMessage.instructions satisfies readonly [...Instruction[], InstructionA, InstructionB];
    }

    // It removes the size limit type safety.
    {
        const message = null as unknown as BaseTransactionMessage & TransactionMessageWithinSizeLimit;
        const newMessage = appendTransactionMessageInstructions([null as unknown as Instruction], message);
        // @ts-expect-error Potentially no longer within size limit.
        newMessage satisfies TransactionMessageWithinSizeLimit;
    }
}

// [DESCRIBE] prependTransactionMessageInstruction
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        const newMessage = prependTransactionMessageInstruction(null as unknown as Instruction, message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
    }

    // It strips the durable nonce transaction message type
    {
        const message = null as unknown as BaseTransactionMessage &
            TransactionMessageWithDurableNonceLifetime & { some: 1 };
        const newMessage = prependTransactionMessageInstruction(null as unknown as Instruction, message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
        // @ts-expect-error The durable nonce transaction message type should be stripped.
        newMessage satisfies TransactionMessageWithDurableNonceLifetime;
    }

    // It does not remove blockhash lifetimes.
    {
        const message = null as unknown as BaseTransactionMessage &
            TransactionMessageWithBlockhashLifetime & { some: 1 };
        const newMessage = prependTransactionMessageInstruction(null as unknown as Instruction, message);
        newMessage satisfies BaseTransactionMessage & TransactionMessageWithBlockhashLifetime & { some: 1 };
    }

    // It concatenates the instruction types
    {
        const message = null as unknown as { instructions: [InstructionA]; version: 0 };
        const newMessage = prependTransactionMessageInstruction(null as unknown as InstructionB, message);
        newMessage.instructions satisfies readonly [InstructionB, InstructionA];
        // @ts-expect-error Wrong order.
        newMessage.instructions satisfies readonly [InstructionA, InstructionB];
        // @ts-expect-error Not readonly.
        newMessage.instructions satisfies [InstructionB, InstructionA];
    }

    // It adds instruction types to base transaction messages
    {
        const message = null as unknown as BaseTransactionMessage;
        const newMessage = prependTransactionMessageInstruction(null as unknown as InstructionA, message);
        newMessage.instructions satisfies readonly [InstructionA, ...Instruction[]];
    }

    // It keeps the blockhash lifetime type safety.
    {
        const feePayer = null as unknown as Address;
        const blockhash = null as unknown as Parameters<typeof setTransactionMessageLifetimeUsingBlockhash>[0];
        const message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer(feePayer, m),
            m => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
            m => prependTransactionMessageInstruction(null as unknown as InstructionA, m),
        );

        message satisfies BaseTransactionMessage &
            TransactionMessageWithBlockhashLifetime &
            TransactionMessageWithFeePayer;
        message.instructions satisfies readonly [InstructionA];
    }

    // It removes the durable nonce lifetime type safety but keep the nonce instruction.
    {
        const feePayer = null as unknown as Address;
        const nonceConfig = null as unknown as Parameters<typeof setTransactionMessageLifetimeUsingDurableNonce>[0];
        const message = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer(feePayer, m),
            m => setTransactionMessageLifetimeUsingDurableNonce(nonceConfig, m),
            m => prependTransactionMessageInstruction(null as unknown as InstructionA, m),
        );

        message.instructions satisfies readonly [InstructionA, AdvanceNonceAccountInstruction];
        message satisfies BaseTransactionMessage & TransactionMessageWithFeePayer;
        // @ts-expect-error No longer a durable nonce lifetime.
        message satisfies TransactionMessageWithDurableNonceLifetime;
    }

    // It removes the size limit type safety.
    {
        const message = null as unknown as BaseTransactionMessage & TransactionMessageWithinSizeLimit;
        const newMessage = prependTransactionMessageInstruction(null as unknown as Instruction, message);
        // @ts-expect-error Potentially no longer within size limit.
        newMessage satisfies TransactionMessageWithinSizeLimit;
    }
}

// [DESCRIBE] prependTransactionMessageInstructions
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        const newMessage = prependTransactionMessageInstructions(null as unknown as Instruction[], message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
    }

    // It strips the durable nonce transaction message type
    {
        const message = null as unknown as BaseTransactionMessage &
            TransactionMessageWithDurableNonceLifetime & { some: 1 };
        const newMessage = prependTransactionMessageInstructions(null as unknown as Instruction[], message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
        // @ts-expect-error The durable nonce transaction message type should be stripped.
        newMessage satisfies TransactionMessageWithDurableNonceLifetime;
    }

    // It concatenates the instruction types
    {
        const message = null as unknown as { instructions: [InstructionA]; version: 0 };
        const newMessage = prependTransactionMessageInstructions(
            [null as unknown as InstructionB, null as unknown as InstructionC],
            message,
        );
        newMessage.instructions satisfies readonly [InstructionB, InstructionC, InstructionA];
        // @ts-expect-error Wrong order.
        newMessage.instructions satisfies readonly [InstructionA, InstructionC, InstructionB];
        // @ts-expect-error Not readonly.
        newMessage.instructions satisfies [InstructionB, InstructionC, InstructionA];
    }

    // It adds instruction types to base transaction messages
    {
        const message = null as unknown as BaseTransactionMessage;
        const newMessage = prependTransactionMessageInstructions(
            [null as unknown as InstructionA, null as unknown as InstructionB],
            message,
        );
        newMessage.instructions satisfies readonly [InstructionA, InstructionB, ...Instruction[]];
    }

    // It removes the size limit type safety.
    {
        const message = null as unknown as BaseTransactionMessage & TransactionMessageWithinSizeLimit;
        const newMessage = prependTransactionMessageInstructions([null as unknown as Instruction], message);
        // @ts-expect-error Potentially no longer within size limit.
        newMessage satisfies TransactionMessageWithinSizeLimit;
    }
}
