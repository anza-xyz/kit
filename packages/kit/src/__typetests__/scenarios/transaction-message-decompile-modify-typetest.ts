// [DESCRIBE] A scenario testing the types of transaction-message functionality
// Based on discussion/examples from https://github.com/anza-xyz/kit/pull/1103

import { Address } from '@solana/addresses';
import { pipe } from '@solana/functional';
import { Instruction } from '@solana/instructions';
import { GetMultipleAccountsApi, Rpc } from '@solana/rpc';
import { setTransactionMessageFeePayerSigner, TransactionSigner } from '@solana/signers';
import {
    appendTransactionMessageInstruction,
    appendTransactionMessageInstructions,
    BlockhashLifetimeConstraint,
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    prependTransactionMessageInstruction,
    prependTransactionMessageInstructions,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    setTransactionMessageLifetimeUsingDurableNonce,
    TransactionMessage,
} from '@solana/transaction-messages';

import { decompileTransactionMessageFetchingLookupTables } from '../../decompile-transaction-message-fetching-lookup-tables';

const compiledTransactionMessage = null as unknown as CompiledTransactionMessage &
    CompiledTransactionMessageWithLifetime;
const rpc = null as unknown as Rpc<GetMultipleAccountsApi>;

// A function that only accepts v0 transactions
type TransactionMessageNotLegacy = Exclude<TransactionMessage, { version: 'legacy' }>;
function acceptsNonLegacyTransactionMessage(_msg: TransactionMessageNotLegacy) {}

void (async () => {
    const transactionMessage = await decompileTransactionMessageFetchingLookupTables(compiledTransactionMessage, rpc);

    // @ts-expect-error Transaction has an unknown version
    acceptsNonLegacyTransactionMessage(transactionMessage);

    if (transactionMessage.version === 0) {
        // It typechecks when the transaction message is known to be v0
        acceptsNonLegacyTransactionMessage(transactionMessage);
    }

    // We update the transaction message using update functions to ensure the types flow correctly
    const blockhash = null as unknown as BlockhashLifetimeConstraint;
    const durableNonce = null as unknown as Parameters<typeof setTransactionMessageLifetimeUsingDurableNonce>[0];
    const feePayer = null as unknown as Address;
    const instruction = null as unknown as Instruction;
    const signer = null as unknown as TransactionSigner;

    const updatedMessage = pipe(
        transactionMessage,
        m => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
        m => setTransactionMessageLifetimeUsingDurableNonce(durableNonce, m),
        m => setTransactionMessageFeePayer(feePayer, m),
        m => appendTransactionMessageInstruction(instruction, m),
        m => appendTransactionMessageInstructions([instruction], m),
        m => prependTransactionMessageInstruction(instruction, m),
        m => prependTransactionMessageInstructions([instruction], m),
        m => setTransactionMessageFeePayerSigner(signer, m),
    );

    // @ts-expect-error Transaction has an unknown version
    acceptsNonLegacyTransactionMessage(updatedMessage);

    if (updatedMessage.version === 0) {
        // It typechecks when the transaction message is known to be v0
        acceptsNonLegacyTransactionMessage(updatedMessage);
    }
})();
