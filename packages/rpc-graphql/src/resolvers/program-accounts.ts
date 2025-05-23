import { Address } from '@solana/addresses';
import { Commitment, GetProgramAccountsDatasizeFilter, GetProgramAccountsMemcmpFilter, Slot } from '@solana/rpc-types';
import type { GraphQLResolveInfo } from 'graphql';

import { RpcGraphQLContext } from '../context';
import { cacheKeyFn } from '../loaders';
import { AccountResult } from './account';
import { buildProgramAccountsLoaderArgSetFromResolveInfo } from './resolve-info';

export function resolveProgramAccounts(fieldName?: string) {
    return async (
        parent: { [x: string]: Address },
        args: {
            /**
             * Fetch the details of the accounts as of the highest slot that has reached this level
             * of commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
            dataSizeFilters?: GetProgramAccountsDatasizeFilter[];
            memcmpFilters?: GetProgramAccountsMemcmpFilter['memcmp'][];
            /**
             * Prevents accessing stale data by enforcing that the RPC node has processed
             * transactions up to this slot
             */
            minContextSlot?: Slot;
            programAddress: Address;
        },
        context: RpcGraphQLContext,
        info: GraphQLResolveInfo,
    ): Promise<AccountResult[] | null> => {
        const programAddress = fieldName ? parent[fieldName] : args.programAddress;
        let filters: (GetProgramAccountsDatasizeFilter | GetProgramAccountsMemcmpFilter)[] | undefined = [];
        if (args.memcmpFilters) {
            filters.concat(
                args.memcmpFilters.map(memcmpFilter => ({
                    memcmp: memcmpFilter,
                })),
            );
        }
        if (args.dataSizeFilters) {
            filters = filters.concat(args.dataSizeFilters);
        }
        if (filters.length === 0) {
            filters = undefined;
        }

        if (programAddress) {
            const argsSet = buildProgramAccountsLoaderArgSetFromResolveInfo({ ...args, filters, programAddress }, info);
            const loadedProgramAccountsLists = await context.loaders.programAccounts.loadMany(argsSet);

            const result: {
                [address: string]: AccountResult;
            } = {};

            loadedProgramAccountsLists.forEach((programAccounts, i) => {
                if (programAccounts instanceof Error) {
                    console.error(programAccounts);
                    return;
                }
                programAccounts.forEach(programAccount => {
                    const { account, pubkey: address } = programAccount;

                    const thisResult = (result[address] ||= {
                        ...account,
                        address,
                        encodedData: {},
                        ownerProgram: account.owner,
                    });

                    const { data } = account;
                    const { encoding, dataSlice } = argsSet[i];

                    if (encoding && thisResult.encodedData) {
                        if (Array.isArray(data)) {
                            thisResult.encodedData[
                                cacheKeyFn({
                                    dataSlice,
                                    encoding: encoding === 'jsonParsed' ? 'base64' : encoding,
                                })
                            ] = data[0];
                        } else if (typeof data === 'string') {
                            thisResult.encodedData[
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
                            thisResult.jsonParsedConfigs = {
                                accountType,
                                programId,
                                programName,
                            };
                            for (const key in parsedData as object) {
                                thisResult[key as keyof typeof thisResult] = parsedData[key];
                            }
                        }
                    }
                });
            });
            return Object.values(result);
        }
        return null;
    };
}
