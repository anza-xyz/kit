import { Decoder, Encoder } from '@solana/codecs-core';
import { SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, SolanaError } from '@solana/errors';

import { TransactionVersion } from '../../transaction-message';
import {
    getTransactionVersionCodec,
    getTransactionVersionDecoder,
    getTransactionVersionEncoder,
} from '../transaction-version';

const VERSION_FLAG_MASK = 0x80;
const VERSION_TEST_CASES = // Versions 0–127
    [...Array(128).keys()].map(version => [version | VERSION_FLAG_MASK, version as TransactionVersion] as const);
const UNSUPPORTED_VERSION_TEST_CASES = VERSION_TEST_CASES.slice(1); // versions 1-127

describe.each([getTransactionVersionCodec, getTransactionVersionEncoder])(
    'Transaction version encoder',
    serializerFactory => {
        let transactionVersion: Encoder<TransactionVersion>;
        beforeEach(() => {
            transactionVersion = serializerFactory();
        });
        it('serializes no data when the version is `legacy`', () => {
            expect(transactionVersion.encode('legacy')).toEqual(new Uint8Array());
        });
        it('serializes to `0x80` when the version is `0`', () => {
            expect(transactionVersion.encode(0)).toEqual(new Uint8Array([0x80]));
        });
        it.each(UNSUPPORTED_VERSION_TEST_CASES)('fatals for unsupported version `%s`', (_byte, version) => {
            expect(() => transactionVersion.encode(version)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
                    unsupportedVersion: version,
                }),
            );
        });
        it.each([-1 as TransactionVersion, 128 as TransactionVersion])(
            'throws when passed the out-of-range version `%s`',
            version => {
                expect(() => transactionVersion.encode(version)).toThrow();
            },
        );
    },
);

describe.each([getTransactionVersionCodec, getTransactionVersionDecoder])(
    'Transaction version decoder',
    serializerFactory => {
        let transactionVersion: Decoder<TransactionVersion>;
        beforeEach(() => {
            transactionVersion = serializerFactory();
        });
        it('deserializes to `legacy` when missing the version flag', () => {
            expect(
                transactionVersion.decode(
                    // eg. just a byte that indicates that there are 3 required signers
                    new Uint8Array([3]),
                ),
            ).toBe('legacy');
        });
        it('deserializes to 0 for a version 0 transaction', () => {
            expect(
                transactionVersion.decode(
                    new Uint8Array([0 | VERSION_FLAG_MASK]), // version 0 with the version flag
                ),
            ).toBe(0);
        });
        it.each(UNSUPPORTED_VERSION_TEST_CASES)('fatals for unsupported version `%s`', (byte, version) => {
            expect(() => transactionVersion.decode(new Uint8Array([byte]))).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
                    unsupportedVersion: version,
                }),
            );
        });
    },
);
