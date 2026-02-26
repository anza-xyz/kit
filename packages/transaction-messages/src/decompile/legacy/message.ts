import { pipe } from '@solana/functional';

import {
    appendTransactionMessageInstructions,
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    createTransactionMessage,
    setTransactionMessageLifetimeUsingBlockhash,
    setTransactionMessageLifetimeUsingDurableNonce,
} from '../..';
import { setTransactionMessageFeePayer, TransactionMessageWithFeePayer } from '../../fee-payer';
import { TransactionMessageWithLifetime } from '../../lifetime';
import { TransactionMessage } from '../../transaction-message';
import { getAccountMetas } from './account-metas';
import { convertInstructions } from './convert-instruction';
import { getFeePayer } from './fee-payer';
import { getLifetimeConstraint } from './lifetime-constraint';

export function decompileTransactionMessage(
    compiledTransactionMessage: CompiledTransactionMessage &
        CompiledTransactionMessageWithLifetime & { version: 'legacy' },
    config?: {
        lastValidBlockHeight?: bigint;
    },
): TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime & { version: 'legacy' } {
    const feePayer = getFeePayer(compiledTransactionMessage.staticAccounts);
    const accountMetas = getAccountMetas(compiledTransactionMessage);
    const instructions = convertInstructions(compiledTransactionMessage.instructions, accountMetas);
    const lifetimeConstraint = getLifetimeConstraint(
        compiledTransactionMessage.lifetimeToken,
        instructions,
        config?.lastValidBlockHeight,
    );

    return pipe(
        createTransactionMessage({ version: 'legacy' }),
        m => setTransactionMessageFeePayer(feePayer, m),
        m => appendTransactionMessageInstructions(instructions, m),
        m =>
            'blockhash' in lifetimeConstraint
                ? setTransactionMessageLifetimeUsingBlockhash(lifetimeConstraint, m)
                : setTransactionMessageLifetimeUsingDurableNonce(lifetimeConstraint, m),
    );
}
