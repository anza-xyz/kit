import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING, SolanaError } from '@solana/errors';
import {
    compileOffchainMessageEnvelope,
    FullySignedOffchainMessageEnvelope,
    OffchainMessageBytes,
    OffchainMessageEnvelope,
} from '@solana/offchain-messages';

import { partiallySignOffchainMessageWithSigners, signOffchainMessageWithSigners } from '../sign-offchain-message';
import {
    createMockMessageModifyingSigner,
    createMockMessagePartialSigner,
    createMockOffchainMessageWithSigners,
} from './__setup__';

jest.mock('@solana/offchain-messages', () => ({
    ...jest.requireActual('@solana/offchain-messages'),
    compileOffchainMessageEnvelope: jest.fn(),
}));

describe('partiallySignOffchainMessageWithSigners', () => {
    it('signs the message with its extracted signers', async () => {
        expect.assertions(3);

        // Given an offchain message with two signers A and B in its list of required signatories.
        const signerA = createMockMessageModifyingSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address);
        const signerB = createMockMessagePartialSigner('signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address);
        const offchainMessage = createMockOffchainMessageWithSigners([signerA, signerB]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {
                ['signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address]: null,
                ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address]: null,
            },
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // And given signer A and B are mocked to provide the following signatures.
        const modifiedOffchainMessage = {
            ...unsignedOffchainMessageEnvelope,
            signatures: {
                signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature',
                signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: null,
            },
        };
        signerA.modifyAndSignMessages.mockResolvedValueOnce([modifiedOffchainMessage]);
        signerB.signMessages.mockResolvedValueOnce([
            { signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature' },
        ]);

        // When we partially sign this message.
        const mockOptions = {
            abortSignal: AbortSignal.timeout(1_000_000),
        };
        const signedOffchainMessageEnvelope = await partiallySignOffchainMessageWithSigners(
            offchainMessage,
            mockOptions,
        );

        // Then it contains the expected signatures.
        expect(signedOffchainMessageEnvelope.signatures).toStrictEqual({
            signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature',
            signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature',
        });

        // And the signers were called with the expected parameters.
        expect(signerA.modifyAndSignMessages).toHaveBeenCalledWith([unsignedOffchainMessageEnvelope], mockOptions);
        expect(signerB.signMessages).toHaveBeenCalledWith([modifiedOffchainMessage], mockOptions);
    });

    it('signs modifying signers before partial signers', async () => {
        expect.assertions(2);

        // Given a modifying signer A and a partial signer B.
        const signerA = createMockMessageModifyingSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address);
        const signerB = createMockMessagePartialSigner('signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address);

        // And mock implementations for both signers such that they append events to an array.
        const events: string[] = [];
        signerA.modifyAndSignMessages.mockImplementation((messages: OffchainMessageEnvelope[]) => {
            events.push('signerA');
            return messages.map(message => ({
                ...message,
                signatures: {
                    signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:
                        'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature',
                },
            }));
        });
        signerB.signMessages.mockImplementation((messages: OffchainMessageEnvelope[]) => {
            events.push('signerB');
            return messages.map(() => ({
                signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature',
            }));
        });

        // And given an offchain message that contains these signers in its list of required signatories (in any order).
        const offchainMessage = createMockOffchainMessageWithSigners([signerB, signerA]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {
                ['signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address]: null,
                ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address]: null,
            },
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // When we partially sign this message.
        const signedOffchainMessageEnvelope = await partiallySignOffchainMessageWithSigners(offchainMessage);

        // Then the modifying signer was called before the partial signer.
        expect(events).toStrictEqual(['signerA', 'signerB']);

        // And it contains the expected signatures.
        expect(signedOffchainMessageEnvelope.signatures).toStrictEqual({
            signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature',
            signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature',
        });
    });

    it('signs modifying signers sequentially', async () => {
        expect.assertions(2);

        // Given two modifying signers A and B.
        const signerA = createMockMessageModifyingSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address);
        const signerB = createMockMessageModifyingSigner('signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address);

        // And mock implementations for both signers such that they append events to an array.
        const events: string[] = [];
        const mockImplementation =
            (signerId: string, address: string) => async (messages: OffchainMessageEnvelope[]) => {
                events.push(`${signerId} starts`);
                await new Promise(r => setTimeout(r, 500));
                events.push(`${signerId} ends`);
                return messages.map(message => ({
                    ...message,
                    signatures: { ...message.signatures, [address]: `${address}_signature` },
                }));
            };
        signerA.modifyAndSignMessages.mockImplementation(
            mockImplementation('signerA', 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
        );
        signerB.modifyAndSignMessages.mockImplementation(
            mockImplementation('signerB', 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'),
        );

        // And given an offchain message that contains these two signers in its list of required signatories.
        const offchainMessage = createMockOffchainMessageWithSigners([signerA, signerB]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {
                ['signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address]: null,
                ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address]: null,
            },
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // When we partially sign this message.
        const signedOffchainMessageEnvelope = await partiallySignOffchainMessageWithSigners(offchainMessage);

        // Then the first modifying signer finished signing before the second one started.
        expect(events).toStrictEqual(['signerA starts', 'signerA ends', 'signerB starts', 'signerB ends']);

        // And it contains the expected signatures.
        expect(signedOffchainMessageEnvelope.signatures).toStrictEqual({
            signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature',
            signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature',
        });
    });

    it('signs partial signers in parallel', async () => {
        expect.assertions(2);

        // Given two partial signers A and B.
        const signerA = createMockMessagePartialSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address);
        const signerB = createMockMessagePartialSigner('signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address);

        // And mock implementations for both signers such that they append events to an array.
        const events: string[] = [];
        const mockImplementation =
            (signerId: string, address: string, timeout: number) => async (messages: OffchainMessageEnvelope[]) => {
                events.push(`${signerId} starts`);
                await new Promise(r => setTimeout(r, timeout));
                events.push(`${signerId} ends`);
                return messages.map(() => ({ [address]: `${address}_signature` }));
            };
        signerA.signMessages.mockImplementation(
            mockImplementation('signerA', 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 500),
        );
        signerB.signMessages.mockImplementation(
            mockImplementation('signerB', 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 600),
        );

        // And given an offchain message that contains these two signers in its list of required signatories.
        const offchainMessage = createMockOffchainMessageWithSigners([signerA, signerB]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {
                ['signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address]: null,
                ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address]: null,
            },
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // When we partially sign this message.
        const signedOffchainMessageEnvelope = await partiallySignOffchainMessageWithSigners(offchainMessage);

        // Then the second partial signer started signing before the first one finished.
        expect(events).toStrictEqual(['signerA starts', 'signerB starts', 'signerA ends', 'signerB ends']);

        // And it contains the expected signatures.
        expect(signedOffchainMessageEnvelope.signatures).toStrictEqual({
            signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature',
            signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature',
        });
    });

    it('uses a composite signer as a modifying signer when there are no other modifying signers', async () => {
        expect.assertions(4);

        // Given an offchain message with a composite (partial & modifying) signer A and a partial signer B.
        const signerA = {
            ...createMockMessagePartialSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address),
            ...createMockMessageModifyingSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address),
        };
        const signerB = createMockMessagePartialSigner('signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address);
        const offchainMessage = createMockOffchainMessageWithSigners([signerA, signerB]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {
                ['signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address]: null,
                ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address]: null,
            },
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // And given the following mocked signatures.
        const modifiedOffchainMessage = {
            ...unsignedOffchainMessageEnvelope,
            signatures: {
                signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature',
            },
        };
        signerA.modifyAndSignMessages.mockResolvedValueOnce([modifiedOffchainMessage]);
        signerB.signMessages.mockResolvedValueOnce([
            { signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature' },
        ]);

        // When we partially sign this message.
        const signedOffchainMessageEnvelope = await partiallySignOffchainMessageWithSigners(offchainMessage);

        // Then signer A was used as a modifying signer.
        expect(signerA.signMessages).not.toHaveBeenCalled();
        expect(signerA.modifyAndSignMessages).toHaveBeenCalledWith(
            [unsignedOffchainMessageEnvelope],
            undefined /* config */,
        );
        expect(signerB.signMessages).toHaveBeenCalledWith([modifiedOffchainMessage], undefined /* config */);

        // And it contains the expected signatures.
        expect(signedOffchainMessageEnvelope.signatures).toStrictEqual({
            signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature',
            signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature',
        });
    });

    it('uses a composite signer as a partial signer when other modifying signers exist', async () => {
        expect.assertions(4);

        // Given an offchain message with a composite (partial & modifying) signer A and a modifying signer B.
        const signerA = {
            ...createMockMessagePartialSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address),
            ...createMockMessageModifyingSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address),
        };
        const signerB = createMockMessageModifyingSigner('signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address);
        const offchainMessage = createMockOffchainMessageWithSigners([signerA, signerB]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {
                ['signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address]: null,
                ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address]: null,
            },
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // And given the following mocked signatures.
        const modifiedOffchainMessage = {
            ...unsignedOffchainMessageEnvelope,
            signatures: {
                signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature',
            },
        };
        signerA.signMessages.mockResolvedValueOnce([
            { signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature' },
        ]);
        signerB.modifyAndSignMessages.mockResolvedValueOnce([modifiedOffchainMessage]);

        // When we partially sign this message.
        const signedOffchainMessageEnvelope = await partiallySignOffchainMessageWithSigners(offchainMessage);

        // Then signer A was used as a partial signer.
        expect(signerA.signMessages).toHaveBeenCalledWith([modifiedOffchainMessage], undefined /* config */);
        expect(signerA.modifyAndSignMessages).not.toHaveBeenCalled();
        expect(signerB.modifyAndSignMessages).toHaveBeenCalledWith(
            [unsignedOffchainMessageEnvelope],
            undefined /* config */,
        );

        // And it contains the expected signatures.
        expect(signedOffchainMessageEnvelope.signatures).toStrictEqual({
            signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature',
            signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature',
        });
    });

    it('freezes the signed message and its signature dictionary', async () => {
        expect.assertions(2);

        // Given an offchain message with a mocked partial signer.
        const signer = createMockMessagePartialSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address);
        const offchainMessage = createMockOffchainMessageWithSigners([signer]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {
                ['signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address]: null,
                ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address]: null,
            },
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        signer.signMessages.mockResolvedValueOnce([
            { signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature' },
        ]);

        // When we partially sign this message.
        const signedOffchainMessageEnvelope = await partiallySignOffchainMessageWithSigners(offchainMessage);

        // Then the signed message and its signature dictionary are frozen.
        expect(signedOffchainMessageEnvelope).toBeFrozenObject();
        expect(signedOffchainMessageEnvelope.signatures).toBeFrozenObject();
    });

    it('can be cancelled using an AbortSignal', async () => {
        expect.assertions(1);

        // Given an offchain message with a mocked partial signer.
        const signer = createMockMessagePartialSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address);
        signer.signMessages.mockResolvedValueOnce([
            { signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature' },
        ]);
        const offchainMessage = createMockOffchainMessageWithSigners([signer]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {
                ['signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address]: null,
                ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address]: null,
            },
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // And given we've started partially signing this message whilst providing an abort signal.
        const abortController = new AbortController();
        const promise = partiallySignOffchainMessageWithSigners(offchainMessage, {
            abortSignal: abortController.signal,
        });

        // When we cancel the operation via the abort controller.
        abortController.abort();

        // Then we expect the partially signing promise to fail.
        await expect(promise).rejects.toThrow(/(The|This) operation was aborted/);
    });

    it('compiles the input offchain message', async () => {
        expect.assertions(1);

        // Given a message
        const offchainMessage = createMockOffchainMessageWithSigners([]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {},
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // When we partially sign it
        await partiallySignOffchainMessageWithSigners(offchainMessage);

        // Then we expect the compile function to have been called
        expect(compileOffchainMessageEnvelope).toHaveBeenCalled();
    });
});

describe('signOffchainMessageWithSigners', () => {
    it('signs the message with its extracted signers', async () => {
        expect.assertions(3);

        // Given an offchain message with two signers A and B in its list of required signatories.
        const signerA = createMockMessageModifyingSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address);
        const signerB = createMockMessagePartialSigner('signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address);
        const offchainMessage = createMockOffchainMessageWithSigners([signerA, signerB]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {
                ['signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address]: null,
                ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address]: null,
            },
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // And given signer A and B are mocked to provide the following signatures.
        const modifiedOffchainMessage = {
            ...unsignedOffchainMessageEnvelope,
            signatures: {
                signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature',
            },
        };
        signerA.modifyAndSignMessages.mockResolvedValueOnce([modifiedOffchainMessage]);
        signerB.signMessages.mockResolvedValueOnce([
            { signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature' },
        ]);

        // When we sign this message.
        const mockOptions = {
            abortSignal: AbortSignal.timeout(1_000_000),
        };
        const signedOffchainMessageEnvelope = await signOffchainMessageWithSigners(offchainMessage, mockOptions);

        // Then it contains the expected signatures.
        expect(signedOffchainMessageEnvelope.signatures).toStrictEqual({
            signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature',
            signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB_signature',
        });

        // And the message is fully signed.
        signedOffchainMessageEnvelope satisfies FullySignedOffchainMessageEnvelope & OffchainMessageEnvelope;

        // And the signers were called with the expected parameters.
        expect(signerA.modifyAndSignMessages).toHaveBeenCalledWith([unsignedOffchainMessageEnvelope], mockOptions);
        expect(signerB.signMessages).toHaveBeenCalledWith([modifiedOffchainMessage], mockOptions);
    });

    it('asserts the message is fully signed', async () => {
        expect.assertions(1);

        // Given an offchain message with a partial signer A and a non-Signer address B
        const signerA = createMockMessagePartialSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address);
        const signerB = { address: 'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address };
        const offchainMessageWithSignerA = createMockOffchainMessageWithSigners([signerA]);
        const offchainMessage = {
            ...offchainMessageWithSignerA,
            requiredSignatories: [...offchainMessageWithSignerA.requiredSignatories, signerB],
        } as typeof offchainMessageWithSignerA;
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {
                ['signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address]: null,
                ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address]: null,
            },
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // And given signer A is mocked to provide the following signatures.
        signerA.signMessages.mockResolvedValueOnce([
            { signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature' },
        ]);

        // When we try to sign this message.
        const promise = signOffchainMessageWithSigners(offchainMessage);

        // Then we expect an error letting us know the message is not fully signed.
        // This is because non Signers are ignored by signOffchainMessageWithSigners.
        await expect(promise).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING, {
                addresses: ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address],
            }),
        );
    });

    it('can be cancelled using an AbortSignal', async () => {
        expect.assertions(1);

        // Given an offchain message with a mocked partial signer.
        const signer = createMockMessagePartialSigner('signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address);
        signer.signMessages.mockResolvedValueOnce([
            { signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: 'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_signature' },
        ]);
        const offchainMessage = createMockOffchainMessageWithSigners([signer]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {
                ['signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address]: null,
                ['signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address]: null,
            },
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // And given we've started signing this message whilst providing an abort signal.
        const abortController = new AbortController();
        const promise = signOffchainMessageWithSigners(offchainMessage, {
            abortSignal: abortController.signal,
        });

        // When we cancel the operation via the abort controller.
        abortController.abort();

        // Then we expect the signing promise to fail.
        await expect(promise).rejects.toThrow(/(The|This) operation was aborted/);
    });

    it('compiles the input offchain message', async () => {
        expect.assertions(1);

        // Given an offchain message
        const offchainMessage = createMockOffchainMessageWithSigners([]);
        const unsignedOffchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as unknown as OffchainMessageBytes,
            signatures: {},
        };
        jest.mocked(compileOffchainMessageEnvelope).mockReturnValue(unsignedOffchainMessageEnvelope);

        // When we partially sign it
        await signOffchainMessageWithSigners(offchainMessage);

        // Then we expect the compile function to have been called
        expect(compileOffchainMessageEnvelope).toHaveBeenCalled();
    });
});
