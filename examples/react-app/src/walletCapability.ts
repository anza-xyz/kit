import type { TransactionSendingSigner, TransactionSigner } from '@solana/kit';
import { isTransactionModifyingSigner, isTransactionPartialSigner, isTransactionSendingSigner } from '@solana/kit';
import type { WalletSigner } from '@solana/kit-plugin-wallet';
import { SolanaSignMessage } from '@solana/wallet-standard-features';
import type { UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountFeature } from '@wallet-standard/ui';

// The wallet plugin's `connected.signer` is typed `WalletSigner | null`: it is `null` for
// read-only wallets, and even when present its concrete capabilities depend on the wallet's
// features. The feature panels can't statically know a given wallet supports the capability they
// exercise, so they call these render-time asserts, which throw when the capability is missing.
// The surrounding `ErrorBoundary` then renders `FeatureNotSupportedCallout`
//
// Transaction capabilities are probed on the signer itself. Message signing is different: it goes
// through the account's `solana:signMessage` feature directly (see the plugin's `signMessage`), so
// it works for wallets that can sign messages but not transactions — which have no `WalletSigner` at all.
// Its capability therefore can't be read off the signer; it must be read off the account's feature
// list, which is the same source the plugin resolves against.

/**
 * Asserts that the connected wallet's signer can produce a signed transaction *without* sending
 * it — that is, it is a partial or modifying signer. Used by the "Sign Transaction" and "Partial
 * Sign Transaction" panels.
 *
 * A sending-only signer (an account with `solana:signAndSendTransaction` but not
 * `solana:signTransaction`) deliberately fails this assert even though it satisfies
 * `TransactionSigner`, because it doesn't work with those panels.
 */
export function assertCanSignTransactions(signer: WalletSigner | null): asserts signer is TransactionSigner {
    if (!signer || !(isTransactionModifyingSigner(signer) || isTransactionPartialSigner(signer))) {
        throw new Error('This account does not support signing transactions');
    }
}

/**
 * Asserts that the connected wallet's signer can sign *and send* transactions. Used by the "Sign
 * And Send Transaction" panel.
 */
export function assertCanSignAndSendTransactions(
    signer: WalletSigner | null,
): asserts signer is TransactionSendingSigner {
    if (!signer || !isTransactionSendingSigner(signer)) {
        throw new Error('This account does not support signing and sending transactions');
    }
}

/**
 * Asserts that the connected account can sign messages. Used by the "Sign Message" panel. Unlike
 * the transaction asserts, this probes the account's `solana:signMessage` feature (not a signer),
 * matching how the plugin resolves the feature — so it holds for wallets that sign messages but not
 * transactions.
 *
 * Delegates to `getWalletAccountFeature`, whose `WALLET_STANDARD_ERROR__FEATURES__
 * WALLET_ACCOUNT_FEATURE_UNIMPLEMENTED` error the app's `getErrorMessage` already renders with the
 * offending feature name — keeping this panel's unsupported-feature message consistent with the
 * other panels'.
 */
export function assertCanSignMessages(account: UiWalletAccount): void {
    getWalletAccountFeature(account, SolanaSignMessage);
}
