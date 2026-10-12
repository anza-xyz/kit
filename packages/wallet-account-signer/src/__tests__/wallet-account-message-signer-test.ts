import type { Address } from '@solana/addresses';
import { address, getPublicKeyFromAddress } from '@solana/addresses';
import { bytesEqual } from '@solana/codecs-core';
import {
    SOLANA_ERROR__WALLET__INVALID_MESSAGE_SIGNATURE,
    SOLANA_ERROR__WALLET__INVALID_NUMBER_OF_OUTPUTS,
    SolanaError,
} from '@solana/errors';
import { type SignatureBytes, verifySignature } from '@solana/keys';
import type { SignableMessage } from '@solana/signers';
import { SolanaSignMessage, SolanaSignMessageFeature } from '@solana/wallet-standard-features';
import type { Wallet } from '@wallet-standard/base';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount, getWalletForHandle } from '@wallet-standard/ui-registry';

import { createMessageSignerFromWalletAccount } from '../wallet-account-message-signer';

jest.mock('@solana/addresses');
jest.mock('@solana/keys', () => ({
    ...jest.requireActual('@solana/keys'),
    verifySignature: jest.fn(),
}));
jest.mock('@wallet-standard/ui');
jest.mock('@wallet-standard/ui-registry');
jest.mock('@solana/codecs-core');

