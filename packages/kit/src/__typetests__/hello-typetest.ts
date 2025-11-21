import { Address } from "@solana/addresses";
import { pipe } from "@solana/functional";
import { AccountRole } from "@solana/instructions";
import { generateKeyPairSigner, KeyPairSigner, setTransactionMessageFeePayerSigner, signTransactionMessageWithSigners, TransactionMessageWithFeePayerSigner, TransactionModifyingSigner, TransactionPartialSigner, TransactionSigner } from "@solana/signers";
import { appendTransactionMessageInstruction, BaseTransactionMessage, BlockhashLifetimeConstraint, createTransactionMessage, setTransactionMessageFeePayer, setTransactionMessageLifetimeUsingBlockhash, TransactionMessageWithBlockhashLifetime, TransactionMessageWithFeePayer } from "@solana/transaction-messages";
import { TransactionWithBlockhashLifetime } from "@solana/transactions";

type KeysOfUnion<T> = T extends any ? keyof T : never;

type SignerKeysToExclude = Exclude<KeysOfUnion<TransactionSigner>, 'address'>;

type NonSignerFeePayer<TAddress extends string = string> = {
    readonly address: Address<TAddress>;
} & {
    [K in SignerKeysToExclude]?: never;
};

type TransactionMessageWithNonSignerFeePayer<TAddress extends string = string> = {
    readonly feePayer: Readonly<NonSignerFeePayer<TAddress>>;
}

type TransactionMessageWithSigners<
    TAddress extends string = string,
    TSigner extends TransactionSigner<TAddress> = TransactionSigner<TAddress>,
> = Partial<TransactionMessageWithNonSignerFeePayer<TAddress> | TransactionMessageWithFeePayerSigner<TAddress, TSigner>>;

async function a() {
    const signer = await generateKeyPairSigner();

    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayerSigner(signer, tx),
        tx => setTransactionMessageLifetimeUsingBlockhash(null as unknown as BlockhashLifetimeConstraint, tx)
    )

    transactionMessage satisfies TransactionMessageWithSigners<Address>;
    // @ts-expect-error signer fee-payer
    transactionMessage satisfies TransactionMessageWithNonSignerFeePayer<Address>;
    transactionMessage satisfies TransactionMessageWithFeePayerSigner<Address, TransactionSigner>;
    transactionMessage.feePayer satisfies KeyPairSigner;
    transactionMessage satisfies TransactionMessageWithFeePayerSigner<Address, KeyPairSigner>;
    transactionMessage satisfies TransactionMessageWithFeePayerSigner<Address, TransactionPartialSigner>;
    // @ts-expect-error fee-payer is not a modifying signer
    transactionMessage satisfies TransactionMessageWithFeePayerSigner<Address, TransactionModifyingSigner>;

    const transaction = await signTransactionMessageWithSigners(transactionMessage);
    transaction satisfies TransactionWithBlockhashLifetime;
}

async function b() {
    const address = await generateKeyPairSigner().then(s => s.address);
    const signer = await generateKeyPairSigner();

    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayer(address, tx),
        tx => setTransactionMessageLifetimeUsingBlockhash(null as unknown as BlockhashLifetimeConstraint, tx),
        tx => appendTransactionMessageInstruction({
            programAddress: 'a' as Address,
            accounts: [
                {
                    address: signer.address,
                    signer,
                    role: AccountRole.READONLY,
                }
            ]
        }, tx)
    )

    transactionMessage satisfies TransactionMessageWithNonSignerFeePayer<Address>;
    transactionMessage satisfies TransactionMessageWithSigners<Address, TransactionSigner>;
    transactionMessage satisfies TransactionMessageWithSigners<Address, KeyPairSigner>;
    transactionMessage satisfies TransactionMessageWithSigners<Address, TransactionPartialSigner>;
    transactionMessage satisfies TransactionMessageWithSigners<Address, TransactionModifyingSigner>;



}

async function test() {
    const signer = null as unknown as TransactionModifyingSigner;

    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayerSigner(signer, tx),
    )

    transactionMessage satisfies TransactionMessageWithSigners<Address, TransactionPartialSigner>;

}