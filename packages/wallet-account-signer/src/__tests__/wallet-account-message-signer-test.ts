import type { Address } from '@solana/addresses';
import { address } from '@solana/addresses';
import { bytesEqual } from '@solana/codecs-core';
import type { SignatureBytes } from '@solana/keys';
import type { SignableMessage } from '@solana/signers';
import { SolanaSignMessage, SolanaSignMessageFeature } from '@solana/wallet-standard-features';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';

import { createMessageSignerFromWalletAccount } from '../wallet-account-message-signer';

jest.mock('@solana/addresses');
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

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(address).mockImplementation(addr => addr as Address);
    });

    it('exposes the correct address', () => {
        // Given a wallet account with a known address.
        const account = createMockAccount({ address: mockAddress });

        // And a mock wallet feature.
        const mockFeature: SolanaSignMessageFeature['solana:signMessage'] = {
            signMessage: jest.fn().mockResolvedValue([]),
        } as unknown as SolanaSignMessageFeature['solana:signMessage'];

        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
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
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
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
            typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        >;
        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            mockWalletAccount,
        );

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
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
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
            typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        >;
        jest.mocked(getWalletAccountFeature).mockReturnValue(mockFeature);
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            mockWalletAccount,
        );

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
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
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
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
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
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
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
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
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
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
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
        jest.mocked(getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).mockReturnValue(
            {} as ReturnType<typeof getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED>,
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
