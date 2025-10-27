import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import { SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING, SolanaError } from '@solana/errors';
import { SignatureBytes } from '@solana/keys';

import { OffchainMessageEnvelope } from '../envelope';
import { OffchainMessageBytes } from '../message';
import { assertIsFullySignedOffchainMessageEnvelope, isFullySignedOffchainMessageEnvelope } from '../signatures';

describe('isFullySignedOffchainMessageEnvelope', () => {
    const mockPublicKeyAddressA = 'A' as Address;
    const mockSignatureA = new Uint8Array(0) as SignatureBytes;
    const mockPublicKeyAddressB = 'B' as Address;
    const mockSignatureB = new Uint8Array(1) as SignatureBytes;

    it('returns false if the OffchainMessageEnvelope has missing signatures', () => {
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        signatures[mockPublicKeyAddressA] = null;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(isFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).toBe(false);
    });

    it('returns true if the OffchainMessageEnvelope is signed by all its signers', () => {
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        signatures[mockPublicKeyAddressA] = mockSignatureA;
        signatures[mockPublicKeyAddressB] = mockSignatureB;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(isFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).toBe(true);
    });

    it('return true if the OffchainMessageEnvelope has no signatures', () => {
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(isFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).toBe(true);
    });
});

describe('assertIsFullySignedOffchainMessageEnvelope', () => {
    const mockPublicKeyAddressA = 'A' as Address;
    const mockSignatureA = new Uint8Array(0) as SignatureBytes;
    const mockPublicKeyAddressB = 'B' as Address;
    const mockSignatureB = new Uint8Array(1) as SignatureBytes;

    it('throws all missing signers if the OffchainMessageEnvelope has no signature for multiple signers', () => {
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        signatures[mockPublicKeyAddressA] = null;
        signatures[mockPublicKeyAddressB] = null;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(() => assertIsFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATURES_MISSING, {
                addresses: [mockPublicKeyAddressA, mockPublicKeyAddressB],
            }),
        );
    });

    it('does not throw if the OffchainMessageEnvelope is signed by its only signer', () => {
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        signatures[mockPublicKeyAddressA] = mockSignatureA;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(() => assertIsFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).not.toThrow();
    });

    it('does not throw if the OffchainMessageEnvelope is signed by all its signers', () => {
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        signatures[mockPublicKeyAddressA] = mockSignatureA;
        signatures[mockPublicKeyAddressB] = mockSignatureB;
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };

        expect(() => assertIsFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).not.toThrow();
    });

    it('does not throw if the OffchainMessageEnvelope has no signatures', () => {
        const signatures: OffchainMessageEnvelope['signatures'] = {};
        const offchainMessageEnvelope: OffchainMessageEnvelope = {
            content: new Uint8Array() as ReadonlyUint8Array as OffchainMessageBytes,
            signatures,
        };
        expect(() => assertIsFullySignedOffchainMessageEnvelope(offchainMessageEnvelope)).not.toThrow();
    });
});
