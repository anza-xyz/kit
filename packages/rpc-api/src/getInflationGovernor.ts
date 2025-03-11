import type { Commitment, F64UnsafeSeeDocumentation } from '@solana/rpc-types';

type GetInflationGovernorApiResponse = Readonly<{
    /** Percentage of total inflation allocated to the foundation */
    foundation: F64UnsafeSeeDocumentation;
    /** Duration of foundation pool inflation in years */
    foundationTerm: F64UnsafeSeeDocumentation;
    /** The initial inflation percentage from time 0 */
    initial: F64UnsafeSeeDocumentation;
    /**
     * Rate per year at which inflation is lowered.
     * (Rate reduction is derived using the target
     * slot time in genesis config)
     */
    taper: F64UnsafeSeeDocumentation;
    /** Terminal inflation percentage */
    terminal: F64UnsafeSeeDocumentation;
}>;

export type GetInflationGovernorApi = {
    /**
     * Returns the current inflation governor
     */
    getInflationGovernor(
        config?: Readonly<{
            /**
             * Return the inflation governor as of the highest slot that has reached this level of
             * commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
        }>,
    ): GetInflationGovernorApiResponse;
};
