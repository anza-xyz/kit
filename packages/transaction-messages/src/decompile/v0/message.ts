import { pipe } from '@solana/functional';

import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '../..';
import { AddressesByLookupTableAddress } from '../../addresses-by-lookup-table-address';
import { setTransactionMessageLifetimeUsingBlockhash } from '../../blockhash';
import { createTransactionMessage } from '../../create-transaction-message';
import { setTransactionMessageLifetimeUsingDurableNonce } from '../../durable-nonce';
import { setTransactionMessageFeePayer, TransactionMessageWithFeePayer } from '../../fee-payer';
import { appendTransactionMessageInstructions } from '../../instructions';
import { TransactionMessageWithLifetime } from '../../lifetime';
import { TransactionMessage } from '../../transaction-message';
import { getAccountMetas } from '../legacy/account-metas';
import { convertInstructions } from '../legacy/convert-instruction';
import { getFeePayer } from '../legacy/fee-payer';
import { getLifetimeConstraint } from '../legacy/lifetime-constraint';
import { getAddressLookupMetas } from './address-lookup-metas';

export type DecompileTransactionMessageConfig = {
    addressesByLookupTableAddress?: AddressesByLookupTableAddress;
    lastValidBlockHeight?: bigint;
};

export function decompileTransactionMessage(
    compiledTransactionMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime & { version: 0 },
    config?: DecompileTransactionMessageConfig,
): TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime {
    const feePayer = getFeePayer(compiledTransactionMessage.staticAccounts);

    const accountMetas = getAccountMetas(compiledTransactionMessage);
    const accountLookupMetas =
        'addressTableLookups' in compiledTransactionMessage &&
        compiledTransactionMessage.addressTableLookups !== undefined &&
        compiledTransactionMessage.addressTableLookups.length > 0
            ? getAddressLookupMetas(
                  compiledTransactionMessage.addressTableLookups,
                  config?.addressesByLookupTableAddress ?? {},
              )
            : [];
    const transactionMetas = [...accountMetas, ...accountLookupMetas];
    const instructions = convertInstructions(compiledTransactionMessage.instructions, transactionMetas);

    const lifetimeConstraint = getLifetimeConstraint(
        compiledTransactionMessage.lifetimeToken,
        instructions,
        config?.lastValidBlockHeight,
    );

    return pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayer(feePayer, m),
        m => appendTransactionMessageInstructions(instructions, m),
        m =>
            'blockhash' in lifetimeConstraint
                ? setTransactionMessageLifetimeUsingBlockhash(lifetimeConstraint, m)
                : setTransactionMessageLifetimeUsingDurableNonce(lifetimeConstraint, m),
    ) as TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime;
}
