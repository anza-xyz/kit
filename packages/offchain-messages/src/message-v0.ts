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

export interface OffchainMessageWithRestrictedAsciiOf1232BytesMaxContent {
    readonly content: OffchainMessageContentRestrictedAsciiOf1232BytesMax;
}
export interface OffchainMessageWithUtf8Of1232BytesMaxContent {
    readonly content: OffchainMessageContentUtf8Of1232BytesMax;
}
export interface OffchainMessageWithUtf8Of65535BytesMaxContent {
    readonly content: OffchainMessageContentUtf8Of65535BytesMax;
}

export type OffchainMessageWithContent =
    | OffchainMessageWithRestrictedAsciiOf1232BytesMaxContent
    | OffchainMessageWithUtf8Of1232BytesMaxContent
    | OffchainMessageWithUtf8Of65535BytesMaxContent;

export type OffchainMessageV0 = BaseOffchainMessageV0 &
    OffchainMessageWithContent &
    OffchainMessageWithRequiredSignatories;

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
