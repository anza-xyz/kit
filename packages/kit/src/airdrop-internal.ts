import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import type { RequestAirdropApi, Rpc } from '@solana/rpc';
import type { Commitment, Lamports } from '@solana/rpc-types';

type RequestAndConfirmAirdropConfig = Readonly<{
    abortSignal?: AbortSignal;
    commitment: Commitment;
    confirmSignatureOnlyTransaction: (
        config: Readonly<{
            abortSignal?: AbortSignal;
            commitment: Commitment;
            signature: Signature;
        }>,
    ) => Promise<void>;
    lamports: Lamports;
    recipientAddress: Address;
    rpc: Rpc<RequestAirdropApi>;
}>;

export async function requestAndConfirmAirdrop_INTERNAL_ONLY_DO_NOT_EXPORT({
    abortSignal,
    commitment,
    confirmSignatureOnlyTransaction,
    lamports,
    recipientAddress,
    rpc,
}: RequestAndConfirmAirdropConfig): Promise<Signature> {
    const airdropTransactionSignature = await rpc
        .requestAirdrop(recipientAddress, lamports, { commitment })
        .send({ abortSignal });
    await confirmSignatureOnlyTransaction({
        abortSignal,
        commitment,
        signature: airdropTransactionSignature,
    });
    return airdropTransactionSignature;
}
