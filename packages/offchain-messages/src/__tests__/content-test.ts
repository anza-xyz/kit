import { getUtf8Codec } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import {
    assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax,
    assertIsOffchainMessageContentUtf8Of1232BytesMax,
    assertIsOffchainMessageContentUtf8Of65535BytesMax,
    encodeOffchainMessageContentFormat,
    isOffchainMessageContentRestrictedAsciiOf1232BytesMax,
    isOffchainMessageContentUtf8Of1232BytesMax,
    isOffchainMessageContentUtf8Of65535BytesMax,
    OffchainMessageContentFormat,
} from '../content';

const UTF8_LONGER_THAN_65535 = [
    '!'.repeat(65535 + 1),
    '😘'.repeat(16383 + 1),
    '€'.repeat(21845 + 1),
    '✌🏿'.repeat(9362 + 1),
];
const UTF8_WITHIN_65535 = ['!'.repeat(65535), '😘'.repeat(16383), '€'.repeat(21845), '✌🏿'.repeat(9362)];

const UTF8_LONGER_THAN_1232 = ['!'.repeat(1232 + 1), '😘'.repeat(308 + 1), '€'.repeat(410 + 1), '✌🏿'.repeat(176 + 1)];
const UTF8_WITHIN_1232 = ['!'.repeat(1232), '😘'.repeat(308), '€'.repeat(410), '✌🏿'.repeat(176)];

describe('assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax()', () => {
    it.each([OffchainMessageContentFormat.UTF8_1232_BYTES_MAX, OffchainMessageContentFormat.UTF8_65535_BYTES_MAX])(
        'throws a format mismatch error when the format is %j',
        format => {
            expect(() =>
                assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                    format,
                    text: 'Hello world',
                }),
            ).toThrow(
                new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH, {
                    actualMessageFormat: encodeOffchainMessageContentFormat(format),
                    expectedMessageFormat: encodeOffchainMessageContentFormat(
                        OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                    ),
                }),
            );
        },
    );
    it('throws a length exceeded error when the content is over 1232 characters', () => {
        expect(() =>
            assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: '!'.repeat(1232 + 1),
            }),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
                actualBytes: 1232 + 1,
                maxBytes: 1232,
            }),
        );
    });
    it('does not throw a length exceeded error when the content is exactly 1232 characters', () => {
        expect(() =>
            assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: '!'.repeat(1232),
            }),
        ).not.toThrow();
    });
    it('throws a non-empty error when the content is empty', () => {
        expect(() =>
            assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: '',
            }),
        ).toThrow(new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY));
    });
    it.each(['\x19', '\x7f'])('throws when the content contains out of range character %j', char => {
        expect(() =>
            assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: char,
            }),
        ).toThrow(new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE));
    });
    it.each(Array.from({ length: 0x7e - 0x20 + 1 }, (_, ii) => String.fromCharCode(0x20 + ii)))(
        'does not throw when the content contains allowed character %j',
        char => {
            expect(() =>
                assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                    format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                    text: char,
                }),
            ).not.toThrow();
        },
    );
});

describe('isOffchainMessageContentRestrictedAsciiOf1232BytesMax()', () => {
    it.each([OffchainMessageContentFormat.UTF8_1232_BYTES_MAX, OffchainMessageContentFormat.UTF8_65535_BYTES_MAX])(
        'returns `false` when the format is %j',
        format => {
            expect(
                isOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                    format,
                    text: 'Hello world',
                }),
            ).toBe(false);
        },
    );
    it('returns `false` when the content exceeds 1232 characters', () => {
        expect(
            isOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: '!'.repeat(1232 + 1),
            }),
        ).toBe(false);
    });
    it('returns `true` when the content is exactly 1232 characters', () => {
        expect(
            isOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: '!'.repeat(1232),
            }),
        ).toBe(true);
    });
    it('returns `false` when the content is empty', () => {
        expect(
            isOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: '',
            }),
        ).toBe(false);
    });
    it.each(['\x19', '\x7f'])('returns `false` when the content contains out of range character %j', char => {
        expect(
            isOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                text: char,
            }),
        ).toBe(false);
    });
    it.each(Array.from({ length: 0x7e - 0x20 + 1 }, (_, ii) => String.fromCharCode(0x20 + ii)))(
        'does not throw when the content contains allowed character %j',
        char => {
            expect(
                isOffchainMessageContentRestrictedAsciiOf1232BytesMax({
                    format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
                    text: char,
                }),
            ).toBe(true);
        },
    );
});

