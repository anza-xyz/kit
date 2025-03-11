import { Address } from '@solana/addresses';
import { Commitment, Slot } from '@solana/rpc-types';
import { GraphQLResolveInfo } from 'graphql';

import { ProgramAccountsLoaderArgs } from '../../loaders';
import { buildAccountArgSetWithVisitor } from './account';

/**
 * Build a set of account loader args by inspecting which fields have
 * been requested in the query (ie. `data` or inline fragments).
 */
export function buildProgramAccountsLoaderArgSetFromResolveInfo(
    args: {
        /**
         * Fetch the details of the accounts as of the highest slot that has reached this level of
         * commitment.
         *
         * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
         * example, when using an API created by a `createSolanaRpc*()` helper, the default
         * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on
         * the client, the default commitment applied by the server is `"finalized"`.
         */
        commitment?: Commitment;
        filters?: (
            | {
                  dataSize: bigint;
              }
            | {
                  memcmp: {
                      bytes: string;
                      encoding: 'base58' | 'base64';
                      offset: bigint;
                  };
              }
        )[];
        /**
         * Prevents accessing stale data by enforcing that the RPC node has processed transactions
         * up to this slot
         */
        minContextSlot?: Slot;
        programAddress: Address;
    },
    info: GraphQLResolveInfo,
): ProgramAccountsLoaderArgs[] {
    return buildAccountArgSetWithVisitor(args, info);
}
