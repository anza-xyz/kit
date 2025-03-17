import { Address } from '@solana/addresses';

type ClusterNode = Readonly<{
    /**
     * The unique identifier of the node's feature set.
     *
     * This value is computed by sorting all feature addresses' byte arrays lexicographically,
     * hashing them, then taking the first 4 bytes of the result. This keeps the feature set value
     * stable across versions until a new feature is introduced.
     */
    featureSet: number | null;
    /** Gossip network address for the node (host:port) */
    gossip: string | null;
    /** Node public key, as base-58 encoded string */
    pubkey: Address;
    /** WebSocket PubSub network address for the node (host:port) */
    pubsub: string | null;
    /** JSON RPC network address for the node, or `null` if the JSON RPC service is not enabled */
    rpc: string | null;
    /** Server repair UDP network address for the node (host:port) */
    serveRepair: string | null;
    /** The shred version the node has been configured to use */
    shredVersion: number | null;
    /** TPU network address for the node (host:port) */
    tpu: string | null;
    /** Tpu UDP forwards network address for the node (host:port) */
    tpuForwards: string | null;
    /** Tpu QUIC forwards network address for the node (host:port) */
    tpuForwardsQuic: string | null;
    /** Tpu QUIC network address for the node (host:port) */
    tpuQuic: string | null;
    /** Tpu UDP vote network address for the node (host:port) */
    tpuVote: string | null;
    /** Tvu UDP network address for the node (host:port) */
    tvu: string | null;
    /** The software version of the node, or `null` if the version information is not available */
    version: string | null;
}>;

type GetClusterNodesApiResponse = readonly ClusterNode[];

export type GetClusterNodesApi = {
    /**
     * Returns information about all the nodes participating in the cluster.
     *
     * @see https://solana.com/docs/rpc/http/getclusternodes
     */
    getClusterNodes(): GetClusterNodesApiResponse;
};
