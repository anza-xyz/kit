import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import type { PendingRpcRequest, Rpc } from '@solana/rpc-spec';
import type { Commitment, Slot, TransactionError, UnixTimestamp } from '@solana/rpc-types';

import type { GetSignaturesForAddressApi } from '../getSignaturesForAddress';

const rpc = null as unknown as Rpc<GetSignaturesForAddressApi>;
const address = null as unknown as Address;

type GetSignaturesForAddressElement = Awaited<
    ReturnType<ReturnType<typeof rpc.getSignaturesForAddress>['send']>
>[number];

// [DESCRIBE] getSignaturesForAddress response
{
    // It returns a pending RPC request when called with no config
    {
        rpc.getSignaturesForAddress(address) satisfies PendingRpcRequest<readonly unknown[]>;
    }
    // It exposes the documented core fields on each element
    {
        const element = null as unknown as GetSignaturesForAddressElement;
        element.signature satisfies Signature;
        element.slot satisfies Slot;
        element.blockTime satisfies UnixTimestamp | null;
        element.confirmationStatus satisfies Commitment | null;
        element.err satisfies TransactionError | null;
        element.memo satisfies string | null;
    }
    // It exposes `transactionIndex` as an optional number
    {
        const element = null as unknown as GetSignaturesForAddressElement;
        element.transactionIndex satisfies number | undefined;
    }
    // `transactionIndex` is optional, so it may be omitted by older RPC servers
    {
        const responseFromOldRpc: GetSignaturesForAddressElement = {
            blockTime: null,
            confirmationStatus: null,
            err: null,
            memo: null,
            signature: null as unknown as Signature,
            slot: 0n as Slot,
        };
        responseFromOldRpc satisfies GetSignaturesForAddressElement;
    }
}
