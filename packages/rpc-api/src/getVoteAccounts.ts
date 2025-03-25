import type { Address } from '@solana/addresses';
import type { Commitment, Epoch, Slot } from '@solana/rpc-types';

type Credits = bigint;
type PreviousCredits = bigint;

type EpochCredit = [Epoch, Credits, PreviousCredits];

type VoteAccount<TVotePubkey extends Address> = Readonly<{
    /**
     * The amount of stake, in {@link Lamports}, delegated to this vote account and active in this
     * epoch.
     */
    activatedStake: bigint;
    /** The percentage of rewards payout owed to the vote account */
    commission: number;
    /** Latest history of earned credits for up to five epochs */
    epochCredits: readonly EpochCredit[];
    /** Whether the vote account is staked for this epoch */
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
    /** Vote accounts belonging to validators which are keeping pace with the tip of the chain */
    current: readonly VoteAccount<TVotePubkey>[];
    /** Vote accounts belonging to validators which have fallen behind the tip of the chain */
    delinquent: readonly VoteAccount<TVotePubkey>[];
}>;

type GetVoteAccountsConfig<TVoteAddress extends Address> = Readonly<{
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
    /**
     * Specify the number of slots behind the tip that a validator must fall to be considered
     * delinquent.
     *
     * For the sake of consistency between ecosystem products, _it is recommended that this argument
     * be **omitted**._
     *
     * @defaultValue `128n`
     */
    delinquentSlotDistance?: bigint;
    /**
     * Return delinquent validators (ie. validators who are behind the tip of the chain by the
     * number of slots specified by `delinquentSlotDistance`), even if they are unstaked
     *
     * @defaultValue `false`
     */
    keepUnstakedDelinquents?: boolean;
    /** Only return results for the validator with this vote account address */
    votePubkey?: TVoteAddress;
}>;

export type GetVoteAccountsApi = {
    /**
     * Returns the account info and associated stake for all the voting accounts in the current
     * bank.
     *
     * @see https://solana.com/docs/rpc/http/getvoteaccounts
     */
    getVoteAccounts<TVoteAccount extends Address>(
        config?: GetVoteAccountsConfig<TVoteAccount>,
    ): GetVoteAccountsApiResponse<TVoteAccount>;
};
