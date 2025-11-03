import type { WalletConnector, WalletRegistry } from '../client/types';

/**
 * Creates an in-memory wallet registry from the provided connectors.
 *
 * @param connectors - Wallet connector implementations to register.
 * @returns A registry exposing iteration and lookup helpers.
 */
export function createWalletRegistry(connectors: readonly WalletConnector[]): WalletRegistry {
    const byId = new Map<string, WalletConnector>();
    for (const connector of connectors) {
        if (!byId.has(connector.id)) {
            byId.set(connector.id, connector);
        }
    }
    return {
        all: [...byId.values()],
        get(id: string) {
            return byId.get(id);
        },
    };
}
