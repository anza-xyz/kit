/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable sort-keys-fix/sort-keys-fix */
import {
    GetEpochInfoApi,
    GetSignatureStatusesApi,
    Rpc,
    RpcDevnet,
    RpcMainnet,
    RpcTestnet,
    SendTransactionApi,
} from '@solana/rpc';

import { sendAndPollToConfirmTransactionFactory } from '../send-and-poll-to-confirm-transaction';

const rpc = null as unknown as Rpc<GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi>;
const rpcDevnet = null as unknown as RpcDevnet<GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi>;
const rpcTestnet = null as unknown as RpcTestnet<GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi>;
const rpcMainnet = null as unknown as RpcMainnet<GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi>;

// [DESCRIBE] sendAndPollToConfirmTransactionFactory
{
    {
        // It typechecks with specific cluster RPCs
        sendAndPollToConfirmTransactionFactory({ rpc: rpcDevnet });
        sendAndPollToConfirmTransactionFactory({ rpc: rpcTestnet });
        sendAndPollToConfirmTransactionFactory({ rpc: rpcMainnet });
    }
    {
        // It typechecks with optional polling interval
        sendAndPollToConfirmTransactionFactory({ rpc: rpcDevnet, pollingInterval: 1000 });
        sendAndPollToConfirmTransactionFactory({ rpc: rpcTestnet, pollingInterval: 1000 });
        sendAndPollToConfirmTransactionFactory({ rpc: rpcMainnet, pollingInterval: 1000 });
    }
    {
        // It typechecks with generic RPC
        sendAndPollToConfirmTransactionFactory({ rpc });
        sendAndPollToConfirmTransactionFactory({ rpc, pollingInterval: 1000 });
    }
    {
        // It fails to typecheck when using generic RPC with explicit cluster type
        // @ts-expect-error
        sendAndPollToConfirmTransactionFactory<'devnet'>({ rpc });
        // @ts-expect-error
        sendAndPollToConfirmTransactionFactory<'testnet'>({ rpc });
        // @ts-expect-error
        sendAndPollToConfirmTransactionFactory<'mainnet'>({ rpc });
    }
    {
        // It fails to typecheck when using wrong cluster type
        // @ts-expect-error
        sendAndPollToConfirmTransactionFactory<'mainnet'>({ rpc: rpcDevnet });
        // @ts-expect-error
        sendAndPollToConfirmTransactionFactory<'devnet'>({ rpc: rpcTestnet });
        // @ts-expect-error
        sendAndPollToConfirmTransactionFactory<'testnet'>({ rpc: rpcMainnet });
    }
}