describe('assertIsOffchainMessageContentUtf8Of1232BytesMax()', () => {
    it.each([
        OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
        OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
    ])('throws a format mismatch error when the format is %j', format => {
        expect(() =>
            assertIsOffchainMessageContentUtf8Of1232BytesMax({
                format,
                text: 'Hello world',
            }),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH, {
                actualMessageFormat: encodeOffchainMessageContentFormat(format),
                expectedMessageFormat: encodeOffchainMessageContentFormat(
                    OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
                ),
            }),
        );
    });
    it.each(UTF8_LONGER_THAN_1232)('throws a length exceeded error when the content is "%s"', text => {
        expect(() =>
            assertIsOffchainMessageContentUtf8Of1232BytesMax({
                format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
                text,
            }),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
                actualBytes: getUtf8Codec().getSizeFromValue(text),
                maxBytes: 1232,
            }),
        );
    });
    it('throws a non-empty error when the content is empty', () => {
        expect(() =>
            assertIsOffchainMessageContentUtf8Of1232BytesMax({
                format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
                text: '',
            }),
        ).toThrow(new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY));
    });
    it.each(UTF8_WITHIN_1232)('does not throw a length exceeded error when the content is "%s"', text => {
        expect(() =>
            assertIsOffchainMessageContentUtf8Of1232BytesMax({
                format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
                text,
            }),
        ).not.toThrow();
    });
});

describe('isOffchainMessageContentUtf8Of1232BytesMax()', () => {
    it.each([
        OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
        OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
    ])('returns `false` when the format is %j', format => {
        expect(
            isOffchainMessageContentUtf8Of1232BytesMax({
                format,
                text: 'Hello world',
            }),
        ).toBe(false);
    });
    it.each(UTF8_LONGER_THAN_1232)('returns `false` when the content is "%s"', text => {
        expect(
            isOffchainMessageContentUtf8Of1232BytesMax({
                format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
                text,
            }),
        ).toBe(false);
    });
    it('returns `false` when the content is empty', () => {
        expect(
            isOffchainMessageContentUtf8Of1232BytesMax({
                format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
                text: '',
            }),
        ).toBe(false);
    });
    it.each(UTF8_WITHIN_1232)('returns `true` when the content is "%s"', text => {
        expect(
            isOffchainMessageContentUtf8Of1232BytesMax({
                format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
                text,
            }),
        ).toBe(true);
    });
});

describe('assertIsOffchainMessageContentUtf8Of65535BytesMax()', () => {
    it.each([
        OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
        OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
    ])('throws a format mismatch error when the format is %j', format => {
        expect(() =>
            assertIsOffchainMessageContentUtf8Of65535BytesMax({
                format,
                text: 'Hello world',
            }),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH, {
                actualMessageFormat: encodeOffchainMessageContentFormat(format),
                expectedMessageFormat: encodeOffchainMessageContentFormat(
                    OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
                ),
            }),
        );
    });
    it.each(UTF8_LONGER_THAN_65535)('throws a length exceeded error when the content is "%s"', text => {
        expect(() =>
            assertIsOffchainMessageContentUtf8Of65535BytesMax({
                format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
                text,
            }),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
                actualBytes: getUtf8Codec().getSizeFromValue(text),
                maxBytes: 65535,
            }),
        );
    });
    it('throws a non-empty error when the content is empty', () => {
        expect(() =>
            assertIsOffchainMessageContentUtf8Of65535BytesMax({
                format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
                text: '',
            }),
        ).toThrow(new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY));
    });
    it.each(UTF8_WITHIN_65535)('does not throw a length exceeded error when the content is "%s"', text => {
        expect(() =>
            assertIsOffchainMessageContentUtf8Of65535BytesMax({
                format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
                text,
            }),
        ).not.toThrow();
    });
});

describe('isOffchainMessageContentUtf8Of65535BytesMax()', () => {
    it.each([
        OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
        OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
    ])('returns `false` when the format is %j', format => {
        expect(
            isOffchainMessageContentUtf8Of65535BytesMax({
                format,
                text: 'Hello world',
            }),
        ).toBe(false);
    });
    it.each(UTF8_LONGER_THAN_65535)('returns `false` when the content is "%s"', text => {
        expect(
            isOffchainMessageContentUtf8Of65535BytesMax({
                format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
                text,
            }),
        ).toBe(false);
    });
    it('returns `false` when the content is empty', () => {
        expect(
            isOffchainMessageContentUtf8Of65535BytesMax({
                format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
                text: '',
            }),
        ).toBe(false);
    });
    it.each(UTF8_WITHIN_65535)('returns `true` when the content is "%s"', text => {
        expect(
            isOffchainMessageContentUtf8Of65535BytesMax({
                format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
                text,
            }),
        ).toBe(true);
    });
});
