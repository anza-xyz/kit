import { CompressedData, EncodedString } from '@solana/nominal-types';

export type Base58EncodedBytes = EncodedString<string, 'base58'>;
export type Base64EncodedBytes = EncodedString<string, 'base64'>;
export type Base64EncodedZStdCompressedBytes = EncodedString<CompressedData<string, 'zstd'>, 'base64'>;

export type Base58EncodedDataResponse = [Base58EncodedBytes, 'base58'];
export type Base64EncodedDataResponse = [Base64EncodedBytes, 'base64'];
export type Base64EncodedZStdCompressedDataResponse = [Base64EncodedZStdCompressedBytes, 'base64+zstd'];
