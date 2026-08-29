import type { Rpc } from '@solana/rpc-spec';

import { GetAgGenesisCertApi } from '../index';
import { createLocalhostSolanaRpc } from './__setup__';

describe('getAgGenesisCert', () => {
    let rpc: Rpc<GetAgGenesisCertApi>;
    beforeEach(() => {
        rpc = createLocalhostSolanaRpc();
    });

    describe('when sent to a local validator with no Alpenglow genesis certificate', () => {
        it('returns null', async () => {
            expect.assertions(1);
            const certPromise = rpc.getAgGenesisCert().send();
            await expect(certPromise).resolves.toBeNull();
        });
    });

    it.todo('when sent to a local validator with an Alpenglow genesis certificate');
});
