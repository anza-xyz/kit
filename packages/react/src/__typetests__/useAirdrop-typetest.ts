/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react-hooks/rules-of-hooks */

import type { Address, ClientWithAirdrop, ClientWithRpc, Lamports, Signature } from '@solana/kit';

import type { ActionResult } from '../useAction';
import { useAirdrop } from '../useAirdrop';

// [DESCRIBE] useAirdrop
{
    const client = {} as ClientWithAirdrop;
    const address = {} as Address;
    const amount = {} as Lamports;

    // It returns an ActionResult over the (address, amount) args and the optional signature
    {
        const result = useAirdrop(client);
        result satisfies ActionResult<[address: Address, amount: Lamports], Signature | undefined>;
        result.dispatch(address, amount) satisfies void;
        result.dispatchAsync(address, amount) satisfies Promise<Signature | undefined>;
        result.data satisfies Signature | undefined;
    }

    // dispatch rejects a non-Address first argument
    {
        const { dispatch } = useAirdrop(client);
        // @ts-expect-error - first argument must be an Address
        dispatch(123, amount);
    }

    // dispatch rejects a non-Lamports second argument
    {
        const { dispatch } = useAirdrop(client);
        // @ts-expect-error - second argument must be Lamports
        dispatch(address, 123);
    }

    // dispatch rejects a missing amount argument
    {
        const { dispatch } = useAirdrop(client);
        // @ts-expect-error - amount is required
        dispatch(address);
    }

    // It rejects a client that lacks an airdrop capability
    {
        const rpcOnlyClient = {} as ClientWithRpc<unknown>;
        // @ts-expect-error - client must have an airdrop capability
        useAirdrop(rpcOnlyClient);
    }
}
