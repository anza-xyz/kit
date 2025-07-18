import { Address, getAddressDecoder } from '@solana/addresses';
import { fixEncoderSize, getUtf8Encoder } from '@solana/codecs';
import { SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, SolanaError } from '@solana/errors';
import { pipe } from '@solana/functional';
import type { Instruction } from '@solana/instructions';
import {
    appendTransactionMessageInstruction,
    type BaseTransactionMessage,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    type TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';
import { getTransactionMessageSize, Transaction, TRANSACTION_SIZE_LIMIT } from '@solana/transactions';

import { MessagePackerInstructionPlan } from '../instruction-plan';

const MINIMUM_INSTRUCTION_SIZE = 35;

export const FOREVER_PROMISE = new Promise(() => {
    /* never resolve */
});

export function createMessage<TId extends string>(
    id: TId,
): BaseTransactionMessage & TransactionMessageWithFeePayer & { id: TId } {
    return pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayer('E9Nykp3rSdza2moQutaJ3K3RSC8E5iFERX2SqLTsQfjJ' as Address, m),
        m => Object.freeze({ ...m, id }),
    );
}

export function createTransaction<TId extends string>(id: TId): Transaction & { id: TId } {
    return Object.freeze({ id }) as unknown as Transaction & { id: TId };
}

export function instructionFactory(baseSeed?: string) {
    const seedPrefix = baseSeed ? `${baseSeed}-` : '';
    const seedEncoder = fixEncoderSize(getUtf8Encoder(), 32);
    const addressDecoder = getAddressDecoder();
    const getProgramAddress = (seed: string): Address => addressDecoder.decode(seedEncoder.encode(seed));

    return (seed: string, bytes: number): Instruction => {
        if (bytes < MINIMUM_INSTRUCTION_SIZE) {
            throw new Error(`Instruction size must be at least ${MINIMUM_INSTRUCTION_SIZE} bytes`);
        }
        return {
            data: new Uint8Array(bytes - MINIMUM_INSTRUCTION_SIZE),
            programAddress: getProgramAddress(`${seedPrefix}${seed}`),
        };
    };
}

export function transactionPercentFactory(
    createTransactionMessage: () => BaseTransactionMessage & TransactionMessageWithFeePayer,
) {
    const minimumTransactionSize = getTransactionMessageSize(createTransactionMessage());
    const remainingSize = TRANSACTION_SIZE_LIMIT - minimumTransactionSize - 1; /* For shortU16. */
    return (percent: number) => Math.floor((remainingSize * percent) / 100);
}

export function createMessagePackerInstructionPlan(
    totalBytes: number,
    baseSeed?: string,
): MessagePackerInstructionPlan & Readonly<{ get: (offset: number, length: number) => Instruction }> {
    const getInstruction = instructionFactory(baseSeed ? `message-packer-${baseSeed}` : 'message-packer');
    const getInstructionFromOffsetAndLength = (offset: number, length: number): Instruction =>
        getInstruction(`${offset}-${length}`, length);

    // Note that we cannot use `getLinearMessagePackerInstructionPlan` here because
    // we want the `MINIMUM_INSTRUCTION_SIZE` to be included in our calculations.
    // For instance, if an instruction that takes 50% of the transaction size,
    // This should include the base instruction size to simplify our expectations.
    const baseInstruction = getInstructionFromOffsetAndLength(0, MINIMUM_INSTRUCTION_SIZE);
    return Object.freeze({
        get: getInstructionFromOffsetAndLength,
        getMessagePacker: () => {
            let offset = 0;
            return {
                done: () => offset >= totalBytes,
                packMessageToCapacity: message => {
                    const messageSizeWithBaseInstruction = getTransactionMessageSize(
                        appendTransactionMessageInstruction(baseInstruction, message),
                    );
                    const freeSpace =
                        TRANSACTION_SIZE_LIMIT -
                        messageSizeWithBaseInstruction /* Includes the base instruction (length: 0). */ -
                        1; /* Leeway for shortU16 numbers in transaction headers. */

                    if (freeSpace <= 0) {
                        const messageSize = getTransactionMessageSize(message);
                        throw new SolanaError(SOLANA_ERROR__INSTRUCTION_PLANS__MESSAGE_CANNOT_ACCOMMODATE_PLAN, {
                            // (+1) We need to pack at least one byte of data otherwise
                            // there is no point packing the base instruction alone.
                            numBytesRequired: messageSizeWithBaseInstruction - messageSize + 1,
                            // (-1) Leeway for shortU16 numbers in transaction headers.
                            numFreeBytes: TRANSACTION_SIZE_LIMIT - messageSize - 1,
                        });
                    }

                    const length = Math.min(totalBytes - offset, freeSpace + MINIMUM_INSTRUCTION_SIZE);
                    const instruction = getInstructionFromOffsetAndLength(offset, length);
                    offset += length;
                    return appendTransactionMessageInstruction(instruction, message);
                },
            };
        },
        kind: 'messagePacker',
    });
}
