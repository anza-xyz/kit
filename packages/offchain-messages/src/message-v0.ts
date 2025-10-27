import {
    assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax,
    assertIsOffchainMessageContentUtf8Of1232BytesMax,
    assertIsOffchainMessageContentUtf8Of65535BytesMax,
    OffchainMessageContentFormat,
    OffchainMessageContentRestrictedAsciiOf1232BytesMax,
    OffchainMessageContentUtf8Of1232BytesMax,
    OffchainMessageContentUtf8Of65535BytesMax,
} from './content';
import { OffchainMessagePreambleV0 } from './preamble-v0';
import { OffchainMessageWithRequiredSignatories } from './signatures';

export type BaseOffchainMessageV0 = Omit<
    OffchainMessagePreambleV0,
    'messageFormat' | 'messageLength' | 'requiredSignatories'
>;

/**
 * An offchain message whose content conforms to
 * {@link OffchainMessageContentRestrictedAsciiOf1232BytesMax}
 */
export interface OffchainMessageWithRestrictedAsciiOf1232BytesMaxContent {
    readonly content: OffchainMessageContentRestrictedAsciiOf1232BytesMax;
}

/**
 * An offchain message whose content conforms to
 * {@link offchainMessageContentUtf8Of1232BytesMax}
 */
export interface OffchainMessageWithUtf8Of1232BytesMaxContent {
    readonly content: OffchainMessageContentUtf8Of1232BytesMax;
}

/**
 * An offchain message whose content conforms to
 * {@link OffchainMessageContentUtf8Of65535BytesMax}
 */
export interface OffchainMessageWithUtf8Of65535BytesMaxContent {
    readonly content: OffchainMessageContentUtf8Of65535BytesMax;
}

/**
 * A union of the formats a v0 message's contents can take.
 *
 * @remarks From v1 and onward, an offchain message has only one format: UTF-8 text of arbitrary
 * length.
 */
export type OffchainMessageWithContent =
    | OffchainMessageWithRestrictedAsciiOf1232BytesMaxContent
    | OffchainMessageWithUtf8Of1232BytesMaxContent
    | OffchainMessageWithUtf8Of65535BytesMaxContent;

export type OffchainMessageV0 = BaseOffchainMessageV0 &
    OffchainMessageWithContent &
    OffchainMessageWithRequiredSignatories;

/**
 * In the event that you receive a v0 offchain message from an untrusted source, use this function
 * to assert that it is one whose content conforms to the
 * {@link OffchainMessageContentRestrictedAsciiOf1232BytesMax} type.
 *
 * @see {@link OffchainMessageContentRestrictedAsciiOf1232BytesMax} for more detail.
 */
export function assertIsOffchainMessageRestrictedAsciiOf1232BytesMax<TMessage extends OffchainMessageV0>(
    putativeMessage: Omit<TMessage, 'content'> &
        Readonly<{
            content: {
                format: OffchainMessageContentFormat;
                text: string;
            };
        }>,
): asserts putativeMessage is OffchainMessageWithRestrictedAsciiOf1232BytesMaxContent & Omit<TMessage, 'content'> {
    assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax(putativeMessage.content);
}

/**
 * In the event that you receive a v0 offchain message from an untrusted source, use this function
 * to assert that it is one whose content conforms to the
 * {@link offchainMessageContentUtf8Of1232BytesMax} type.
 *
 * @see {@link offchainMessageContentUtf8Of1232BytesMax} for more detail.
 */
export function assertIsOffchainMessageUtf8Of1232BytesMax<TMessage extends OffchainMessageV0>(
    putativeMessage: Omit<TMessage, 'content'> &
        Readonly<{
            content: {
                format: OffchainMessageContentFormat;
                text: string;
            };
            version: number;
        }>,
): asserts putativeMessage is OffchainMessageWithUtf8Of1232BytesMaxContent & Omit<TMessage, 'content'> {
    assertIsOffchainMessageContentUtf8Of1232BytesMax(putativeMessage.content);
}

/**
 * In the event that you receive a v0 offchain message from an untrusted source, use this function
 * to assert that it is one whose content conforms to the
 * {@link OffchainMessageContentUtf8Of65535BytesMax} type.
 *
 * @see {@link OffchainMessageContentUtf8Of65535BytesMax} for more detail.
 */
export function assertIsOffchainMessageUtf8Of65535BytesMax<TMessage extends OffchainMessageV0>(
    putativeMessage: Omit<TMessage, 'content'> &
        Readonly<{
            content: {
                format: OffchainMessageContentFormat;
                text: string;
            };
            version: number;
        }>,
): asserts putativeMessage is OffchainMessageWithUtf8Of65535BytesMaxContent & Omit<TMessage, 'content'> {
    assertIsOffchainMessageContentUtf8Of65535BytesMax(putativeMessage.content);
}
