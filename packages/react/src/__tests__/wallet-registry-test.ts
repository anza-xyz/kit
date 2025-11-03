import { createWalletRegistry } from '../wallet/registry';
import type { WalletConnector } from '../client/types';

function connector(id: string, name: string): WalletConnector {
    return {
        canAutoConnect: false,
        connect: jest.fn(),
        disconnect: jest.fn(),
        id,
        isSupported: () => true,
        name,
    };
}

describe('createWalletRegistry', () => {
    it('deduplicates connectors by identifier', () => {
        const alpha = connector('alpha', 'Alpha');
        const duplicate = connector('alpha', 'Alpha Duplicate');
        const beta = connector('beta', 'Beta');
        const registry = createWalletRegistry([alpha, duplicate, beta]);
        expect(registry.all).toEqual([alpha, beta]);
    });

    it('resolves connectors via the lookup helper', () => {
        const alpha = connector('alpha', 'Alpha');
        const beta = connector('beta', 'Beta');
        const registry = createWalletRegistry([alpha, beta]);
        expect(registry.get('alpha')).toBe(alpha);
        expect(registry.get('missing')).toBeUndefined();
    });
});