describe('createMessageSignerFromWalletAccount', () => {
    const mockAddress = 'Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy' as Address;

    function createMockAccount(overrides: Partial<UiWalletAccount> = {}): UiWalletAccount {
        return {
            address: mockAddress,
            chains: ['solana:devnet'],
            features: [SolanaSignMessage],
            ...overrides,
        } as unknown as UiWalletAccount;
    }

    const mockPublicKey = { mockPublicKey: true } as unknown as CryptoKey;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(address).mockImplementation(addr => addr as Address);
        jest.mocked(getPublicKeyFromAddress).mockResolvedValue(mockPublicKey);
        jest.mocked(verifySignature).mockResolvedValue(true);
        jest.mocked(getWalletForHandle).mockReturnValue({
            name: 'Test Wallet',
        } as Wallet);
    });

    function setUpWallet(outputs: { signature: Uint8Array; signedMessage: Uint8Array }[]) {
        const mockFeature = { signMessage: jest.fn().mockResolvedValue(outputs) };
        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount>,
        );
        return mockFeature;
    }

    it('verifies the signature against the account and the signed message', async () => {
        expect.assertions(2);

        // Given a wallet that signs a message.
        const signature = new Uint8Array(64).fill(1);
        const signedMessage = new Uint8Array([1, 2, 3]);
        setUpWallet([{ signature, signedMessage }]);

        // When we sign a message with a signer created from the wallet account.
        const signer = createMessageSignerFromWalletAccount(createMockAccount());
        await signer.modifyAndSignMessages([{ content: new Uint8Array([1, 2, 3]), signatures: {} } as SignableMessage]);

        // Then the account's public key is derived from its address.
        expect(getPublicKeyFromAddress).toHaveBeenCalledWith(mockAddress);

        // And the signature is verified against it and the signed message.
        expect(verifySignature).toHaveBeenCalledWith(mockPublicKey, signature, signedMessage);
    });

    it('verifies the signature against the signed message when the wallet modifies the message', async () => {
        expect.assertions(1);

        // Given a wallet that modifies the message before signing it.
        const signature = new Uint8Array(64).fill(1);
        const signedMessage = new Uint8Array([9, 1, 2, 3]);
        setUpWallet([{ signature, signedMessage }]);

        // When we sign a message with a signer created from the wallet account.
        const signer = createMessageSignerFromWalletAccount(createMockAccount());
        await signer.modifyAndSignMessages([{ content: new Uint8Array([1, 2, 3]), signatures: {} } as SignableMessage]);

        // Then the signature is verified against the message the wallet signed.
        expect(verifySignature).toHaveBeenCalledWith(mockPublicKey, signature, signedMessage);
    });

    it('rejects when the wallet returns a signature that does not verify', async () => {
        expect.assertions(1);

        // Given a wallet that returns a signature that does not verify.
        setUpWallet([{ signature: new Uint8Array(64).fill(1), signedMessage: new Uint8Array([1, 2, 3]) }]);
        jest.mocked(verifySignature).mockResolvedValue(false);

        // When we sign a message with a signer created from the wallet account.
        const signer = createMessageSignerFromWalletAccount(createMockAccount());
        const promise = signer.modifyAndSignMessages([
            { content: new Uint8Array([1, 2, 3]), signatures: {} } as SignableMessage,
        ]);

        // Then it rejects with an invalid message signature error.
        await expect(promise).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__WALLET__INVALID_MESSAGE_SIGNATURE, {
                address: mockAddress,
                walletName: 'Test Wallet',
            }),
        );
    });

    it("derives the account's public key once for all of the messages", async () => {
        expect.assertions(2);

        // Given a wallet that signs two messages.
        setUpWallet([
            { signature: new Uint8Array(64).fill(1), signedMessage: new Uint8Array([1, 2, 3]) },
            { signature: new Uint8Array(64).fill(2), signedMessage: new Uint8Array([4, 5, 6]) },
        ]);

        // When we sign both messages.
        const signer = createMessageSignerFromWalletAccount(createMockAccount());
        await signer.modifyAndSignMessages([
            { content: new Uint8Array([1, 2, 3]), signatures: {} },
            { content: new Uint8Array([4, 5, 6]), signatures: {} },
        ] as SignableMessage[]);

        // Then the public key is derived once.
        expect(getPublicKeyFromAddress).toHaveBeenCalledTimes(1);

        // And both signatures are verified against it.
        expect(verifySignature).toHaveBeenCalledTimes(2);
    });

    it('rejects when aborted while the signatures are being verified', async () => {
        expect.assertions(1);

        // Given a wallet that signs a message.
        setUpWallet([{ signature: new Uint8Array(64).fill(1), signedMessage: new Uint8Array([1, 2, 3]) }]);

        // And a signature verification that does not settle until the operation is aborted.
        const abortController = new AbortController();
        jest.mocked(verifySignature).mockImplementation(() => {
            abortController.abort(new Error('o no'));
            return new Promise(() => {});
        });

        // When we sign a message with a signer created from the wallet account.
        const signer = createMessageSignerFromWalletAccount(createMockAccount());
        const promise = signer.modifyAndSignMessages(
            [{ content: new Uint8Array([1, 2, 3]), signatures: {} } as SignableMessage],
            { abortSignal: abortController.signal },
        );

        // Then it rejects with the abort reason, without waiting for the verification.
        await expect(promise).rejects.toThrow(new Error('o no'));
    });

    it.each([
        ['fewer', 1],
        ['more', 3],
    ])('rejects when the wallet returns %s outputs than messages', async (_, numberOfOutputs) => {
        expect.assertions(1);

        // Given a wallet that returns a different number of outputs than the messages it was given.
        setUpWallet(
            Array.from({ length: numberOfOutputs }, () => ({
                signature: new Uint8Array(64).fill(1),
                signedMessage: new Uint8Array([1, 2, 3]),
            })),
        );

        // When we sign two messages.
        const signer = createMessageSignerFromWalletAccount(createMockAccount());
        const promise = signer.modifyAndSignMessages([
            { content: new Uint8Array([1, 2, 3]), signatures: {} },
            { content: new Uint8Array([4, 5, 6]), signatures: {} },
        ] as SignableMessage[]);

        // Then it rejects with an invalid number of outputs error.
        await expect(promise).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__WALLET__INVALID_NUMBER_OF_OUTPUTS, {
                actual: numberOfOutputs,
                expected: 2,
                featureName: SolanaSignMessage,
                walletName: 'Test Wallet',
            }),
        );
    });

    it('rejects when any of the signatures does not verify', async () => {
        expect.assertions(1);

        // Given a wallet that signs two messages, where only the second signature does not verify.
        setUpWallet([
            { signature: new Uint8Array(64).fill(1), signedMessage: new Uint8Array([1, 2, 3]) },
            { signature: new Uint8Array(64).fill(2), signedMessage: new Uint8Array([4, 5, 6]) },
        ]);
        jest.mocked(verifySignature).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

        // When we sign both messages.
        const signer = createMessageSignerFromWalletAccount(createMockAccount());
        const promise = signer.modifyAndSignMessages([
            { content: new Uint8Array([1, 2, 3]), signatures: {} },
            { content: new Uint8Array([4, 5, 6]), signatures: {} },
        ] as SignableMessage[]);

        // Then it rejects with an invalid message signature error.
        await expect(promise).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__WALLET__INVALID_MESSAGE_SIGNATURE, {
                address: mockAddress,
                walletName: 'Test Wallet',
            }),
        );
    });

    it('rejects when the wallet returns a signature of the wrong length', async () => {
        expect.assertions(2);

        // Given a wallet that returns a signature that is not 64 bytes long.
        setUpWallet([{ signature: new Uint8Array(63).fill(1), signedMessage: new Uint8Array([1, 2, 3]) }]);

        // When we sign a message with a signer created from the wallet account.
        const signer = createMessageSignerFromWalletAccount(createMockAccount());
        const promise = signer.modifyAndSignMessages([
            { content: new Uint8Array([1, 2, 3]), signatures: {} } as SignableMessage,
        ]);

        // Then it rejects with an invalid message signature error.
        await expect(promise).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__WALLET__INVALID_MESSAGE_SIGNATURE, {
                address: mockAddress,
                walletName: 'Test Wallet',
            }),
        );

        // And the signature is never verified.
        expect(verifySignature).not.toHaveBeenCalled();
    });

    it("returns copies of the wallet's output, so the wallet cannot change it after it is verified", async () => {
        expect.assertions(2);

        // Given a wallet that signs a message.
        const signature = new Uint8Array(64).fill(1);
        const signedMessage = new Uint8Array([1, 2, 3]);
        setUpWallet([{ signature, signedMessage }]);

        // And which changes its output once the signature has been verified.
        jest.mocked(verifySignature).mockImplementation(() => {
            signature.fill(2);
            signedMessage.fill(4);
            return Promise.resolve(true);
        });

        // When we sign a message with a signer created from the wallet account.
        const signer = createMessageSignerFromWalletAccount(createMockAccount());
        const [result] = await signer.modifyAndSignMessages([
            { content: new Uint8Array([1, 2, 3]), signatures: {} } as SignableMessage,
        ]);

        // Then the result contains the signature and message that were verified.
        expect(result.content).toEqual(new Uint8Array([1, 2, 3]));
        expect(result.signatures[mockAddress]).toEqual(new Uint8Array(64).fill(1));
    });

    it('exposes the correct address', () => {
        // Given a wallet account with a known address.
        const account = createMockAccount({ address: mockAddress });

        // And a mock wallet feature.
        const mockFeature: SolanaSignMessageFeature['solana:signMessage'] = {
            signMessage: jest.fn().mockResolvedValue([]),
        } as unknown as SolanaSignMessageFeature['solana:signMessage'];

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount>,
        );

        // When we create a signer from the account.
        const signer = createMessageSignerFromWalletAccount(account);

        // Then the signer exposes the same address.
        expect(signer.address).toBe(mockAddress);
    });

    it('returns empty array when no messages are provided', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock wallet feature.
        const mockFeature = {
            signMessage: jest.fn().mockResolvedValue([]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount>,
        );

        // When we create a signer and call modifyAndSignMessages with an empty array.
        const signer = createMessageSignerFromWalletAccount(account);

        // Then it returns an empty array.
        await expect(signer.modifyAndSignMessages([])).resolves.toEqual([]);
    });

    it('forwards messages to wallet feature', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock wallet feature that returns a signed message.
        const mockFeature = {
            signMessage: jest
                .fn()
                .mockResolvedValue([
                    { signature: new Uint8Array(64).fill(1), signedMessage: new Uint8Array([1, 2, 3]) },
                ]),
        };

        const mockWalletAccount = { mockWalletAccount: 1 } as unknown as ReturnType<
            typeof getWalletAccountForUiWalletAccount
        >;
        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(mockWalletAccount);

        // When we create a signer and call modifyAndSignMessages.
        const signer = createMessageSignerFromWalletAccount(account);
        const message = {
            content: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as SignableMessage;
        await signer.modifyAndSignMessages([message]);

        // Then the wallet feature's signMessage method is called.
        expect(mockFeature.signMessage).toHaveBeenCalledWith({ account: mockWalletAccount, message: message.content });
    });

    it('propagates wallet errors', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock wallet feature that rejects with an error.
        const mockFeature = {
            signMessage: jest.fn().mockRejectedValue(new Error('fail')),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount>,
        );

        // When we create a signer and call modifyAndSignMessages.
        const signer = createMessageSignerFromWalletAccount(account);
        const message = {
            content: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as SignableMessage;

        // Then the wallet error is propagated.
        await expect(signer.modifyAndSignMessages([message])).rejects.toThrow('fail');
    });

    it('handles multiple messages in a single call', async () => {
        expect.assertions(2);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock wallet feature that returns signed messages.
        const mockFeature = {
            signMessage: jest.fn().mockResolvedValue([
                { signature: new Uint8Array(64).fill(1), signedMessage: new Uint8Array([1, 2, 3]) },
                { signature: new Uint8Array(64).fill(2), signedMessage: new Uint8Array([4, 5, 6]) },
            ]),
        };

        const mockWalletAccount = { mockWalletAccount: 1 } as unknown as ReturnType<
            typeof getWalletAccountForUiWalletAccount
        >;
        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(mockWalletAccount);

        // When we create a signer and call modifyAndSignMessages with multiple messages.
        const signer = createMessageSignerFromWalletAccount(account);
        const messages = [
            { content: new Uint8Array([1, 2, 3]), signatures: {} },
            { content: new Uint8Array([4, 5, 6]), signatures: {} },
        ] as SignableMessage[];

        const results = await signer.modifyAndSignMessages(messages);

        // Then the wallet feature is called once.
        expect(mockFeature.signMessage).toHaveBeenCalledWith(
            { account: mockWalletAccount, message: messages[0].content },
            { account: mockWalletAccount, message: messages[1].content },
        );

        // And we get the correct number of results.
        expect(results).toHaveLength(2);
    });

    it('returns same message object when signature and content are unchanged', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock wallet feature that returns the same message and signature.
        const mockFeature = {
            signMessage: jest
                .fn()
                .mockResolvedValue([
                    { signature: new Uint8Array(64).fill(9), signedMessage: new Uint8Array([1, 2, 3]) },
                ]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount>,
        );
        jest.mocked(bytesEqual).mockReturnValue(true);

        // When we create a signer and sign a message that already has the same signature.
        const signer = createMessageSignerFromWalletAccount(account);
        const inputMessage = {
            content: new Uint8Array([1, 2, 3]),
            signatures: {
                [mockAddress]: new Uint8Array(64).fill(9) as SignatureBytes,
            },
        } as SignableMessage;

        const [result] = await signer.modifyAndSignMessages([inputMessage]);

        // Then the result is the same object.
        expect(result).toBe(inputMessage);
    });

    it('returns new object when signature changes', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock wallet feature that returns a different signature.
        const mockFeature = {
            signMessage: jest
                .fn()
                .mockResolvedValue([
                    { signature: new Uint8Array(64).fill(8), signedMessage: new Uint8Array([1, 2, 3]) },
                ]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount>,
        );
        jest.mocked(bytesEqual).mockReturnValue(false);

        // When we create a signer and sign a message.
        const signer = createMessageSignerFromWalletAccount(account);
        const inputMessage = {
            content: new Uint8Array([1, 2, 3]),
            signatures: {
                [mockAddress]: new Uint8Array(64).fill(9) as SignatureBytes,
            },
        } as SignableMessage;

        const [result] = await signer.modifyAndSignMessages([inputMessage]);

        // Then the result is a different object.
        expect(result).not.toBe(inputMessage);
    });

    it('returns new object when content changes', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock wallet feature that returns a modified message.
        const mockFeature = {
            signMessage: jest
                .fn()
                .mockResolvedValue([
                    { signature: new Uint8Array(64).fill(9), signedMessage: new Uint8Array([2, 3, 4]) },
                ]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount>,
        );

        // When we create a signer and sign a message.
        const signer = createMessageSignerFromWalletAccount(account);
        const inputMessage = {
            content: new Uint8Array([1, 2, 3]),
            signatures: {
                [mockAddress]: new Uint8Array(64).fill(9) as SignatureBytes,
            },
        } as SignableMessage;

        const [result] = await signer.modifyAndSignMessages([inputMessage]);

        // Then the result is a different object.
        expect(result).not.toBe(inputMessage);
    });

    it('preserves existing signatures when message is not modified', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock wallet feature that returns the same message.
        const mockFeature = {
            signMessage: jest
                .fn()
                .mockResolvedValue([
                    { signature: new Uint8Array(64).fill(127), signedMessage: new Uint8Array([1, 2, 3]) },
                ]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount>,
        );

        // When we create a signer and sign a message that has other signatures.
        const signer = createMessageSignerFromWalletAccount(account);
        const inputMessage = {
            content: new Uint8Array([1, 2, 3]),
            signatures: {
                '11111111111111111111111111111114': new Uint8Array(64).fill(2) as SignatureBytes,
            },
        } as SignableMessage;

        const [result] = await signer.modifyAndSignMessages([inputMessage]);

        // Then the result preserves the existing signature.
        expect(result.signatures).toEqual({
            '11111111111111111111111111111114': new Uint8Array(64).fill(2) as SignatureBytes,
            [mockAddress]: new Uint8Array(64).fill(127) as SignatureBytes,
        });
    });

    it('clears existing signatures when message is modified', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock wallet feature that returns a modified message.
        const mockFeature = {
            signMessage: jest
                .fn()
                .mockResolvedValue([
                    { signature: new Uint8Array(64).fill(127), signedMessage: new Uint8Array([2, 3, 4]) },
                ]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount>,
        );

        // When we create a signer and sign a message that has other signatures.
        const signer = createMessageSignerFromWalletAccount(account);
        const inputMessage = {
            content: new Uint8Array([1, 2, 3]),
            signatures: {
                '11111111111111111111111111111114': new Uint8Array(64).fill(2) as SignatureBytes,
            },
        } as SignableMessage;

        const [result] = await signer.modifyAndSignMessages([inputMessage]);

        // Then the result only has the new signature.
        expect(result.signatures).toEqual({
            [mockAddress]: new Uint8Array(64).fill(127) as SignatureBytes,
        });
    });

    it('rejects when aborted', async () => {
        expect.assertions(1);

        // Given a wallet account.
        const account = createMockAccount();

        // And a mock wallet feature.
        const mockFeature = {
            signMessage: jest
                .fn()
                .mockResolvedValue([
                    { signature: new Uint8Array(64).fill(1), signedMessage: new Uint8Array([1, 2, 3]) },
                ]),
        };

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount>,
        );

        // When we create a signer.
        const signer = createMessageSignerFromWalletAccount(account);
        const message = {
            content: new Uint8Array([1, 2, 3]),
            signatures: {},
        } as SignableMessage;

        // And we call modifyAndSignMessages with an already aborted signal.
        const abortController = new AbortController();
        abortController.abort(new Error('o no'));
        const alreadyAbortedSignal = abortController.signal;

        // Then it rejects with the abort error.
        await expect(signer.modifyAndSignMessages([message], { abortSignal: alreadyAbortedSignal })).rejects.toThrow(
            new Error('o no'),
        );
    });
});
