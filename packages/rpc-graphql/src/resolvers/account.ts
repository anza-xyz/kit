import { Address } from '@solana/addresses';
import { Commitment, Slot } from '@solana/rpc-types';
import { GraphQLResolveInfo } from 'graphql';

import { RpcGraphQLContext } from '../context';
import { AccountLoaderValue, cacheKeyFn } from '../loaders';
import { buildAccountLoaderArgSetFromResolveInfo, onlyFieldsRequested } from './resolve-info';

type Encoding = 'base58' | 'base64' | 'base64+zstd';
type DataSlice = { length: number; offset: number };

export type EncodedAccountData = {
    [key: string]: string;
};

export type AccountResult = Partial<Omit<AccountLoaderValue, 'data'>> & {
    address: Address;
    encodedData?: EncodedAccountData;
    jsonParsedConfigs?: {
        accountType: string;
        programId: Address;
        programName: string;
    };
    ownerProgram?: Address;
};

export const resolveAccountData = () => {
    return (
        parent: AccountResult | null,
        args: {
            /**
             * Define which slice of the account's data you want the RPC to return.
             *
             * Use this to save network bandwidth and encoding time when you do not need the entire
             * buffer.
             */
            dataSlice?: DataSlice;
            encoding: Encoding;
        },
    ) => {
        return parent === null ? null : parent.encodedData ? parent.encodedData[cacheKeyFn(args)] : null;
    };
};

export const resolveAccount = (fieldName?: string) => {
    return async (
        parent: { [x: string]: Address },
        args: {
            address?: Address;
            /**
             * Fetch the details of the account as of the highest slot that has reached this level
             * of commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
            /**
             * Prevents accessing stale data by enforcing that the RPC node has processed
             * transactions up to this slot
             */
            minContextSlot?: Slot;
        },
        context: RpcGraphQLContext,
        info: GraphQLResolveInfo,
    ): Promise<AccountResult | null> => {
        const address = fieldName ? parent[fieldName] : args.address;

        if (address) {
            // Do not load any accounts if only the address is requested
            if (onlyFieldsRequested(['address'], info)) {
                return { address };
            }

            const argsSet = buildAccountLoaderArgSetFromResolveInfo({ ...args, address }, info);
            const loadedAccounts = await context.loaders.account.loadMany(argsSet);

            let result: AccountResult = {
                address,
                encodedData: {},
            };

            loadedAccounts.forEach((account, i) => {
                if (account instanceof Error) {
                    console.error(account);
                    return;
                }
                if (account === null) {
                    return;
                }
                if (!result.ownerProgram) {
                    result = {
                        ...result,
                        ...account,
                        ownerProgram: account.owner,
                    };
                }

                const { data } = account;
                const { encoding, dataSlice } = argsSet[i];

                if (encoding && result.encodedData) {
                    if (Array.isArray(data)) {
                        result.encodedData[
                            cacheKeyFn({
                                dataSlice,
                                encoding: encoding === 'jsonParsed' ? 'base64' : encoding,
                            })
                        ] = data[0];
                    } else if (typeof data === 'string') {
                        result.encodedData[
                            cacheKeyFn({
                                dataSlice,
                                encoding: 'base58',
                            })
                        ] = data;
                    } else if (typeof data === 'object') {
                        const {
                            parsed: { info: parsedData, type: accountType },
                            program: programName,
                            programId,
                        } = data;
                        result.jsonParsedConfigs = {
                            accountType,
                            programId,
                            programName,
                        };
                        if (Array.isArray(parsedData)) {
                            // If the `jsonParsed` data is an array, put it
                            // into a field called `entries`.
                            Object.assign(result, { entries: parsedData });
                        } else {
                            result = {
                                ...result,
                                ...(parsedData as object),
                            };
                        }
                    }
                }
            });

            return result;
        }

        return null;
    };
};
