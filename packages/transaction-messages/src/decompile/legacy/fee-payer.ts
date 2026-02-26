import { SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_FEE_PAYER_MISSING, SolanaError } from '@solana/errors';

import { CompiledTransactionMessage } from '../..';

export function getFeePayer(staticAccounts: CompiledTransactionMessage['staticAccounts']) {
    const feePayer = staticAccounts[0];
    if (!feePayer) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_FEE_PAYER_MISSING);
    }
    return feePayer;
}
