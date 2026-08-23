import { pipe } from '@solana/functional';

import { setTransactionMessageLifetimeUsingBlockhash } from '../../blockhash';
import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '../../compile';
import { createTransactionMessage } from '../../create-transaction-message';
import { setTransactionMessageLifetimeUsingDurableNonce } from '../../durable-nonce';
import { setTransactionMessageFeePayer, TransactionMessageWithFeePayer } from '../../fee-payer';
import { appendTransactionMessageInstructions } from '../../instructions';
import { TransactionMessageWithLifetime } from '../../lifetime';
import { TransactionMessage } from '../../transaction-message';
import { isV1ConfigEmpty } from '../../v1-transaction-config';
import { getAccountMetas } from '../legacy/account-metas';
import { getFeePayer } from '../legacy/fee-payer';
import { getLifetimeConstraint } from '../legacy/lifetime-constraint';
import { decompileTransactionConfig } from './config';
import { decompileInstructions } from './instructions';

export function decompileTransactionMessage(
    compiledTransactionMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime & { version: 1 },
    config?: {
        lastValidBlockHeight?: bigint;
    },
): TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime & { version: 1 } {
    const feePayer = getFeePayer(compiledTransactionMessage.staticAccounts);
    const accountMetas = getAccountMetas(compiledTransactionMessage);
    const transactionConfig = decompileTransactionConfig(
        compiledTransactionMessage.configMask,
        compiledTransactionMessage.configValues,
    );
    const instructions = decompileInstructions(
        compiledTransactionMessage.instructionHeaders,
        compiledTransactionMessage.instructionPayloads,
        accountMetas,
    );
    const lifetimeConstraint = getLifetimeConstraint(
        compiledTransactionMessage.lifetimeToken,
        instructions,
        config?.lastValidBlockHeight,
    );

    return pipe(
        createTransactionMessage({ version: 1 }),
        // Attach the decoded config directly instead of going through `setTransactionMessageConfig`,
        // which validates resource limits. Decoding must not reject a transaction merely because it
        // carries values the runtime would refuse; callers need to be able to inspect such messages.
        m =>
            isV1ConfigEmpty(transactionConfig) ? m : Object.freeze({ ...m, config: Object.freeze(transactionConfig) }),
        m => setTransactionMessageFeePayer(feePayer, m),
        m => appendTransactionMessageInstructions(instructions, m),
        m =>
            'blockhash' in lifetimeConstraint
                ? setTransactionMessageLifetimeUsingBlockhash(lifetimeConstraint, m)
                : setTransactionMessageLifetimeUsingDurableNonce(lifetimeConstraint, m),
    );
}
