import { Address } from "@solana/addresses";
import { pipe } from "@solana/functional";
import { TransactionMessageWithSigners, TransactionModifyingSigner, TransactionPartialSigner, setTransactionMessageFeePayerSigner } from "@solana/signers";
import { createTransactionMessage } from "@solana/transaction-messages";

{
    const signer = null as unknown as TransactionModifyingSigner;

    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayerSigner(signer, tx),
    )

    transactionMessage satisfies TransactionMessageWithSigners<Address, TransactionPartialSigner>;
}
