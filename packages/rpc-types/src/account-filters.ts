export type DataSlice = Readonly<{
    /** The number of bytes to return */
    length: number;
    /** The byte offset from which to start reading */
    offset: number;
}>;

export type GetProgramAccountsMemcmpFilter = Readonly<{
    /**
     * This filter matches when the bytes supplied are equal to the account data at the given offset
     */
    memcmp: Readonly<{
        /**
         * The bytes to match, encoded as a string using the specified encoding.
         *
         * Data is limited to a maximum of 128 decoded bytes.
         */
        bytes: string;
        /** The encoding to use when decoding the supplied byte string */
        encoding: 'base58' | 'base64';
        /** The byte offset into the account data from which to start the comparison */
        offset: bigint;
    }>;
}>;

export type GetProgramAccountsDatasizeFilter = Readonly<{
    /** This filter matches when the account data length is equal to this */
    dataSize: bigint;
}>;
