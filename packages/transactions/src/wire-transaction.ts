import { getBase64Decoder } from '@solana/codecs-strings';

import { getTransactionEncoder } from './codecs';
import { Transaction } from './transaction';

/** Represents the wire format of a transaction as a base64-encoded string. */
export type Base64EncodedWireTransaction = string & {
    readonly __brand: unique symbol;
};

/**
 * Given a signed transaction, this method returns the transaction as a string that conforms to the
 * {@link Base64EncodedWireTransaction} type.
 *
 * @example
 * ```ts
 * import { getBase64EncodedWireTransaction, signTransaction } from '@solana/transactions';
 *
 * const serializedTransaction = getBase64EncodedWireTransaction(signedTransaction);
 * const signature = await rpc.sendTransaction(serializedTransaction, { encoding: 'base64' }).send();
 * ```
 */
export function getBase64EncodedWireTransaction(transaction: Transaction): Base64EncodedWireTransaction {
    const wireTransactionBytes = getTransactionEncoder().encode(transaction);
    return getBase64Decoder().decode(wireTransactionBytes) as Base64EncodedWireTransaction;
}
