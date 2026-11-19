import type { Address } from '@solana/addresses';
import type { Rpc } from '@solana/rpc-spec';
import type { Slot } from '@solana/rpc-types';

import type { GetLeaderScheduleApi } from '../getLeaderSchedule';

const rpc = null as unknown as Rpc<GetLeaderScheduleApi>;
const slot = 0n as Slot;
const identity = 'Joe11111111111111111111111111111' as Address<'Joe11111111111111111111111111111'>;

void (async () => {
    {
        const result = await rpc.getLeaderSchedule().send();
        // Won't be null
        result satisfies Record<Address, Slot[]>;
    }

    {
        const result = await rpc.getLeaderSchedule(null).send();
        // Won't be null
        result satisfies Record<Address, Slot[]>;
    }

    {
        const result = await rpc.getLeaderSchedule(slot).send();
        // Can be null if the slot corresponds to an epoch that does not exist
        result satisfies Record<Address, Slot[]> | null;
    }

    {
        const result = await rpc.getLeaderSchedule(slot, { identity }).send();
        // Can be null if the slot corresponds to an epoch that does not exist
        result satisfies Readonly<{ [key: Address]: Slot[] | undefined }> | null;
    }

    {
        const result = await rpc.getLeaderSchedule(null, { identity }).send();
        // Won't be null
        result satisfies Readonly<{ [key: Address]: Slot[] | undefined }>;
    }

    // [DESCRIBE] keyByVoteAccount
    {
        // Accepts either key format without an identity filter.
        for (const keyByVoteAccount of [true, false]) {
            const current = await rpc.getLeaderSchedule(null, { keyByVoteAccount }).send();
            current satisfies Record<Address, Slot[]>;
            const selected = await rpc.getLeaderSchedule(slot, { keyByVoteAccount }).send();
            selected satisfies Record<Address, Slot[]> | null;
        }

        // The identity filter remains a validator identity when keys are vote accounts.
        {
            const current = await rpc.getLeaderSchedule(null, { identity, keyByVoteAccount: true }).send();
            current satisfies Readonly<{ [key: Address]: Slot[] | undefined }>;
            const selected = await rpc.getLeaderSchedule(slot, { identity, keyByVoteAccount: true }).send();
            selected satisfies Readonly<{ [key: Address]: Slot[] | undefined }> | null;
        }

        // Rejects non-boolean values.
        {
            // @ts-expect-error keyByVoteAccount must be a boolean
            rpc.getLeaderSchedule(null, { keyByVoteAccount: 'true' });
        }
    }
});
