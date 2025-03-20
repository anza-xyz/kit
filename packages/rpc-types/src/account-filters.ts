export type DataSlice = Readonly<{
    /** The number of bytes to return */
    length: number;
    /** The byte offset from which to start reading */
    offset: number;
}>;

export type GetProgramAccountsMemcmpFilter = Readonly<{
    memcmp: Readonly<{
        bytes: string;
        encoding: 'base58' | 'base64';
        offset: bigint;
    }>;
}>;

export type GetProgramAccountsDatasizeFilter = Readonly<{
    dataSize: bigint;
}>;
