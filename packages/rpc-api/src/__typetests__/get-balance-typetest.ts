import type { Address } from '@solana/addresses';
import type { Rpc } from '@solana/rpc-spec';
import type { Lamports, Slot } from '@solana/rpc-types';

import type { GetBalanceApi } from '../getBalance';

const rpc = null as unknown as Rpc<GetBalanceApi>;
const address = null as unknown as Address;

void (async () => {
    {
        const result = await rpc.getBalance(address).send();
        result satisfies Readonly<{
            context: Readonly<{
                slot: Slot;
            }>;
            value: Lamports;
        }>;
    }
});
