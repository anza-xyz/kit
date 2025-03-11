import { Commitment, Slot } from '@solana/rpc-types';
import { GraphQLResolveInfo } from 'graphql';

import { BlockLoaderArgs } from '../../loaders';
import { buildTransactionArgSetWithVisitor } from './transaction';
import { injectableRootVisitor } from './visitor';

/**
 * Build a set of block loader args by inspecting which fields have
 * been requested in the query (ie. `data` or inline fragments).
 */
export function buildBlockLoaderArgSetFromResolveInfo(
    args: {
        /**
         * Fetch blocks from slots that have reached at least this level of commitment.
         *
         * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
         * example, when using an API created by a `createSolanaRpc*()` helper, the default
         * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on
         * the client, the default commitment applied by the server is `"finalized"`.
         */
        commitment?: Omit<Commitment, 'processed'>;
        minContextSlot?: Slot;
        slot: Slot;
    },
    info: GraphQLResolveInfo,
): BlockLoaderArgs[] {
    const argSet: BlockLoaderArgs[] = [args];

    function buildArgSetWithVisitor(root: Parameters<typeof injectableRootVisitor>[1]) {
        injectableRootVisitor(info, root, {
            fieldNodeOperation(info, node) {
                if (node.name.value === 'signatures') {
                    argSet.push({ ...args, transactionDetails: 'signatures' });
                } else if (node.name.value === 'transactions') {
                    argSet.push(...buildTransactionArgSetWithVisitor({ ...args, transactionDetails: 'full' }, info));
                }
            },
            fragmentSpreadNodeOperation(_info, fragment) {
                buildArgSetWithVisitor(fragment);
            },
            inlineFragmentNodeOperation(_info, _node) {
                // Block schema doesn't support inline fragments at the
                // root level.
                return;
            },
        });
    }

    buildArgSetWithVisitor(null);

    return argSet;
}
