import type { Wallet, WalletAccount, WalletVersion } from '@wallet-standard/base';
import { StandardConnect, StandardDisconnect } from '@wallet-standard/features';
import {
    SolanaSignAndSendTransaction,
    SolanaSignMessage,
    SolanaSignTransaction,
} from '@solana/wallet-standard-features';

import { createWalletStandardConnector, getWalletStandardConnectors, watchWalletStandardConnectors } from '../wallet/standard';
import type { WalletConnector, WalletStandardConnectorMetadata } from '../client/types';

 jest.mock('@solana/addresses', () => ({
     address: (input: string) => input,
 }));
 
 jest.mock('@solana/codecs-strings', () => {
     const decoder = { decode: jest.fn((value: string) => `decoded:${value}`) };
     return {
         __esModule: true,
         getBase58Decoder: () => decoder,
     };
 });
 
 jest.mock('@solana/transactions', () => {
     const decoder = { decode: jest.fn(() => ({ decoded: true })) };
     const encoder = { encode: jest.fn(() => new Uint8Array([9, 9, 9])) };
     return {
         __esModule: true,
         getTransactionDecoder: () => decoder,
         getTransactionEncoder: () => encoder,
     };
 });
 
 const { getBase58Decoder } = jest.requireMock('@solana/codecs-strings') as {
     getBase58Decoder(): { decode: jest.Mock };
 };
 const { getTransactionDecoder, getTransactionEncoder } = jest.requireMock('@solana/transactions') as {
     getTransactionDecoder(): { decode: jest.Mock };
     getTransactionEncoder(): { encode: jest.Mock };
 };
 const mockBase58Decoder = getBase58Decoder();
 const mockTransactionEncoder = getTransactionEncoder();
 const mockTransactionDecoder = getTransactionDecoder();

const listeners: Record<'register' | 'unregister', Array<() => void>> = {
    register: [],
    unregister: [],
};

const mockWallets: Wallet[] = [];

const on = jest.fn((event: 'register' | 'unregister', handler: () => void) => {
    listeners[event].push(handler);
    return () => {
        const index = listeners[event].indexOf(handler);
        if (index !== -1) {
            listeners[event].splice(index, 1);
        }
    };
});

jest.mock('@wallet-standard/app', () => ({
    getWallets: () => ({
        get: () => mockWallets,
        on,
    }),
}));

function createWallet(
    name: string,
    overrides: Partial<Omit<Wallet, 'accounts' | 'features' | 'chains'>> & {
        accounts?: WalletAccount[];
        chains?: Wallet['chains'];
        features?: Wallet['features'];
    } = {},
): Wallet {
    const accounts = overrides.accounts ?? [
        {
            address: `${name}-address`,
            chains: ['solana:mainnet-beta'],
            features: [],
            publicKey: new Uint8Array([1, 2, 3]),
        },
    ];
    const wallet: Wallet = {
        accounts,
        chains: overrides.chains ?? ['solana:mainnet-beta'],
        features: overrides.features ?? {},
        icon:
            overrides.icon ??
            'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==',
        name,
        version: (overrides.version ?? '1.0.0') as WalletVersion,
    };
    return wallet;
}

