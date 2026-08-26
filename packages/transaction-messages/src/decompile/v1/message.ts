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
        // @ts-expect-error We don't expose v1 on `createTransactionMessage` yet
        createTransactionMessage({ version: 1 }),
        // Decoding must remain permissive, so the decompiled config is assigned directly instead of
        // passing through the validating `setTransactionMessageConfig` setter.
        // Won't need this cast after we support v1 on `createTransactionMessage`
        m => {
            const mWithVersion = m as unknown as TransactionMessage & { version: 1 };
            return isV1ConfigEmpty(transactionConfig)
                ? mWithVersion
                : (Object.freeze({
                      ...mWithVersion,
                      config: Object.freeze(transactionConfig),
                  }) as unknown as TransactionMessage & { version: 1 });
        },
        m => setTransactionMessageFeePayer(feePayer, m),
        m => appendTransactionMessageInstructions(instructions, m),
        m =>
            'blockhash' in lifetimeConstraint
                ? setTransactionMessageLifetimeUsingBlockhash(lifetimeConstraint, m)
                : setTransactionMessageLifetimeUsingDurableNonce(lifetimeConstraint, m),
    );
}
