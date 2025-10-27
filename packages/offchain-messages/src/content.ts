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

/**
 * A restriction on what characters the message text can contain and how long it can be.
 *
 * The aim of this restriction is to make a message more likely to be signable by a hardware wallet
 * that imposes limits on message size. In the case of wanting a message to be clear-signable,
 * restricting the character set to ASCII may ensure that certain models of hardware wallet without
 * extended character sets can display it onscreen.
 *
 * @remarks This only applies to v0 messages.
 */
export enum OffchainMessageContentFormat {
    RESTRICTED_ASCII_1232_BYTES_MAX = 0,
    UTF8_1232_BYTES_MAX = 1,
    UTF8_65535_BYTES_MAX = 2,
}

/**
 * Describes message text that is no more than 1232 bytes long and made up of characters with ASCII
 * character codes in the range [0x20, 0x7e].
 *
 * @remarks This type aims to restrict text to that which can be clear-signed by hardware wallets
 * that can only display ASCII characters onscreen.
 */
export type OffchainMessageContentRestrictedAsciiOf1232BytesMax<TContent extends string = string> = Readonly<{
    format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX;
    text: Brand<TContent, 'offchainMessageContentRestrictedAsciiOf1232BytesMax'>;
}>;

/**
 * Describes message text that is no more than 1232 bytes long and mdae up of any UTF-8 characters.
 */
export type OffchainMessageContentUtf8Of1232BytesMax<TContent extends string = string> = Readonly<{
    format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX;
    text: Brand<TContent, 'offchainMessageContentUtf8Of1232BytesMax'>;
}>;

/**
 * Describes message text that is no more than 65535 bytes long and mdae up of any UTF-8 characters.
 */
export type OffchainMessageContentUtf8Of65535BytesMax<TContent extends string = string> = Readonly<{
    format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX;
    text: Brand<TContent, 'offchainMessageContentUtf8Of65535BytesMax'>;
}>;

export type OffchainMessageContent =
    | OffchainMessageContentRestrictedAsciiOf1232BytesMax
    | OffchainMessageContentUtf8Of1232BytesMax
    | OffchainMessageContentUtf8Of65535BytesMax;

/**
 * In the event that you receive content of a v0 offchain message from an untrusted source, use this
 * function to assert that it conforms to the
 * {@link OffchainMessageContentRestrictedAsciiOf1232BytesMax} type.
 *
 * @see {@link OffchainMessageContentRestrictedAsciiOf1232BytesMax} for more detail.
 */
