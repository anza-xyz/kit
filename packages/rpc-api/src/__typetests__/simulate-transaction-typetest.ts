import type { PendingRpcRequest, Rpc } from '@solana/rpc-spec';
import {
    TransactionForFullMetaInnerInstructionsParsed,
    TransactionForFullMetaInnerInstructionsUnparsed,
} from '@solana/rpc-types';
import { Base64EncodedWireTransaction, TransactionBlockhashLifetime } from '@solana/transactions';

import type { SimulateTransactionApi } from '../simulateTransaction';

const rpc = null as unknown as Rpc<SimulateTransactionApi>;
const base64Transaction = 'SomeTx11111111111111111111111111111' as Base64EncodedWireTransaction;

// [DESCRIBE] The interaction between `sigVerify` and `replaceRecentBlockhash`.
{
    // It raises a type error if both are true
    {
        rpc.simulateTransaction(
            base64Transaction,
            // @ts-expect-error Can't both be true.
            {
                encoding: 'base64',
                replaceRecentBlockhash: true,
                sigVerify: true,
            },
        );
    }
    // It allows `replaceRecentBlockhash` to be true so long as `sigVerify` is not
    {
        rpc.simulateTransaction(base64Transaction, {
            encoding: 'base64',
            replaceRecentBlockhash: true,
            sigVerify: false,
        });
        rpc.simulateTransaction(base64Transaction, {
            encoding: 'base64',
            replaceRecentBlockhash: true,
            // `sigVerify` omitted
        });
    }
    // It allows `sigVerify` to be true so long as `replaceRecentBlockhash` is not
    {
        rpc.simulateTransaction(base64Transaction, {
            encoding: 'base64',
            replaceRecentBlockhash: false,
            sigVerify: true,
        });
        rpc.simulateTransaction(base64Transaction, {
            encoding: 'base64',
            // `replaceRecentBlockhash` omitted
            sigVerify: true,
        });
    }
}

// [DESCRIBE] `innerInstructions`.
{
    // It materializes inner instructions in the repsonse when `true`
    {
        rpc.simulateTransaction(base64Transaction, {
            encoding: 'base64',
            innerInstructions: true,
        }) satisfies PendingRpcRequest<{
            value: TransactionForFullMetaInnerInstructionsParsed | TransactionForFullMetaInnerInstructionsUnparsed;
        }>;
    }
    // It does not materialize inner instructions in the repsonse when `false` or omitted
    {
        rpc.simulateTransaction(base64Transaction, {
            encoding: 'base64',
            innerInstructions: false,
            // @ts-expect-error `innerInstructions` should not be a property on the response
        }) satisfies PendingRpcRequest<{ value: { innerInstructions: unknown } }>;
        rpc.simulateTransaction(base64Transaction, {
            encoding: 'base64',
            // @ts-expect-error `innerInstructions` should not be a property on the response
        }) satisfies PendingRpcRequest<{ value: { innerInstructions: unknown } }>;
    }
}

// [DESCRIBE] `replaceRecentBlockhash`.
{
    // It materializes a replacement blockhash in the repsonse when `true`
    {
        rpc.simulateTransaction(base64Transaction, {
            encoding: 'base64',
            replaceRecentBlockhash: true,
        }) satisfies PendingRpcRequest<{ value: { replacementBlockhash: TransactionBlockhashLifetime } }>;
    }
    // It does not materialize a replacement blockhash in the repsonse when `false` or omitted
    {
        rpc.simulateTransaction(base64Transaction, {
            encoding: 'base64',
            replaceRecentBlockhash: false,
            // @ts-expect-error `replacementBlockhash` should not be a property on the response
        }) satisfies PendingRpcRequest<{ value: { replacementBlockhash: unknown } }>;
        rpc.simulateTransaction(base64Transaction, {
            encoding: 'base64',
            // @ts-expect-error `replacementBlockhash` should not be a property on the response
        }) satisfies PendingRpcRequest<{ value: { replacementBlockhash: unknown } }>;
    }
}
