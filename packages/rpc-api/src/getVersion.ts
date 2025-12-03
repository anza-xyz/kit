type GetVersionApiResponse = Readonly<{
    /**
     * The unique identifier of the node's feature set.
     *
     * This value is computed by sorting all feature addresses' byte arrays lexicographically,
     * hashing them, then taking the first 4 bytes of the result. This keeps the feature set value
     * stable across versions until a new feature is introduced.
     */
    'feature-set': number; // `u32`
    /** Software version of the node */
    'solana-core': string;
}>;

export type GetVersionApi = {
    /**
     * Returns the current Solana version running on the node.
     *
     * @see https://solana.com/docs/rpc/http/getversion
     */
    getVersion(): GetVersionApiResponse;
};
