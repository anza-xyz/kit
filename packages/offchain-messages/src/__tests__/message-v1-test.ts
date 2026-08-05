import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__REQUIRED_SIGNATORIES_DO_NOT_MATCH_EXPECTED,
    SolanaError,
} from '@solana/errors';

import { assertOffchainMessageV1Equal, OffchainMessageV1 } from '../message-v1';

const SIGNER_A =
    'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address<'signerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'>;
const SIGNER_B =
    'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address<'signerBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'>;
const SIGNER_C =
    'signerCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address<'signerCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'>;

function createMessage(content: string, signatoryAddresses: readonly Address[]): OffchainMessageV1 {
    return {
        content,
        requiredSignatories: signatoryAddresses.map(address => ({ address })),
        version: 1,
    };
}

describe('assertOffchainMessageV1Equal', () => {
    it('does not throw when the messages are identical', () => {
        const expectedMessage = createMessage('gm', [SIGNER_A, SIGNER_B]);
        const receivedMessage = createMessage('gm', [SIGNER_A, SIGNER_B]);
        expect(() => {
            assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        }).not.toThrow();
    });
    it('does not throw when the required signatories are listed in a different order', () => {
        // A decoded message always lists its signatories in the order the spec mandates, whereas
        // the expected message lists them in whatever order the caller built it with.
        const expectedMessage = createMessage('gm', [SIGNER_B, SIGNER_A]);
        const receivedMessage = createMessage('gm', [SIGNER_A, SIGNER_B]);
        expect(() => {
            assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        }).not.toThrow();
    });
    it('throws when the contents differ', () => {
        const expectedMessage = createMessage('gm', [SIGNER_A]);
        const receivedMessage = createMessage('drain my wallet', [SIGNER_A]);
        expect(() => {
            assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED, {
                actualBytes: 15,
                expectedBytes: 2,
            }),
        );
    });
    it('throws when the contents differ only in case', () => {
        // Two messages of the same length must still be compared by value.
        const expectedMessage = createMessage('gm', [SIGNER_A]);
        const receivedMessage = createMessage('GM', [SIGNER_A]);
        expect(() => {
            assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED, {
                actualBytes: 2,
                expectedBytes: 2,
            }),
        );
    });
    it('reports the content lengths in UTF-8 bytes rather than in UTF-16 code units', () => {
        // Version 1 content is serialized as UTF-8, so `🤝` is four bytes rather than the two
        // UTF-16 code units that `String.prototype.length` would report.
        const expectedMessage = createMessage('🤝', [SIGNER_A]);
        const receivedMessage = createMessage('gm', [SIGNER_A]);
        expect(() => {
            assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED, {
                actualBytes: 2,
                expectedBytes: 4,
            }),
        );
    });
    it('throws when the received message is missing a required signatory', () => {
        const expectedMessage = createMessage('gm', [SIGNER_A, SIGNER_B]);
        const receivedMessage = createMessage('gm', [SIGNER_A]);
        expect(() => {
            assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__REQUIRED_SIGNATORIES_DO_NOT_MATCH_EXPECTED, {
                actualAddresses: [SIGNER_A],
                expectedAddresses: [SIGNER_A, SIGNER_B],
            }),
        );
    });
    it('throws when the received message has an extra required signatory', () => {
        const expectedMessage = createMessage('gm', [SIGNER_A]);
        const receivedMessage = createMessage('gm', [SIGNER_A, SIGNER_B]);
        expect(() => {
            assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__REQUIRED_SIGNATORIES_DO_NOT_MATCH_EXPECTED, {
                actualAddresses: [SIGNER_A, SIGNER_B],
                expectedAddresses: [SIGNER_A],
            }),
        );
    });
    it('reports both sets of signatories in sorted order when one is substituted for another', () => {
        const expectedMessage = createMessage('gm', [SIGNER_B, SIGNER_A]);
        const receivedMessage = createMessage('gm', [SIGNER_C, SIGNER_A]);
        expect(() => {
            assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__REQUIRED_SIGNATORIES_DO_NOT_MATCH_EXPECTED, {
                actualAddresses: [SIGNER_A, SIGNER_C],
                expectedAddresses: [SIGNER_A, SIGNER_B],
            }),
        );
    });
    it('throws when a signatory is duplicated in one message but not the other', () => {
        // Signatories are compared as sorted lists rather than as sets, so a duplicate is a
        // difference rather than a no-op.
        const expectedMessage = createMessage('gm', [SIGNER_A, SIGNER_A]);
        const receivedMessage = createMessage('gm', [SIGNER_A]);
        expect(() => {
            assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__REQUIRED_SIGNATORIES_DO_NOT_MATCH_EXPECTED, {
                actualAddresses: [SIGNER_A],
                expectedAddresses: [SIGNER_A, SIGNER_A],
            }),
        );
    });
    it('reports a content mismatch rather than a signatory mismatch when both differ', () => {
        const expectedMessage = createMessage('gm', [SIGNER_A]);
        const receivedMessage = createMessage('drain my wallet', [SIGNER_B]);
        expect(() => {
            assertOffchainMessageV1Equal(receivedMessage, expectedMessage);
        }).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED, {
                actualBytes: 15,
                expectedBytes: 2,
            }),
        );
    });
});
