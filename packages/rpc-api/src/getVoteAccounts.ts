import type { Address } from '@solana/addresses';
import type { Commitment, Epoch, Slot } from '@solana/rpc-types';

type Credits = bigint;
type PreviousCredits = bigint;

type EpochCredit = [Epoch, Credits, PreviousCredits];

type VoteAccount<TVotePubkey extends Address> = Readonly<{
    /** the stake, in lamports, delegated to this vote account and active in this epoch */
    activatedStake: bigint;
    /** percentage (0-100) of rewards payout owed to the vote account */
    commission: number;
    /** Latest history of earned credits for up to five epochs */
    epochCredits: readonly EpochCredit[];
    /** whether the vote account is staked for this epoch */
    epochVoteAccount: boolean;
    /** Most recent slot voted on by this vote account */
    lastVote: bigint;
    /** Validator identity */
    nodePubkey: Address;
    /** Current root slot for this vote account */
    rootSlot: Slot;
    /** Vote account address */
    votePubkey: TVotePubkey;
}>;

type GetVoteAccountsApiResponse<TVotePubkey extends Address> = Readonly<{
    current: readonly VoteAccount<TVotePubkey>[];
    delinquent: readonly VoteAccount<TVotePubkey>[];
}>;

type GetVoteAccountsConfig<TVotePubkey extends Address> = Readonly<{
    /**
     * Fetch the details of the vote accounts as of the highest slot that has reached this level of
     * commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    /** Specify the number of slots behind the tip that a validator must fall to be considered delinquent. **NOTE:** For the sake of consistency between ecosystem products, _it is **not** recommended that this argument be specified._ */
    delinquentSlotDistance?: bigint;
    /** Do not filter out delinquent validators with no stake */
    keepUnstakedDelinquents?: boolean;
    /** Only return results for this validator vote address */
    votePubkey?: TVotePubkey;
}>;

export type GetVoteAccountsApi = {
    /** Returns the account info and associated stake for all the voting accounts in the current bank. */
    getVoteAccounts<TVoteAccount extends Address>(
        config?: GetVoteAccountsConfig<TVoteAccount>,
    ): GetVoteAccountsApiResponse<TVoteAccount>;
};
