import type { Address } from '@solana/addresses';
import type { Slot } from '@solana/rpc-types';

export type IdentityTransitionStatusApiResponse = Readonly<{
    /** Consensus context: unknown before a request or when no context is available. */
    consensus: 'alpenglow' | 'tower' | 'unknown';
    /** Published identity, which may change before voting-context adoption completes. */
    currentIdentity: Address;
    /** Command or observation diagnostic; a failed observation does not reject a command. */
    error: string | null;
    /** Identity being replaced. */
    fromIdentity: Address;
    /** Highest old-context slot accepted by the outbound voting channel, including refreshes.
     * Null means no observed submission; zero is a distinct valid slot. Restored history
     * does not establish a submission. This value is frozen at adoption.
     */
    fromIdentityLastSubmittedVoteSlot: Slot | null;
    /** Identifies this validator instance; changes across restarts. */
    processInstanceId: string;
    /** Latest command sequence, scoped to processInstanceId; zero before a request. */
    sequence: bigint;
    /** Complete requires command success and successful voting-context adoption. */
    state: 'complete' | 'failed' | 'idle' | 'transitioning';
    /** Requested identity. */
    toIdentity: Address;
    /** Old Tower root; null for Alpenglow and when unavailable. */
    towerRootSlot: Slot | null;
    /** Observation contract version, currently 1. */
    version: bigint;
    /** Vote account; empty before the first observed command. */
    voteAccount: Address | '';
}>;

export type IdentityTransitionStatusApi = {
    /**
     * Observes the latest identity transition on an Agave node supporting this method.
     *
     * Completion and submission do not establish transmission, landing, finalization,
     * queue drainage, or final tower/history persistence. This query neither waits for
     * completion nor changes identity. Unsupported nodes return a method-not-found error.
     * All u64 fields, including the contract version, are returned as bigint.
     *
     * @see https://github.com/anza-xyz/agave/pull/15801
     */
    identityTransitionStatus(): IdentityTransitionStatusApiResponse;
};
