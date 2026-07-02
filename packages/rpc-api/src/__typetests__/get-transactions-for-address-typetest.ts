import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import type { Rpc } from '@solana/rpc-spec';
import type {
    Base58EncodedDataResponse,
    Base64EncodedDataResponse,
    Commitment,
    Slot,
    TransactionError,
    UnixTimestamp,
} from '@solana/rpc-types';
import type { TransactionVersion } from '@solana/transaction-messages';

import type { GetTransactionsForAddressApi } from '../getTransactionsForAddress';

const rpc = null as unknown as Rpc<GetTransactionsForAddressApi>;
const address = null as unknown as Address;

void (async () => {
    // [DESCRIBE] getTransactionsForAddress signatures mode (default)
    {
        const response = await rpc.getTransactionsForAddress(address).send();

        // The response is the bare envelope, not wrapped in `context`/`value`
        response.data satisfies readonly unknown[];
        response.paginationToken satisfies string | null;

        for (const element of response.data) {
            // It exposes the documented signature fields
            element.signature satisfies Signature;
            element.slot satisfies Slot;
            element.blockTime satisfies UnixTimestamp | null;
            element.confirmationStatus satisfies Commitment | null;
            element.err satisfies TransactionError | null;
            element.memo satisfies string | null;
            // `transactionIndex` is always present (required, unlike getSignaturesForAddress)
            element.transactionIndex satisfies number;
        }
    }

    // It accepts the documented filters
    {
        await rpc
            .getTransactionsForAddress(address, {
                filters: {
                    blockTime: { eq: 0n as UnixTimestamp, gte: 0n as UnixTimestamp },
                    signature: { lt: null as unknown as Signature },
                    slot: { gte: 0n as Slot, lt: 1n as Slot },
                    status: 'succeeded',
                    tokenAccounts: 'balanceChanged',
                },
                limit: 100,
                paginationToken: '250000001:12',
                sortOrder: 'asc',
            })
            .send();
    }

    // `eq` is only supported on the `blockTime` filter, not on `slot` or `signature`
    {
        await rpc
            .getTransactionsForAddress(address, {
                filters: {
                    // @ts-expect-error `eq` is not supported on the `slot` filter.
                    slot: { eq: 0n as Slot },
                },
            })
            .send();
        await rpc
            .getTransactionsForAddress(address, {
                filters: {
                    // @ts-expect-error `eq` is not supported on the `signature` filter.
                    signature: { eq: null as unknown as Signature },
                },
            })
            .send();
    }

    // It rejects the `processed` commitment
    {
        await rpc
            .getTransactionsForAddress(address, {
                // @ts-expect-error `processed` commitment is not supported by this method.
                commitment: 'processed',
            })
            .send();
    }

    // It rejects an unknown filter status
    {
        await rpc
            .getTransactionsForAddress(address, {
                // @ts-expect-error `pending` is not a valid status.
                filters: { status: 'pending' },
            })
            .send();
    }

    // It rejects an `encoding` without `transactionDetails: 'full'`: the full overloads require
    // `transactionDetails: 'full'`, and the signatures overload does not accept an `encoding`.
    {
        await rpc
            .getTransactionsForAddress(address, {
                // @ts-expect-error `encoding` requires `transactionDetails: 'full'`.
                encoding: 'jsonParsed',
            })
            .send();
        await rpc
            .getTransactionsForAddress(address, {
                // @ts-expect-error `encoding` requires `transactionDetails: 'full'`.
                encoding: 'base64',
            })
            .send();
    }

    // [DESCRIBE] getTransactionsForAddress full mode

    // jsonParsed encoding, no `maxSupportedTransactionVersion`: legacy results omit the
    // versioned-only fields (`version`, `addressTableLookups`, `loadedAddresses`)
    {
        const response = await rpc
            .getTransactionsForAddress(address, { encoding: 'jsonParsed', transactionDetails: 'full' })
            .send();
        for (const element of response.data) {
            element.slot satisfies Slot;
            element.blockTime satisfies UnixTimestamp | null;
            element.transactionIndex satisfies number;
            element.transaction.message.accountKeys satisfies readonly { pubkey: Address }[];
            // @ts-expect-error `version` is absent unless `maxSupportedTransactionVersion` is set.
            element.version satisfies TransactionVersion;
            // @ts-expect-error `addressTableLookups` is absent unless `maxSupportedTransactionVersion` is set.
            element.transaction.message.addressTableLookups satisfies readonly unknown[];
            if (element.meta) {
                element.meta.costUnits satisfies bigint | undefined;
                // @ts-expect-error `loadedAddresses` is absent unless `maxSupportedTransactionVersion` is set.
                element.meta.loadedAddresses satisfies object;
            }
        }
    }

    // jsonParsed encoding with `maxSupportedTransactionVersion`: versioned results carry the
    // versioned-only fields
    {
        const response = await rpc
            .getTransactionsForAddress(address, {
                encoding: 'jsonParsed',
                maxSupportedTransactionVersion: 0,
                transactionDetails: 'full',
            })
            .send();
        for (const element of response.data) {
            element.version satisfies TransactionVersion;
            element.transaction.message.addressTableLookups satisfies readonly unknown[];
            if (element.meta) {
                element.meta.loadedAddresses.writable satisfies readonly Address[];
            }
        }
    }

    // base64 encoding, no `maxSupportedTransactionVersion`
    {
        const response = await rpc
            .getTransactionsForAddress(address, { encoding: 'base64', transactionDetails: 'full' })
            .send();
        for (const element of response.data) {
            element.transaction satisfies Base64EncodedDataResponse;
            // @ts-expect-error `version` is absent unless `maxSupportedTransactionVersion` is set.
            element.version satisfies TransactionVersion;
        }
    }

    // base64 encoding with `maxSupportedTransactionVersion`: version and meta `loadedAddresses` are
    // present, but the wire-transaction tuple is unchanged
    {
        const response = await rpc
            .getTransactionsForAddress(address, {
                encoding: 'base64',
                maxSupportedTransactionVersion: 0,
                transactionDetails: 'full',
            })
            .send();
        for (const element of response.data) {
            element.transaction satisfies Base64EncodedDataResponse;
            element.version satisfies TransactionVersion;
            if (element.meta) {
                element.meta.loadedAddresses.writable satisfies readonly Address[];
            }
        }
    }

    // base58 encoding, no `maxSupportedTransactionVersion`
    {
        const response = await rpc
            .getTransactionsForAddress(address, { encoding: 'base58', transactionDetails: 'full' })
            .send();
        for (const element of response.data) {
            element.transaction satisfies Base58EncodedDataResponse;
            // @ts-expect-error `version` is absent unless `maxSupportedTransactionVersion` is set.
            element.version satisfies TransactionVersion;
        }
    }

    // base58 encoding with `maxSupportedTransactionVersion`
    {
        const response = await rpc
            .getTransactionsForAddress(address, {
                encoding: 'base58',
                maxSupportedTransactionVersion: 0,
                transactionDetails: 'full',
            })
            .send();
        for (const element of response.data) {
            element.transaction satisfies Base58EncodedDataResponse;
            element.version satisfies TransactionVersion;
            if (element.meta) {
                element.meta.loadedAddresses.writable satisfies readonly Address[];
            }
        }
    }

    // json encoding (the default for full), no `maxSupportedTransactionVersion`
    {
        const response = await rpc.getTransactionsForAddress(address, { transactionDetails: 'full' }).send();
        for (const element of response.data) {
            element.transaction.message.accountKeys satisfies readonly Address[];
            // @ts-expect-error `version` is absent unless `maxSupportedTransactionVersion` is set.
            element.version satisfies TransactionVersion;
            // @ts-expect-error `addressTableLookups` is absent unless `maxSupportedTransactionVersion` is set.
            element.transaction.message.addressTableLookups satisfies readonly unknown[];
        }
    }

    // json encoding (the default for full) with `maxSupportedTransactionVersion`
    {
        const response = await rpc
            .getTransactionsForAddress(address, { maxSupportedTransactionVersion: 0, transactionDetails: 'full' })
            .send();
        for (const element of response.data) {
            element.transaction.message.accountKeys satisfies readonly Address[];
            element.version satisfies TransactionVersion;
            element.transaction.message.addressTableLookups satisfies readonly unknown[];
            if (element.meta) {
                element.meta.loadedAddresses.writable satisfies readonly Address[];
            }
        }
    }
})();
