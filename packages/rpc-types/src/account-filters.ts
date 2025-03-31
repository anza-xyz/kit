import { Base58EncodedBytes, Base64EncodedBytes } from './encoded-bytes';

export type DataSlice = Readonly<{
    /** The number of bytes to return */
    length: number;
    /** The byte offset from which to start reading */
    offset: number;
}>;

type ProgramNotificationsMemcmpFilterBase58 = Readonly<{
    /**
     * The bytes to match, as a base-58 encoded string.
     *
     * Data is limited to a maximum of 128 decoded bytes.
     */
    bytes: Base58EncodedBytes;
    /** The encoding to use when decoding the supplied byte string */
    encoding: 'base58';
    /** The byte offset into the account data from which to start the comparison */
    offset: bigint;
}>;

type ProgramNotificationsMemcmpFilterBase64 = Readonly<{
    /**
     * The bytes to match, as a base-64 encoded string.
     *
     * Data is limited to a maximum of 128 decoded bytes.
     */
    bytes: Base64EncodedBytes;
    /** The encoding to use when decoding the supplied byte string */
    encoding: 'base64';
    /** The byte offset into the account data from which to start the comparison */
    offset: bigint;
}>;

export type GetProgramAccountsMemcmpFilter = Readonly<{
    /**
     * This filter matches when the bytes supplied are equal to the account data at the given offset
     */
    memcmp: ProgramNotificationsMemcmpFilterBase58 | ProgramNotificationsMemcmpFilterBase64;
}>;

export type GetProgramAccountsDatasizeFilter = Readonly<{
    /** This filter matches when the account data length is equal to this */
    dataSize: bigint;
}>;
