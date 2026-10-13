import { assertAccountDecoded, assertAccountExists, fetchJsonParsedAccount } from '@solana/accounts';
import type { GetAccountInfoApi } from '@solana/rpc-api';
import type { Rpc } from '@solana/rpc-spec';

import { fetchSysvarRecentBlockhashes, getSysvarRecentBlockhashesCodec } from '../recent-blockhashes';
import { SYSVAR_RECENT_BLOCKHASHES_ADDRESS } from '../sysvar';
import { createLocalhostSolanaRpc } from './__setup__';

describe('recent blockhashes', () => {
    let rpc: Rpc<GetAccountInfoApi>;
    beforeEach(() => {
        rpc = createLocalhostSolanaRpc();
    });
    it('decode', () => {
        // prettier-ignore
        const recentBlockhashesState = new Uint8Array([
            2, 0, 0, 0, 0, 0, 0, 0,     // array length 
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            134, 74, 2, 0, 0, 0, 0, 0,  // lamportsPerSignature
            2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
            134, 74, 2, 0, 0, 0, 0, 0,  // lamportsPerSignature
        ]);
        expect(getSysvarRecentBlockhashesCodec().decode(recentBlockhashesState)).toMatchObject([
            {
                blockhash: '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi',
                feeCalculator: {
                    lamportsPerSignature: 150_150n,
                },
            },
            {
                blockhash: '8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR',
                feeCalculator: {
                    lamportsPerSignature: 150_150n,
                },
            },
        ]);
    });
    it('fetch', async () => {
        expect.assertions(1);
        const recentBlockhashes = await fetchSysvarRecentBlockhashes(rpc);
        expect(recentBlockhashes).toMatchObject(
            expect.arrayContaining([
                {
                    blockhash: expect.any(String),
                    feeCalculator: {
                        lamportsPerSignature: expect.any(BigInt),
                    },
                },
            ]),
        );
    });
    it("decodes the same entries as the RPC node's `jsonParsed` encoding", async () => {
        expect.assertions(1);
        // Fetch the node's own parse first. New blockhashes are pushed onto the front of the sysvar, so its
        // most recent entry will still be present by the time we fetch and decode the raw bytes ourselves.
        const jsonParsedAccount = await fetchJsonParsedAccount<
            { blockhash: string; feeCalculator: { lamportsPerSignature: string } }[]
        >(rpc, SYSVAR_RECENT_BLOCKHASHES_ADDRESS);
        assertAccountDecoded(jsonParsedAccount);
        assertAccountExists(jsonParsedAccount);
        const [mostRecentJsonParsedEntry] = jsonParsedAccount.data;
        const recentBlockhashes = await fetchSysvarRecentBlockhashes(rpc);
        expect(recentBlockhashes).toContainEqual({
            blockhash: mostRecentJsonParsedEntry.blockhash,
            feeCalculator: {
                // `jsonParsed` renders `lamportsPerSignature` as a string.
                lamportsPerSignature: BigInt(mostRecentJsonParsedEntry.feeCalculator.lamportsPerSignature),
            },
        });
    });
});
