import { Brand, CompressedData, EncodedString } from '@solana/nominal-types';

export type Base58EncodedBytes = Brand<EncodedString<string, 'base58'>, 'Base58EncodedBytes'>;
export type Base64EncodedBytes = Brand<EncodedString<string, 'base64'>, 'Base64EncodedBytes'>;
export type Base64EncodedZStdCompressedBytes = Brand<
    EncodedString<CompressedData<string, 'zstd'>, 'base64'>,
    'Base64EncodedZStdCompressedBytes'
>;

export type Base58EncodedDataResponse = [Base58EncodedBytes, 'base58'];
export type Base64EncodedDataResponse = [Base64EncodedBytes, 'base64'];
export type Base64EncodedZStdCompressedDataResponse = [Base64EncodedZStdCompressedBytes, 'base64+zstd'];
