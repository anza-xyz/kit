import type { Rpc } from '@solana/rpc-spec';
import type { Blockhash, Slot } from '@solana/rpc-types';

import type { IsBlockhashValidApi } from '../isBlockhashValid';

const rpc = null as unknown as Rpc<IsBlockhashValidApi>;
const blockhash = null as unknown as Blockhash;

void (async () => {
    {
        const result = await rpc.isBlockhashValid(blockhash).send();
        result satisfies Readonly<{
            context: Readonly<{
                slot: Slot;
            }>;
            value: boolean;
        }>;
    }
});
