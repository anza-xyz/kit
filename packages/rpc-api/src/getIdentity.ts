import type { Address } from '@solana/addresses';

type GetIdentityApiResponse = Readonly<{
    identity: Address;
}>;

export type GetIdentityApi = {
    /**
     * Returns the identity pubkey for the current node.
     *
     * @see https://solana.com/docs/rpc/http/getidentity
     */
    getIdentity(): GetIdentityApiResponse;
};
