import { isSolanaError, SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES } from '@solana/errors';

import {
    assertIsClientWithAirdrop,
    assertIsClientWithFetchAccounts,
    assertIsClientWithGetMinimumBalance,
    assertIsClientWithIdentity,
    assertIsClientWithPayer,
    assertIsClientWithRpc,
    assertIsClientWithRpcSubscriptions,
    assertIsClientWithSubscribeToIdentity,
    assertIsClientWithSubscribeToPayer,
    assertIsClientWithTransactionPlanning,
    assertIsClientWithTransactionSending,
    isClientWithAirdrop,
    isClientWithFetchAccounts,
    isClientWithGetMinimumBalance,
    isClientWithIdentity,
    isClientWithPayer,
    isClientWithRpc,
    isClientWithRpcSubscriptions,
    isClientWithSubscribeToIdentity,
    isClientWithSubscribeToPayer,
    isClientWithTransactionPlanning,
    isClientWithTransactionSending,
} from '../client-assertions';

type ClientAssertion = (client: unknown) => void;
type ClientGuard = (client: unknown) => boolean;

type TestCase = Readonly<{
    assert: ClientAssertion;
    guard: ClientGuard;
    missingCapabilities: readonly string[];
    name: string;
    partialClient: object;
    validClient: object;
}>;

const TEST_CASES: readonly TestCase[] = [
    {
        assert: assertIsClientWithAirdrop,
        guard: isClientWithAirdrop,
        missingCapabilities: ['airdrop'],
        name: 'airdrop',
        partialClient: { airdrop: true },
        validClient: { airdrop() {} },
    },
    {
        assert: assertIsClientWithFetchAccounts,
        guard: isClientWithFetchAccounts,
        missingCapabilities: ['fetchAccounts'],
        name: 'fetch accounts',
        partialClient: { fetchAccounts: true },
        validClient: { fetchAccounts() {} },
    },
    {
        assert: assertIsClientWithGetMinimumBalance,
        guard: isClientWithGetMinimumBalance,
        missingCapabilities: ['getMinimumBalance'],
        name: 'minimum balance',
        partialClient: { getMinimumBalance: true },
        validClient: { getMinimumBalance() {} },
    },
    {
        assert: assertIsClientWithIdentity,
        guard: isClientWithIdentity,
        missingCapabilities: ['identity'],
        name: 'identity',
        partialClient: {},
        validClient: { identity: {} },
    },
    {
        assert: assertIsClientWithPayer,
        guard: isClientWithPayer,
        missingCapabilities: ['payer'],
        name: 'payer',
        partialClient: {},
        validClient: { payer: {} },
    },
    {
        assert: assertIsClientWithRpc,
        guard: isClientWithRpc,
        missingCapabilities: ['rpc'],
        name: 'RPC',
        partialClient: {},
        validClient: { rpc: {} },
    },
    {
        assert: assertIsClientWithRpcSubscriptions,
        guard: isClientWithRpcSubscriptions,
        missingCapabilities: ['rpcSubscriptions'],
        name: 'RPC subscriptions',
        partialClient: {},
        validClient: { rpcSubscriptions: {} },
    },
    {
        assert: assertIsClientWithSubscribeToIdentity,
        guard: isClientWithSubscribeToIdentity,
        missingCapabilities: ['subscribeToIdentity'],
        name: 'subscribe to identity',
        partialClient: { subscribeToIdentity: true },
        validClient: { subscribeToIdentity() {} },
    },
    {
        assert: assertIsClientWithSubscribeToPayer,
        guard: isClientWithSubscribeToPayer,
        missingCapabilities: ['subscribeToPayer'],
        name: 'subscribe to payer',
        partialClient: { subscribeToPayer: true },
        validClient: { subscribeToPayer() {} },
    },
    {
        assert: assertIsClientWithTransactionPlanning,
        guard: isClientWithTransactionPlanning,
        missingCapabilities: ['planTransactions'],
        name: 'transaction planning',
        partialClient: { planTransaction() {} },
        validClient: { planTransaction() {}, planTransactions() {} },
    },
    {
        assert: assertIsClientWithTransactionSending,
        guard: isClientWithTransactionSending,
        missingCapabilities: ['sendTransactions'],
        name: 'transaction sending',
        partialClient: { sendTransaction() {} },
        validClient: { sendTransaction() {}, sendTransactions() {} },
    },
];

function getMissingCapabilities(assertClient: ClientAssertion, client: unknown): readonly string[] {
    try {
        assertClient(client);
    } catch (error) {
        if (isSolanaError(error, SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES)) {
            return error.context.capabilities;
        }
        throw error;
    }
    throw new Error('Expected the client assertion to throw');
}

describe.each(TEST_CASES)(
    '$name client capability',
    ({ assert, guard, missingCapabilities, partialClient, validClient }) => {
        it('recognizes clients implementing the capability', () => {
            expect(guard(validClient)).toBe(true);
            expect(() => assert(validClient)).not.toThrow();
        });

        it('rejects clients missing part of the capability', () => {
            expect(guard(partialClient)).toBe(false);
            expect(getMissingCapabilities(assert, partialClient)).toEqual(missingCapabilities);
        });

        it('rejects non-object values', () => {
            expect(guard(null)).toBe(false);
            expect(guard(undefined)).toBe(false);
            expect(guard('client')).toBe(false);
        });
    },
);

describe('multi-method client capabilities', () => {
    it('reports every missing transaction-planning function', () => {
        expect(getMissingCapabilities(assertIsClientWithTransactionPlanning, {})).toEqual([
            'planTransaction',
            'planTransactions',
        ]);
    });
});

describe('property client capabilities', () => {
    it('does not invoke an installed payer getter', () => {
        const client = Object.defineProperty({}, 'payer', {
            get() {
                throw new Error('Wallet is disconnected');
            },
        });

        expect(isClientWithPayer(client)).toBe(true);
        expect(() => assertIsClientWithPayer(client)).not.toThrow();
    });
});
