import { getSysvarEpochRewardsCodec } from '../epoch-rewards';

describe('epoch rewards', () => {
    it('decode', () => {
        // prettier-ignore
        const epochRewardsState = new Uint8Array([
            // distributionStartingBlockHeight
            0xab, 0xa8, 0x87, 0x12, 0x00, 0x00, 0x00, 0x00,
            // numPartitions
            0x3a, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            // parentBlockhash
            0x67, 0x8b, 0xd4, 0xe4, 0xc8, 0x5c, 0x10, 0x87, 0xa8, 0x0a, 0xfb, 0x2f, 0x0d, 0xbb, 0x13, 0x27, 0x16, 0x11, 0x3a, 0xc7, 0xc7, 0xb0, 0xc7, 0xe4, 0x99, 0x51, 0x4d, 0x42, 0xdb, 0x43, 0xd7, 0x1c,
            // totalPoints
            0x10, 0xbe, 0x90, 0x99, 0x7a, 0x16, 0x9e, 0xa5, 0xc2, 0x2d, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 
            // totalRewards
            0x00, 0xb3, 0x04, 0x4e, 0xd0, 0x20, 0x89, 0x00,
            // distributedRewards
            0x00, 0xb8, 0xea, 0x37, 0xd0, 0x20, 0x89, 0x00,
            // active
            0x00,
        ]);
        expect(getSysvarEpochRewardsCodec().decode(epochRewardsState)).toStrictEqual({
            active: false,
            distributedRewards: 38598150472775680n,
            distributionStartingBlockHeight: 310880427n,
            numPartitions: 314n,
            parentBlockhash: '7yCfKTaamnrmkAfefSgsonQ6rtwCfVaxQJircWb9K4Qj',
            totalPoints: 2633948733309470433656336n,
            totalRewards: 38598150843577088n,
        });
    });
    // TODO: This account does not seem to exist on-chain yet.
    it.todo('fetch');
});