export function assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax(putativeContent: {
    format: OffchainMessageContentFormat;
    text: string;
}): asserts putativeContent is OffchainMessageContentRestrictedAsciiOf1232BytesMax {
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

/**
 * A type guard that returns `true` when supplied content of a v0 offchain message that conforms to
 * the {@link OffchainMessageContentRestrictedAsciiOf1232BytesMax} type, and refines its type for use in your
 * program.
 *
 * @see {@link OffchainMessageContentRestrictedAsciiOf1232BytesMax} for more detail.
 */
export function isOffchainMessageContentRestrictedAsciiOf1232BytesMax(putativeContent: {
    format: OffchainMessageContentFormat;
    text: string;
}): putativeContent is OffchainMessageContentRestrictedAsciiOf1232BytesMax {
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

/**
 * Combines _asserting_ that the content of a v0 offchain message is restricted ASCII with
 * _coercing_ it to the {@link OffchainMessageContentRestrictedAsciiOf1232BytesMax} type. It's most
 * useful with untrusted input.
 *
 * @example
 * ```ts
 * import { offchainMessageContentRestrictedAsciiOf1232BytesMax, OffchainMessageV0 } from '@solana/offchain-messages';
 *
 * function handleSubmit() {
 *     // We know only that what the user typed conforms to the `string` type.
 *     const text: string = textInput.value;
 *     try {
 *         const offchainMessage: OffchainMessageV0 = {
 *             content: offchainMessageContentRestrictedAsciiOf1232BytesMax(text),
 *             // ...
 *         };
 *     } catch (e) {
 *         // `text` turned out not to conform to
 *         // `OffchainMessageContentRestrictedAsciiOf1232BytesMax`
 *     }
 * }
 * ```
 *
 * > [!TIP]
 * > When starting from known-good ASCII content as a string, it's more efficient to typecast it
 * > rather than to use the {@link offchainMessageContentRestrictedAsciiOf1232BytesMax} helper,
 * > because the helper unconditionally performs validation on its input.
 * >
 * > ```ts
 * > import { OffchainMessageContentFormat, OffchainMessageV0 } from '@solana/offchain-messages';
 * >
 * > const offchainMessage: OffchainMessageV0 = {
 * >     /* ... *\/
 * >     content: Object.freeze({
 * >         format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
 * >         text: 'Hello world',
 * >     } as OffchainMessageContentRestrictedAsciiOf1232BytesMax<'Hello world'>),
 * > };
 * > ```
 */
export function offchainMessageContentRestrictedAsciiOf1232BytesMax<TText extends string>(
    text: TText,
): OffchainMessageContentRestrictedAsciiOf1232BytesMax<TText> {
    const putativeContent = Object.freeze({
        format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
        text,
    });
    assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax(putativeContent);
    return putativeContent;
}

/**
 * In the event that you receive content of a v0 offchain message from an untrusted source, use this
 * function to assert that it conforms to the {@link OffchainMessageContentUtf8Of1232BytesMax} type.
 *
 * @see {@link OffchainMessageContentUtf8Of1232BytesMax} for more detail.
 */
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

/**
 * A type guard that returns `true` when supplied content of a v0 offchain message that conforms to
 * the {@link OffchainMessageContentUtf8Of1232BytesMax} type, and refines its type for use in your
 * program.
 *
 * @see {@link OffchainMessageContentUtf8Of1232BytesMax} for more detail.
 */
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

/**
 * Combines _asserting_ that the content of a v0 offchain message is UTF-8 of up to 1232 characters
 * with _coercing_ it to the {@link OffchainMessageContentUtf8Of1232BytesMax} type. It's most useful
 * with untrusted input.
 *
 * @example
 * ```ts
 * import { OffchainMessageContentUtf8Of1232BytesMax, OffchainMessageV0 } from '@solana/offchain-messages';
 *
 * function handleSubmit() {
 *     // We know only that what the user typed conforms to the `string` type.
 *     const text: string = textInput.value;
 *     try {
 *         const offchainMessage: OffchainMessageV0 = {
 *             content: OffchainMessageContentUtf8Of1232BytesMax(text),
 *             // ...
 *         };
 *     } catch (e) {
 *         // `text` turned out not to conform to
 *         // `OffchainMessageContentUtf8Of1232BytesMax`
 *     }
 * }
 * ```
 *
 * > [!TIP]
 * > When starting from known-good UTF-8 content as a string up to 1232 bytes, it's more efficient
 * > to typecast it rather than to use the {@link offchainMessageContentUtf8Of1232BytesMax} helper,
 * > because the helper unconditionally performs validation on its input.
 * >
 * > ```ts
 * > import { OffchainMessageContentFormat, OffchainMessageV0 } from '@solana/offchain-messages';
 * >
 * > const offchainMessage: OffchainMessageV0 = {
 * >     /* ... *\/
 * >     content: Object.freeze({
 * >         format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
 * >         text: '✌🏿cool',
 * >     } as OffchainMessageContentUtf8Of1232BytesMax<'✌🏿cool'>),
 * > };
 * > ```
 */
export function offchainMessageContentUtf8Of1232BytesMax<TText extends string>(
    text: TText,
): OffchainMessageContentUtf8Of1232BytesMax<TText> {
    const putativeContent = Object.freeze({
        format: OffchainMessageContentFormat.UTF8_1232_BYTES_MAX,
        text,
    });
    assertIsOffchainMessageContentUtf8Of1232BytesMax(putativeContent);
    return putativeContent;
}

/**
 * In the event that you receive content of a v0 offchain message from an untrusted source, use this
 * function to assert that it conforms to the {@link OffchainMessageContentUtf8Of65535BytesMax}
 * type.
 *
 * @see {@link OffchainMessageContentUtf8Of65535BytesMax} for more detail.
 */
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

/**
 * A type guard that returns `true` when supplied content of a v0 offchain message that conforms to
 * the {@link OffchainMessageContentUtf8Of65535BytesMax} type, and refines its type for use in your
 * program.
 *
 * @see {@link OffchainMessageContentUtf8Of65535BytesMax} for more detail.
 */
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

/**
 * Combines _asserting_ that the content of a v0 offchain message is UTF-8 of up to 65535 characters
 * with _coercing_ it to the {@link OffchainMessageContentUtf8Of65535BytesMax} type. It's most useful
 * with untrusted input.
 *
 * @example
 * ```ts
 * import { OffchainMessageContentUtf8Of65535BytesMax, OffchainMessageV0 } from '@solana/offchain-messages';
 *
 * function handleSubmit() {
 *     // We know only that what the user typed conforms to the `string` type.
 *     const text: string = textInput.value;
 *     try {
 *         const offchainMessage: OffchainMessageV0 = {
 *             content: OffchainMessageContentUtf8Of65535BytesMax(text),
 *             // ...
 *         };
 *     } catch (e) {
 *         // `text` turned out not to conform to
 *         // `OffchainMessageContentUtf8Of65535BytesMax`
 *     }
 * }
 * ```
 *
 * > [!TIP]
 * > When starting from known-good UTF-8 content as a string up to 65535 bytes, it's more efficient
 * > to typecast it rather than to use the {@link OffchainMessageContentUtf8Of65535BytesMax} helper,
 * > because the helper unconditionally performs validation on its input.
 * >
 * > ```ts
 * > import { OffchainMessageContentFormat, OffchainMessageV0 } from '@solana/offchain-messages';
 * >
 * > const offchainMessage: OffchainMessageV0 = {
 * >     /* ... *\/
 * >     content: Object.freeze({
 * >         format: OffchainMessageContentFormat.UTF8_65535_BYTES_MAX,
 * >         text: '✌🏿cool',
 * >     } as OffchainMessageContentUtf8Of65535BytesMax<'✌🏿cool'>),
 * > };
 * > ```
 */
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
    return /^[\x20-\x7e]+$/.test(putativeRestrictedAsciiString);
}
