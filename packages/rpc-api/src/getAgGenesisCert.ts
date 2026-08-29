import type { Slot } from '@solana/rpc-types';

/**
 * The Alpenglow genesis certificate, as gossiped between validators.
 *
 * This mirrors the `WireBlockCertMessage` type in the Agave validator.
 */
type GetAgGenesisCertApiResponse = Readonly<{
    /** The block that the certificate is certifying */
    block: Readonly<{
        /** The block id of the certified block, as a 32-byte array */
        blockId: readonly number[];
        /** The slot of the certified block */
        slot: Slot;
    }>;
    /** The signature of the certificate message */
    signature: Readonly<{
        /** Bitmap of the ranks of the validators included in the aggregate signature */
        bitmap: readonly number[];
        /** The 192-byte aggregate BLS signature */
        signature: readonly number[];
    }>;
}>;

export type GetAgGenesisCertApi = {
    /**
     * Returns the Alpenglow genesis certificate, or `null` if the node does not have one.
     *
     * @returns The certificate over the block at which the Alpenglow consensus protocol was
     * activated.
     * @see https://solana.com/docs/rpc/http/getaggenesiscert
     */
    getAgGenesisCert(): GetAgGenesisCertApiResponse | null;
};
