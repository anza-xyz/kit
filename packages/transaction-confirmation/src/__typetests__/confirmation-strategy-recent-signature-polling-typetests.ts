/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable sort-keys-fix/sort-keys-fix */
import { GetEpochInfoApi, Rpc, RpcDevnet, RpcMainnet, RpcTestnet } from '@solana/rpc';

import { createBlockHeightExceedenceByPollingPromiseFactory } from '../confirmation-strategy-blockheight-polling';

const rpc = null as unknown as Rpc<GetEpochInfoApi>;
const rpcDevnet = null as unknown as RpcDevnet<GetEpochInfoApi>;
const rpcTestnet = null as unknown as RpcTestnet<GetEpochInfoApi>;
const rpcMainnet = null as unknown as RpcMainnet<GetEpochInfoApi>;

// [DESCRIBE] createBlockHeightExceedenceByPollingPromiseFactory
{
    {
        // It typechecks with specific cluster RPCs
        createBlockHeightExceedenceByPollingPromiseFactory({ rpc: rpcDevnet });
        createBlockHeightExceedenceByPollingPromiseFactory({ rpc: rpcTestnet });
        createBlockHeightExceedenceByPollingPromiseFactory({ rpc: rpcMainnet });
    }
    {
        // It typechecks with generic RPC
        createBlockHeightExceedenceByPollingPromiseFactory({ rpc });
    }
    {
        // It typechecks with optional defaultPollingInterval
        createBlockHeightExceedenceByPollingPromiseFactory({ rpc, defaultPollingInterval: 2000 });
        createBlockHeightExceedenceByPollingPromiseFactory({ rpc: rpcDevnet, defaultPollingInterval: 2000 });
    }
    {
        // It fails to typecheck with wrong cluster assignments
        const wrongClusterRpc = {
            ...rpcDevnet,
            '~cluster': 'wrongnet' as const,
        };
        // @ts-expect-error
        createBlockHeightExceedenceByPollingPromiseFactory({ rpc: wrongClusterRpc });
    }
    {
        // It fails to typecheck with invalid defaultPollingInterval type
        // @ts-expect-error
        createBlockHeightExceedenceByPollingPromiseFactory({ rpc, defaultPollingInterval: 'not-a-number' });
    }
    {
        // It fails to typecheck when required rpc parameter is missing
        // @ts-expect-error
        createBlockHeightExceedenceByPollingPromiseFactory({});
    }
}
