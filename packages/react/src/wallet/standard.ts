import { address } from '@solana/addresses';
import { getBase58Decoder } from '@solana/codecs-strings';
import type { Signature } from '@solana/keys';
import type { SendableTransaction, Transaction } from '@solana/transactions';
import { getTransactionDecoder, getTransactionEncoder } from '@solana/transactions';
import type {
    SolanaSignAndSendTransactionFeature,
    SolanaSignMessageFeature,
    SolanaSignTransactionFeature,
} from '@solana/wallet-standard-features';
import {
    SolanaSignAndSendTransaction,
    SolanaSignMessage,
    SolanaSignTransaction,
} from '@solana/wallet-standard-features';
import { getWallets } from '@wallet-standard/app';
import type { IdentifierString, Wallet, WalletAccount as WalletStandardAccount } from '@wallet-standard/base';
import type { StandardConnectFeature, StandardDisconnectFeature } from '@wallet-standard/features';
import { StandardConnect, StandardDisconnect } from '@wallet-standard/features';

import type { WalletAccount, WalletConnector, WalletConnectorMetadata, WalletSession } from '../client/types';

export type WalletStandardConnectorMetadata = Readonly<{
    canAutoConnect?: boolean;
    defaultChain?: IdentifierString;
    icon?: string;
    id?: string;
    name?: string;
}>;

type CommitmentLike = 'confirmed' | 'finalized' | 'processed';

const base58Decoder = getBase58Decoder();
const transactionDecoder = getTransactionDecoder();
const transactionEncoder = getTransactionEncoder();

/**
 * Derives a connector identifier from a wallet instance.
 */
function deriveConnectorId(wallet: Wallet): string {
    return wallet.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Returns the primary account exposed by a wallet.
 */
function getPrimaryAccount(accounts: readonly WalletStandardAccount[]): WalletStandardAccount {
    const primary = accounts[0];
    if (!primary) {
        throw new Error('Wallet returned no accounts.');
    }
    return primary;
}

/**
 * Maps an arbitrary commitment value to the limited subset supported by Wallet Standard.
 */
function mapCommitment(commitment: unknown): CommitmentLike | undefined {
    if (commitment === 'processed' || commitment === 'confirmed' || commitment === 'finalized') {
        return commitment;
    }
    return undefined;
}

/**
 * Converts a Wallet Standard account into the client {@link WalletAccount} shape.
 */
function toSessionAccount(walletAccount: WalletStandardAccount): WalletAccount {
    return {
        address: address(walletAccount.address),
        label: walletAccount.label,
        publicKey: new Uint8Array(walletAccount.publicKey),
    };
}

/**
 * Selects the preferred chain, if any, from a wallet account.
 */
function getChain(account: WalletStandardAccount): IdentifierString | undefined {
    const [preferred] = account.chains ?? [];
    return preferred;
}

/**
 * Disconnects the provided wallet when supported by the feature set.
 */
async function disconnectWallet(wallet: Wallet): Promise<void> {
    const disconnectFeature = wallet.features[StandardDisconnect] as
        | StandardDisconnectFeature[typeof StandardDisconnect]
        | undefined;
    if (disconnectFeature) {
        await disconnectFeature.disconnect();
    }
}

/**
 * Build a connector function that adheres to the Wallet Standard API.
 *
 * @param wallet - Wallet Standard implementation retrieved from `getWallets`.
 * @param options - Optional overrides that customise the exposed connector metadata and defaults.
 * @returns A connector compatible with the Solana React client.
 */
export function createWalletStandardConnector(
    wallet: Wallet,
    options: WalletStandardConnectorMetadata = {},
): WalletConnector {
    const metadata: WalletConnectorMetadata = {
        canAutoConnect: options.canAutoConnect ?? Boolean(wallet.features[StandardConnect]),
        icon: options.icon ?? wallet.icon,
        id: options.id ?? deriveConnectorId(wallet),
        name: options.name ?? wallet.name,
    };

    async function connect(connectionOptions: Readonly<{ autoConnect?: boolean }> = {}): Promise<WalletSession> {
        const connectFeature = wallet.features[StandardConnect] as
            | StandardConnectFeature[typeof StandardConnect]
            | undefined;
        const shouldConnectSilently = Boolean(connectionOptions.autoConnect);
        let walletAccounts = wallet.accounts;
        if (connectFeature) {
            const { accounts } = await connectFeature.connect({
                silent: shouldConnectSilently || undefined,
            });
            if (accounts.length) {
                walletAccounts = accounts;
            }
        }

        const primaryAccount = getPrimaryAccount(walletAccounts);
        const sessionAccount = toSessionAccount(primaryAccount);

        const signMessageFeature = wallet.features[SolanaSignMessage] as
            | SolanaSignMessageFeature[typeof SolanaSignMessage]
            | undefined;
        const signTransactionFeature = wallet.features[SolanaSignTransaction] as
            | SolanaSignTransactionFeature[typeof SolanaSignTransaction]
            | undefined;
        const signAndSendFeature = wallet.features[SolanaSignAndSendTransaction] as
            | SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction]
            | undefined;

        const resolvedChain = options.defaultChain ?? getChain(primaryAccount);

        const signMessage = signMessageFeature
            ? async (message: Uint8Array) => {
                  const [output] = await signMessageFeature.signMessage({
                      account: primaryAccount,
                      message,
                  });
                  return output.signature;
              }
            : undefined;

        const signTransaction = signTransactionFeature
            ? async (transaction: SendableTransaction & Transaction) => {
                  const wireBytes = new Uint8Array(transactionEncoder.encode(transaction));
                  const request = resolvedChain
                      ? {
                            account: primaryAccount,
                            chain: resolvedChain,
                            transaction: wireBytes,
                        }
                      : {
                            account: primaryAccount,
                            transaction: wireBytes,
                        };
                  const [output] = await signTransactionFeature.signTransaction(request);
                  return transactionDecoder.decode(output.signedTransaction) as SendableTransaction & Transaction;
              }
            : undefined;

        const sendTransaction = signAndSendFeature
            ? async (transaction: SendableTransaction & Transaction, config?: Readonly<{ commitment?: unknown }>) => {
                  const wireBytes = new Uint8Array(transactionEncoder.encode(transaction));
                  const chain: IdentifierString = options.defaultChain ?? getChain(primaryAccount) ?? 'solana:mainnet-beta';
                  const [output] = await signAndSendFeature.signAndSendTransaction({
                      account: primaryAccount,
                      chain,
                      options: {
                          commitment: mapCommitment(config?.commitment),
                      },
                      transaction: wireBytes,
                  });
                  return base58Decoder.decode(output.signature) as Signature;
              }
            : undefined;

        async function disconnectSession(): Promise<void> {
            await disconnectWallet(wallet);
        }

        return {
            account: sessionAccount,
            connector: metadata,
            disconnect: disconnectSession,
            sendTransaction,
            signMessage,
            signTransaction,
        };
    }

    async function disconnect(): Promise<void> {
        await disconnectWallet(wallet);
    }

    function isSupported(): boolean {
        return typeof window !== 'undefined';
    }

    return {
        ...metadata,
        connect,
        disconnect,
        isSupported,
    };
}

