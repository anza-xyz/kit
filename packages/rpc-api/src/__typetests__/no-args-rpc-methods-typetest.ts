// This file tests that RPC methods that can be called without arguments
// do not produce type errors and yield the expected response type.

import type { Rpc } from '@solana/rpc-spec';
import type { SolanaRpcApi } from '../index';

const rpc = null as unknown as Rpc<SolanaRpcApi>;

async () => {
    await rpc.getBlockHeight().send();
    await rpc.getBlockProduction().send();
    await rpc.getClusterNodes().send();
    await rpc.getEpochInfo().send();
    await rpc.getEpochSchedule().send();
    await rpc.getFirstAvailableBlock().send();
    await rpc.getGenesisHash().send();
    await rpc.getHealth().send();
    await rpc.getHighestSnapshotSlot().send();
    await rpc.getIdentity().send();
    await rpc.getInflationGovernor().send();
    await rpc.getInflationRate().send();
    await rpc.getLargestAccounts().send();
    await rpc.getLatestBlockhash().send();
    await rpc.getLeaderSchedule().send();
    await rpc.getMaxRetransmitSlot().send();
    await rpc.getMaxShredInsertSlot().send();
    await rpc.getRecentPerformanceSamples().send();
    await rpc.getRecentPrioritizationFees().send();
    await rpc.getSlot().send();
    await rpc.getSlotLeader().send();
    await rpc.getStakeMinimumDelegation().send();
    await rpc.getSupply().send();
    await rpc.getTransactionCount().send();
    await rpc.getVersion().send();
    await rpc.minimumLedgerSlot().send();
};
