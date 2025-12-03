import type { Address } from '@solana/addresses';
import type { Commitment, Slot, SolanaRpcResponse } from '@solana/rpc-types';

type NumberOfLeaderSlots = bigint;
type NumberOfBlocksProduced = bigint;

type SlotRange = Readonly<{
    /** First slot to return block production information for */
    firstSlot: Slot;
    /**
     * Last slot to return block production information for.
     * @defaultValue If not provided, defaults to the highest slot.
     */
    lastSlot?: Slot;
}>;

type GetBlockProductionApiConfigBase = Readonly<{
    /**
     * Fetch the block production information as of the highest slot that has reached this level of
     * commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    /**
     * Slot range to return block production for (inclusive).
     * @defaultValue If not provided, fetches block production for the current epoch.
     */
    range?: SlotRange;
}>;

type BlockProductionRecord = [
    /** The number of leader slots the validator had, in the slot range given */
    numLeaderSlots: NumberOfLeaderSlots,
    /** The number of blocks that the validator produced, in the slot range given */
    numBlocksProduced: NumberOfBlocksProduced,
];

type BlockProductionWithSingleIdentity<TIdentity extends string> = Readonly<{
    [TAddress in TIdentity]?: BlockProductionRecord;
}>;

type BlockProductionWithAllIdentities = Record<Address, BlockProductionRecord>;

type GetBlockProductionApiResponse<T> = Readonly<{
    /** Block production results, indexed by validator address. */
    byIdentity: T;
    /** The range of slots (inclusive) for which block production information was fetched */
    range: SlotRange;
}>;

export type GetBlockProductionApi = {
    /**
     * Returns a validator's leader slot count and the number of blocks it produced, in the given
     * slot range
     *
     * {@label specific-validator}
     * @see https://solana.com/docs/rpc/http/getblockproduction
     */
    getBlockProduction<TIdentity extends Address>(
        config: GetBlockProductionApiConfigBase &
            Readonly<{
                /**
                 * When supplied, the response will only include results for the validator with this
                 * address
                 */
                identity: TIdentity;
            }>,
    ): SolanaRpcResponse<GetBlockProductionApiResponse<BlockProductionWithSingleIdentity<TIdentity>>>;
    /**
     * Returns each validator's leader slot count and the number of blocks they produced, in the
     * given slot range
     *
     * {@label all-validators}
     * @see https://solana.com/docs/rpc/http/getblockproduction
     */
    getBlockProduction(
        config?: GetBlockProductionApiConfigBase,
    ): SolanaRpcResponse<GetBlockProductionApiResponse<BlockProductionWithAllIdentities>>;
};
