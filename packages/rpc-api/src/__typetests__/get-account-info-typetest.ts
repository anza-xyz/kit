import { Address } from '@solana/addresses';
import { Rpc } from '@solana/rpc-spec';
import type {
    AccountInfoWithJsonData,
    Base58EncodedBytes,
    Base58EncodedDataResponse,
    Base64EncodedDataResponse,
    Base64EncodedZStdCompressedDataResponse,
    Lamports,
    Slot,
} from '@solana/rpc-types';

import { GetAccountInfoApi } from '../getAccountInfo';

const rpc = null as unknown as Rpc<GetAccountInfoApi>;
const accountAddress = null as unknown as Address;

void (async () => {
    // Omitted config
    {
        const response = await rpc.getAccountInfo(accountAddress).send();
        response.context.slot satisfies Slot;
        if (response.value) {
            response.value.executable satisfies boolean;
            response.value.lamports satisfies Lamports;
            response.value.owner satisfies Address;
            response.value.space satisfies bigint;
            response.value.data satisfies Base58EncodedBytes;
        }
    }

    // Encoding set to `base58`
    {
        const response = await rpc.getAccountInfo(accountAddress, { encoding: 'base58' }).send();
        response.context.slot satisfies Slot;
        if (response.value) {
            response.value.executable satisfies boolean;
            response.value.lamports satisfies Lamports;
            response.value.owner satisfies Address;
            response.value.space satisfies bigint;
            response.value.data satisfies Base58EncodedDataResponse;
        }
    }

    // Encoding set to `base64`
    {
        const response = await rpc.getAccountInfo(accountAddress, { encoding: 'base64' }).send();
        response.context.slot satisfies Slot;
        if (response.value) {
            response.value.executable satisfies boolean;
            response.value.lamports satisfies Lamports;
            response.value.owner satisfies Address;
            response.value.space satisfies bigint;
            response.value.data satisfies Base64EncodedDataResponse;
        }
    }

    // Encoding set to `base64+zstd`
    {
        const response = await rpc.getAccountInfo(accountAddress, { encoding: 'base64+zstd' }).send();
        response.context.slot satisfies Slot;
        if (response.value) {
            response.value.executable satisfies boolean;
            response.value.lamports satisfies Lamports;
            response.value.owner satisfies Address;
            response.value.space satisfies bigint;
            response.value.data satisfies Base64EncodedZStdCompressedDataResponse;
        }
    }

    // Encoding set to `jsonParsed`
    {
        const response = await rpc.getAccountInfo(accountAddress, { encoding: 'jsonParsed' }).send();
        response.context.slot satisfies Slot;
        if (response.value) {
            response.value.executable satisfies boolean;
            response.value.lamports satisfies Lamports;
            response.value.owner satisfies Address;
            response.value.space satisfies bigint;
            response.value.data satisfies AccountInfoWithJsonData['data'];
        }
    }
})();