/**
 * Maps a wallet instance to a connector, applying optional overrides.
 */
function mapWalletToConnector(
    wallet: Wallet,
    overrides?: (wallet: Wallet) => WalletStandardConnectorMetadata | undefined,
): WalletConnector {
    return createWalletStandardConnector(wallet, overrides?.(wallet));
}

export type WalletStandardDiscoveryOptions = Readonly<{
    overrides?: (wallet: Wallet) => WalletStandardConnectorMetadata | undefined;
}>;

/**
 * Retrieve connectors for all wallets currently registered with Wallet Standard.
 *
 * @param options - Optional discovery configuration that adjusts metadata for discovered wallets.
 * @returns A deduplicated array of wallet connectors.
 */
export function getWalletStandardConnectors(options: WalletStandardDiscoveryOptions = {}): readonly WalletConnector[] {
    const { get } = getWallets();
    const connectors = get().map(wallet => mapWalletToConnector(wallet, options.overrides));

    const seen = new Set<string>();
    return connectors.filter(connector => {
        if (seen.has(connector.id)) {
            return false;
        }
        seen.add(connector.id);
        return true;
    });
}

/**
 * Watch Wallet Standard registrations and emit new connector lists whenever the set changes.
 *
 * @param onChange - Callback invoked with the updated connector list after each registration event.
 * @param options - Optional discovery configuration that adjusts metadata for discovered wallets.
 * @returns Cleanup function that unsubscribes from Wallet Standard events.
 */
export function watchWalletStandardConnectors(
    onChange: (connectors: readonly WalletConnector[]) => void,
    options: WalletStandardDiscoveryOptions = {},
): () => void {
    const { get, on } = getWallets();
    const emit = () => {
        const connectors = get().map(wallet => mapWalletToConnector(wallet, options.overrides));

        const seen = new Set<string>();
        const deduplicated = connectors.filter(connector => {
            if (seen.has(connector.id)) {
                return false;
            }
            seen.add(connector.id);
            return true;
        });

        onChange(deduplicated);
    };
    emit();
    const offRegister = on('register', emit);
    const offUnregister = on('unregister', emit);
    return () => {
        offRegister();
        offUnregister();
    };
}
