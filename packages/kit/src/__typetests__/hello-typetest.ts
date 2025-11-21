import { Address } from "@solana/addresses";
import { pipe } from "@solana/functional";
import { AccountLookupMeta, AccountMeta, AccountRole, Instruction } from "@solana/instructions";
import { AccountSignerMeta, generateKeyPairSigner, KeyPairSigner, setTransactionMessageFeePayerSigner, signTransactionMessageWithSigners, TransactionMessageWithFeePayerSigner, TransactionModifyingSigner, TransactionPartialSigner, TransactionSigner } from "@solana/signers";
import { appendTransactionMessageInstruction, BaseTransactionMessage, BlockhashLifetimeConstraint, createTransactionMessage, setTransactionMessageFeePayer, setTransactionMessageLifetimeUsingBlockhash, TransactionMessageWithBlockhashLifetime, TransactionMessageWithFeePayer, TransactionVersion } from "@solana/transaction-messages";
import { TransactionWithBlockhashLifetime } from "@solana/transactions";

type KeysOfUnion<T> = T extends any ? keyof T : never;

type SignerKeysToExcludeForFeePayer = Exclude<KeysOfUnion<TransactionSigner>, 'address'>;
type SignerKeysToExcludeForAccountMeta = 'signer';
type SignerKeysToExclude = SignerKeysToExcludeForFeePayer | SignerKeysToExcludeForAccountMeta;
type NonSigner<T> = T & {
    [K in SignerKeysToExclude]?: never;
}

type NonSignerFeePayer<TAddress extends string = string> = NonSigner<TransactionMessageWithFeePayer<TAddress>['feePayer']>;
type TransactionMessageWithNonSignerFeePayer<TAddress extends string = string> = {
    readonly feePayer: Readonly<NonSignerFeePayer<TAddress>>;
}

type NonSignerAccountMeta = NonSigner<AccountMeta | AccountLookupMeta>;
type NonSignerInstruction<TProgramAddress extends string = string> = Instruction<TProgramAddress, NonSignerAccountMeta[]>;

type AccountMetaWithSigner<TSigner extends TransactionSigner = TransactionSigner> =
    | AccountLookupMeta
    | AccountMeta
    | AccountSignerMeta<string, TSigner>;

type InstructionWithSigners<
    TSigner extends TransactionSigner = TransactionSigner,
    TAccounts extends readonly (NonSignerAccountMeta | AccountSignerMeta<string, TSigner>)[] = readonly (NonSignerAccountMeta | AccountSignerMeta<string, TSigner>)[],
> = Pick<Instruction<string, TAccounts>, 'accounts'>;

type TransactionMessageWithSigners<
    TAddress extends string = string,
    TSigner extends TransactionSigner<TAddress> = TransactionSigner<TAddress>,
    TAccounts extends readonly AccountMetaWithSigner<TSigner>[] = readonly AccountMetaWithSigner<TSigner>[],
> = Partial<TransactionMessageWithNonSignerFeePayer<TAddress> | TransactionMessageWithFeePayerSigner<TAddress, TSigner>> &
    Pick<
        BaseTransactionMessage<TransactionVersion, (NonSignerInstruction | (Instruction & InstructionWithSigners<TSigner, TAccounts>))>,
        'instructions'
    >;

// fee payer: partial signer
{
    const signer = null as unknown as TransactionPartialSigner;

    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayerSigner(signer, tx),
        tx => setTransactionMessageLifetimeUsingBlockhash(null as unknown as BlockhashLifetimeConstraint, tx)
    )

    transactionMessage satisfies TransactionMessageWithSigners<Address>;
    // @ts-expect-error signer fee-payer
    transactionMessage satisfies TransactionMessageWithNonSignerFeePayer<Address>;
    transactionMessage satisfies TransactionMessageWithFeePayerSigner<Address, TransactionSigner>;
    transactionMessage.feePayer satisfies TransactionPartialSigner;
    transactionMessage satisfies TransactionMessageWithFeePayerSigner<Address, TransactionPartialSigner>;
    // @ts-expect-error fee-payer is not a modifying signer
    transactionMessage satisfies TransactionMessageWithFeePayerSigner<Address, TransactionModifyingSigner>;
}

// fee payer: modifying signer
{
    const signer = null as unknown as TransactionModifyingSigner;

    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayerSigner(signer, tx),
        tx => setTransactionMessageLifetimeUsingBlockhash(null as unknown as BlockhashLifetimeConstraint, tx)
    )

    transactionMessage satisfies TransactionMessageWithSigners<Address>;
    // @ts-expect-error signer fee-payer
    transactionMessage satisfies TransactionMessageWithNonSignerFeePayer<Address>;
    transactionMessage satisfies TransactionMessageWithFeePayerSigner<Address, TransactionSigner>;
    transactionMessage.feePayer satisfies TransactionModifyingSigner;
    transactionMessage satisfies TransactionMessageWithFeePayerSigner<Address, TransactionModifyingSigner>;
    // @ts-expect-error fee-payer is not a partial signer
    transactionMessage satisfies TransactionMessageWithFeePayerSigner<Address, TransactionPartialSigner>;
}

// fee payer: no signer
// instruction: partial signer
{
    const address = null as unknown as Address;
    const signer = null as unknown as TransactionPartialSigner;

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
                    role: AccountRole.READONLY_SIGNER,
                }
            ]
        }, tx)
    )

    // @ts-expect-error signer in instruction
    transactionMessage satisfies Pick<
        BaseTransactionMessage<TransactionVersion, NonSignerInstruction>,
        'instructions'
    >;

    transactionMessage.instructions[0] satisfies InstructionWithSigners<TransactionPartialSigner>;

    transactionMessage.instructions[0].accounts[0] satisfies NonSignerAccountMeta;


    transactionMessage.instructions[0] satisfies InstructionWithSigners<TransactionModifyingSigner>;


    transactionMessage satisfies TransactionMessageWithNonSignerFeePayer;
    transactionMessage satisfies TransactionMessageWithSigners<Address, TransactionSigner>;
    transactionMessage satisfies TransactionMessageWithSigners<Address, TransactionPartialSigner>;
    // UNCOMMENT @ts-expect-error fee-payer is not a modifying signer
    transactionMessage satisfies TransactionMessageWithSigners<Address, TransactionModifyingSigner>;
}


