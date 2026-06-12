import { getUtf8Encoder } from '@solana/codecs-strings';
import { SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, SolanaError } from '@solana/errors';

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

const MAX_HARDWARE_WALLET_SIGNABLE_MESSAGE_BYTES = 1232;
const SIGNING_DOMAIN_LENGTH_BYTES = 16;
const VERSION_LENGTH_BYTES = 1;
const APPLICATION_DOMAIN_LENGTH_BYTES = 32;
const MESSAGE_FORMAT_LENGTH_BYTES = 1;
const SIGNER_COUNT_LENGTH_BYTES = 1;
const SIGNER_ADDRESS_LENGTH_BYTES = 32;
const MESSAGE_LENGTH_BYTES = 2;

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

function getPreambleLengthForRequiredSignatories(
    requiredSignatories: OffchainMessageV0['requiredSignatories'],
): number {
    return (
        SIGNING_DOMAIN_LENGTH_BYTES +
        VERSION_LENGTH_BYTES +
        APPLICATION_DOMAIN_LENGTH_BYTES +
        MESSAGE_FORMAT_LENGTH_BYTES +
        SIGNER_COUNT_LENGTH_BYTES +
        requiredSignatories.length * SIGNER_ADDRESS_LENGTH_BYTES +
        MESSAGE_LENGTH_BYTES
    );
}

function assertFitsHardwareWalletSignableMessageByteLimit(
    putativeMessage: Pick<OffchainMessageV0, 'requiredSignatories'> & {
        content: {
            text: string;
        };
    },
) {
    const messageBodyLength = getUtf8Encoder().getSizeFromValue(putativeMessage.content.text);
    const maxBodyLength =
        MAX_HARDWARE_WALLET_SIGNABLE_MESSAGE_BYTES -
        getPreambleLengthForRequiredSignatories(putativeMessage.requiredSignatories);
    if (messageBodyLength > maxBodyLength) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__MAXIMUM_LENGTH_EXCEEDED, {
            actualBytes: messageBodyLength,
            maxBytes: maxBodyLength,
        });
    }
}

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
    assertFitsHardwareWalletSignableMessageByteLimit(putativeMessage);
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
    assertFitsHardwareWalletSignableMessageByteLimit(putativeMessage);
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