describe('wallet standard connectors', () => {
    beforeEach(() => {
        mockBase58Decoder.decode.mockImplementation((value: string) => `decoded:${value}`);
        mockTransactionEncoder.encode.mockImplementation(() => new Uint8Array([9, 9, 9]));
        mockTransactionDecoder.decode.mockImplementation(() => ({ decoded: true }));
        mockBase58Decoder.decode.mockClear();
        mockTransactionEncoder.encode.mockClear();
        mockTransactionDecoder.decode.mockClear();
        mockWallets.length = 0;
        listeners.register.length = 0;
        listeners.unregister.length = 0;
        on.mockImplementation((event: 'register' | 'unregister', handler: () => void) => {
            listeners[event].push(handler);
            return () => {
                const index = listeners[event].indexOf(handler);
                if (index !== -1) {
                    listeners[event].splice(index, 1);
                }
            };
        });
        on.mockClear();
        // Remove any window set by previous tests.
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (globalThis as { window?: unknown }).window;
    });

    it('creates a connector that delegates to wallet-standard features', async () => {
        const connect = jest.fn().mockResolvedValue({ accounts: [] });
        const disconnect = jest.fn().mockResolvedValue(undefined);
        const signMessage = jest.fn().mockResolvedValue([{ signature: new Uint8Array([7, 7]) }]);
        const signTransaction = jest.fn().mockResolvedValue([{ signedTransaction: new Uint8Array([1, 2, 3]) }]);
        const signAndSendTransaction = jest.fn().mockResolvedValue([{ signature: 'abc' }]);

        const wallet = createWallet('Phantom', {
            accounts: [
                {
                    address: 'phantom-address',
                    chains: ['solana:mainnet-beta'],
                    features: [],
                    publicKey: new Uint8Array([4, 5, 6]),
                },
            ],
            features: {
                [StandardConnect]: { connect },
                [StandardDisconnect]: { disconnect },
                [SolanaSignMessage]: { signMessage },
                [SolanaSignTransaction]: { signTransaction },
                [SolanaSignAndSendTransaction]: { signAndSendTransaction },
            },
        });

        (globalThis as { window?: unknown }).window = {};
        const connector = createWalletStandardConnector(wallet);
        expect(connector).toMatchObject<WalletConnector>({
            canAutoConnect: true,
            icon: wallet.icon,
            id: 'phantom',
            name: 'Phantom',
        });
        expect(connector.isSupported()).toBe(true);

        const session = await connector.connect();
        expect(connect).toHaveBeenCalledWith({ silent: undefined });
        expect(session.connector.id).toBe('phantom');
        expect(session.account.address).toBe('phantom-address');

        await session.signMessage?.(new Uint8Array([1, 2, 3]));
        expect(signMessage).toHaveBeenCalledWith({
            account: wallet.accounts[0],
            message: new Uint8Array([1, 2, 3]),
        });

        const dummyTransaction = new Uint8Array([10, 20, 30]) as unknown as Parameters<NonNullable<typeof session.signTransaction>>[0];
        const signedTransaction = await session.signTransaction?.(dummyTransaction);
        expect(mockTransactionEncoder.encode).toHaveBeenCalledWith(dummyTransaction);
        const encodedTransaction = mockTransactionEncoder.encode.mock.results[0]?.value as Uint8Array;
        expect(encodedTransaction).toEqual(new Uint8Array([9, 9, 9]));
        expect(signTransaction).toHaveBeenCalledWith({
            account: wallet.accounts[0],
            chain: 'solana:mainnet-beta',
            transaction: encodedTransaction,
        });
        expect(mockTransactionDecoder.decode).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
        expect(signedTransaction).toEqual({ decoded: true });

        const signature = await session.sendTransaction?.(dummyTransaction, { commitment: 'finalized' });
        const encodedSendTransaction = mockTransactionEncoder.encode.mock.results[1]?.value as Uint8Array;
        expect(encodedSendTransaction).toEqual(new Uint8Array([9, 9, 9]));
        expect(signAndSendTransaction).toHaveBeenCalledWith({
            account: wallet.accounts[0],
            chain: 'solana:mainnet-beta',
            options: { commitment: 'finalized' },
            transaction: encodedSendTransaction,
        });
        expect(mockBase58Decoder.decode).toHaveBeenCalledWith('abc');
        expect(signature).toBe('decoded:abc');

        await session.disconnect();
        expect(disconnect).toHaveBeenCalledTimes(1);

        await connector.disconnect();
        expect(disconnect).toHaveBeenCalledTimes(2);
    });

    it('applies metadata overrides and omits unsupported features', async () => {
        const wallet = createWallet('Backpack', {
            features: {
                [StandardConnect]: { connect: jest.fn().mockResolvedValue({ accounts: [] }) },
            },
        });

        const overrides: WalletStandardConnectorMetadata = {
            canAutoConnect: false,
            defaultChain: 'solana:devnet',
            icon: 'override-icon',
            id: 'custom-id',
            name: 'Custom Name',
        };

        const connector = createWalletStandardConnector(wallet, overrides);
        expect(connector).toMatchObject({
            canAutoConnect: false,
            icon: 'override-icon',
            id: 'custom-id',
            name: 'Custom Name',
        });

        const session = await connector.connect();
        expect(session.signMessage).toBeUndefined();
        expect(session.signTransaction).toBeUndefined();
        expect(session.sendTransaction).toBeUndefined();
        await session.disconnect();
    });

    it('retrieves and watches connectors through the Wallet Standard registry', () => {
        const phantomWallet = createWallet('Phantom', {
            features: {
                [StandardConnect]: { connect: jest.fn().mockResolvedValue({ accounts: [] }) },
            },
        });
        const phantomDuplicate = createWallet('Phantom', {
            features: {
                [StandardConnect]: { connect: jest.fn().mockResolvedValue({ accounts: [] }) },
            },
        });
        const solflareWallet = createWallet('Solflare', {
            features: {
                [StandardConnect]: { connect: jest.fn().mockResolvedValue({ accounts: [] }) },
            },
        });
        mockWallets.push(phantomWallet, phantomDuplicate, solflareWallet);

        const connectors = getWalletStandardConnectors();
        expect(connectors.map(connector => connector.id)).toEqual(['phantom', 'solflare']);

        const onChange = jest.fn();
        const unwatch = watchWalletStandardConnectors(onChange);
        expect(on).toHaveBeenCalledWith('register', expect.any(Function));
        expect(on).toHaveBeenCalledWith('unregister', expect.any(Function));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].map((connector: WalletConnector) => connector.id)).toEqual(['phantom', 'solflare']);

        mockWallets.push(
            createWallet('Backpack', {
                features: {
                    [StandardConnect]: { connect: jest.fn().mockResolvedValue({ accounts: [] }) },
                },
            }),
        );
        const registerHandler = on.mock.calls.find(([event]) => event === 'register')?.[1] as (() => void) | undefined;
        expect(registerHandler).toEqual(expect.any(Function));
        registerHandler?.();
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0].map((connector: WalletConnector) => connector.id)).toEqual([
            'phantom',
            'solflare',
            'backpack',
        ]);

        mockWallets.pop();
        const unregisterHandler = on.mock.calls.find(([event]) => event === 'unregister')?.[1] as (() => void) | undefined;
        expect(unregisterHandler).toEqual(expect.any(Function));
        unregisterHandler?.();
        expect(onChange).toHaveBeenCalledTimes(3);
        expect(onChange.mock.calls[2][0].map((connector: WalletConnector) => connector.id)).toEqual(['phantom', 'solflare']);

        unwatch();
        expect(listeners.register).toHaveLength(0);
        expect(listeners.unregister).toHaveLength(0);
    });
});
