import { Address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS, SolanaError } from '@solana/errors';

import { MessageSigner } from './message-signer';
import { TransactionSigner } from './transaction-signer';

/**
 * Removes all duplicated {@link MessageSigner | MessageSigners} and
 * {@link TransactionSigner | TransactionSigners} from a provided array
 * by comparing their {@link Address | addresses}.
 *
 * @internal
 */
export function deduplicateSigners<TSigner extends MessageSigner | TransactionSigner>(
    signers: readonly TSigner[],
): readonly TSigner[] {
    const deduplicated: Record<Address, TSigner> = {};
    signers.forEach(signer => {
        if (!deduplicated[signer.address]) {
            deduplicated[signer.address] = signer;
        } else if (!signersAreEquivalent(deduplicated[signer.address], signer)) {
            throw new SolanaError(SOLANA_ERROR__SIGNER__ADDRESS_CANNOT_HAVE_MULTIPLE_SIGNERS, {
                address: signer.address,
            });
        }
    });
    return Object.values(deduplicated);
}

function signersAreEquivalent(a: MessageSigner | TransactionSigner, b: MessageSigner | TransactionSigner): boolean {
    if (a === b) return true;
    const aKeys = Object.getOwnPropertyNames(a);
    const bKeys = Object.getOwnPropertyNames(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(key => {
        if (!(key in b)) return false;
        const aVal = (a as Record<string, unknown>)[key];
        const bVal = (b as Record<string, unknown>)[key];
        if (typeof aVal === 'function' && typeof bVal === 'function') {
            return aVal.toString() === bVal.toString();
        }
        return aVal === bVal;
    });
}
