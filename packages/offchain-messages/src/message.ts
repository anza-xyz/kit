import { ReadonlyUint8Array } from '@solana/codecs-core';
import { Brand } from '@solana/nominal-types';

import {
    assertIsOffchainMessageContentRestrictedAsciiOf1232BytesMax,
    assertIsOffchainMessageContentUtf8Of1232BytesMax,
    assertIsOffchainMessageContentUtf8Of65535BytesMax,
    OffchainMessageContentFormat,
    OffchainMessageContentRestrictedAsciiOf1232BytesMax,
    OffchainMessageContentUtf8Of1232BytesMax,
    OffchainMessageContentUtf8Of65535BytesMax,
} from './content';
import { OffchainMessagePreamble } from './preamble';

export type OffchainMessageBytes = Brand<ReadonlyUint8Array, 'OffchainMessageBytes'>;

export type BaseOffchainMessage = Omit<OffchainMessagePreamble, 'messageFormat' | 'messageLength' | 'requiredSigners'>;

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

export type OffchainMessageWithRequiredSignerAddresses = Pick<OffchainMessagePreamble, 'requiredSigners'>;

export type OffchainMessage = BaseOffchainMessage &
    OffchainMessageWithContent &
    OffchainMessageWithRequiredSignerAddresses;

export function assertIsOffchainMessageRestrictedAsciiOf1232BytesMax<TMessage extends OffchainMessage>(
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

export function assertIsOffchainMessageUtf8Of1232BytesMax<TMessage extends OffchainMessage>(
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

export function assertIsOffchainMessageUtf8Of65535BytesMax<TMessage extends OffchainMessage>(
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
