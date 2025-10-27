import { getUtf8Encoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';
import { Brand } from '@solana/nominal-types';

const MAX_BODY_BYTES =
    // Largest 16-bit unsigned integer
    0xffff;
const MAX_BODY_BYTES_HARDWARE_WALLET_SIGNABLE =
    // Space remaining in the mininum IPv6 MTU after network header overhead
    1232;

export enum OffchainMessageContentFormat {
    RESTRICTED_ASCII_1232_BYTES_MAX = 0,
    UTF8_1232_BYTES_MAX = 1,
    UTF8_65535_BYTES_MAX = 2,
}

export type OffchainMessageContentRestrictedAsciiOf1232BytesMax<TContent extends string = string> = Readonly<{
    format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX;
    text: Brand<TContent, 'offchainMessageContentRestrictedAsciiOf1232BytesMax'>;
}>;
export type OffchainMessageContentUtf8Of1232BytesMax<TContent extends string = string> = Readonly<{
    format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX;
    text: Brand<TContent, 'offchainMessageContentUtf8Of1232BytesMax'>;
}>;
export type OffchainMessageContentUtf8Of65535BytesMax<TContent extends string = string> = Readonly<{
    format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX;
    text: Brand<TContent, 'offchainMessageContentUtf8Of65535BytesMax'>;
}>;

export type OffchainMessageContent =
    | OffchainMessageContentRestrictedAsciiOf1232BytesMax
    | OffchainMessageContentUtf8Of1232BytesMax
    | OffchainMessageContentUtf8Of65535BytesMax;

export function assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax(putativeContent: {
    format: OffchainMessageContentFormat;
    text: string;
}): asserts putativeContent is OffchainMessageContentUtf8Of1232BytesMax {
    if (putativeContent.format !== OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH, {
            actualMessageFormat: putativeContent.format,
            expectedMessageFormat: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
        });
    }
    if (putativeContent.text.length === 0) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY);
    }
    if (isTextRestrictedAscii(putativeContent.text) === false) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__RESTRICTED_ASCII_BODY_CHARACTER_OUT_OF_RANGE);
    }
    const length = getUtf8Encoder().getSizeFromValue(putativeContent.text);
    if (length > MAX_BODY_BYTES_HARDWARE_WALLET_SIGNABLE) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
            actualBytes: length,
            maxBytes: MAX_BODY_BYTES_HARDWARE_WALLET_SIGNABLE,
        });
    }
}

export function isOffchainMessageContentRestrictedAsciiOf1232BytesMax(putativeContent: {
    format: OffchainMessageContentFormat;
    text: string;
}): putativeContent is OffchainMessageContentUtf8Of1232BytesMax {
    if (
        putativeContent.format !== OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX ||
        putativeContent.text.length === 0 ||
        isTextRestrictedAscii(putativeContent.text) === false
    ) {
        return false;
    }
    const length = getUtf8Encoder().getSizeFromValue(putativeContent.text);
    return length <= MAX_BODY_BYTES_HARDWARE_WALLET_SIGNABLE;
}

export function offchainMessageContentResctrictedAsciiOf1232BytesMax<TText extends string>(
    text: TText,
): OffchainMessageContentUtf8Of1232BytesMax<TText> {
    const putativeContent = Object.freeze({
        format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
        text,
    });
    assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax(putativeContent);
    return putativeContent;
}

export function assertIsOffchainMessageContentUtf8Of1232BytesMax(putativeContent: {
    format: OffchainMessageContentFormat;
    text: string;
}): asserts putativeContent is OffchainMessageContentUtf8Of1232BytesMax {
    if (putativeContent.text.length === 0) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY);
    }
    if (putativeContent.format !== OffchainMessageContentFormat.UTF8_1232_BYTES_MAX) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH, {
            actualMessageFormat: putativeContent.format,
            expectedMessageFormat: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
        });
    }
    const length = getUtf8Encoder().getSizeFromValue(putativeContent.text);
    if (length > MAX_BODY_BYTES_HARDWARE_WALLET_SIGNABLE) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
            actualBytes: length,
            maxBytes: MAX_BODY_BYTES_HARDWARE_WALLET_SIGNABLE,
        });
    }
}

export function isOffchainMessageContentUtf8Of1232BytesMax(putativeContent: {
    format: OffchainMessageContentFormat;
    text: string;
}): putativeContent is OffchainMessageContentUtf8Of1232BytesMax {
    if (
        putativeContent.format !== OffchainMessageContentFormat.UTF8_1232_BYTES_MAX ||
        putativeContent.text.length === 0
    ) {
        return false;
    }
    const length = getUtf8Encoder().getSizeFromValue(putativeContent.text);
    return length <= MAX_BODY_BYTES_HARDWARE_WALLET_SIGNABLE;
}

export function offchainMessageContentUtf81232BytesMax<TText extends string>(
    text: TText,
): OffchainMessageContentUtf8Of1232BytesMax<TText> {
    const putativeContent = Object.freeze({
        format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
        text,
    });
    assertIsOffchainMessageContentUtf8Of1232BytesMax(putativeContent);
    return putativeContent;
}

export function assertIsOffchainMessageContentUtf8Of65535BytesMax(putativeContent: {
    format: OffchainMessageContentFormat;
    text: string;
}): asserts putativeContent is OffchainMessageContentUtf8Of65535BytesMax {
    if (putativeContent.format !== OffchainMessageContentFormat.UTF8_65535_BYTES_MAX) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_FORMAT_MISMATCH, {
            actualMessageFormat: putativeContent.format,
            expectedMessageFormat: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
        });
    }
    if (putativeContent.text.length === 0) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MESSAGE_MUST_BE_NON_EMPTY);
    }
    const length = getUtf8Encoder().getSizeFromValue(putativeContent.text);
    if (length > MAX_BODY_BYTES) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
            actualBytes: length,
            maxBytes: MAX_BODY_BYTES,
        });
    }
}

export function isOffchainMessageContentUtf8Of65535BytesMax(putativeContent: {
    format: OffchainMessageContentFormat;
    text: string;
}): putativeContent is OffchainMessageContentUtf8Of65535BytesMax {
    if (
        putativeContent.format !== OffchainMessageContentFormat.UTF8_65535_BYTES_MAX ||
        putativeContent.text.length === 0
    ) {
        return false;
    }
    const length = getUtf8Encoder().getSizeFromValue(putativeContent.text);
    return length <= MAX_BODY_BYTES;
}

export function offchainMessageContentUtf8Of65535BytesMax<TText extends string>(
    text: TText,
): OffchainMessageContentUtf8Of65535BytesMax<TText> {
    const putativeContent = Object.freeze({
        format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
        text,
    });
    assertIsOffchainMessageContentUtf8Of65535BytesMax(putativeContent);
    return putativeContent;
}

function isTextRestrictedAscii(putativeRestrictedAsciiString: string): boolean {
    return /^[\x20-\x7e\n]+$/.test(putativeRestrictedAsciiString);
}
