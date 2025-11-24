import { Address } from '@solana/addresses';
import { AccountRole, Instruction } from '@solana/instructions';
import {
    OffchainMessage,
    OffchainMessageApplicationDomain,
    OffchainMessageContentFormat,
    OffchainMessageContentRestrictedAsciiOf1232BytesMax,
    OffchainMessageSignatory,
    OffchainMessageWithRequiredSignatories,
} from '@solana/offchain-messages';
import type { Blockhash } from '@solana/rpc-types';
import {
    TransactionMessage,
    TransactionMessageWithFeePayer,
    TransactionMessageWithLifetime,
} from '@solana/transaction-messages';
import {
    appendTransactionMessageInstruction,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/transaction-messages';

import { AccountSignerMeta } from '../account-signer-meta';
import { MessageModifyingSigner } from '../message-modifying-signer';
import { MessagePartialSigner } from '../message-partial-signer';
import { OffchainMessageSignatorySigner } from '../offchain-message-signer';
import { InstructionWithSigners, TransactionMessageWithSigners } from '../transaction-message-with-signers';
import { TransactionModifyingSigner } from '../transaction-modifying-signer';
import { TransactionPartialSigner } from '../transaction-partial-signer';
import { TransactionSendingSigner } from '../transaction-sending-signer';
import { TransactionSigner } from '../transaction-signer';

const APPLICATION_DOMAIN_BYTES = new Uint8Array([
    0x0d, 0x3b, 0x73, 0x0b, 0x9e, 0x88, 0x9b, 0x4b, 0x66, 0x1e, 0xd2, 0xa3, 0xce, 0x19, 0x1f, 0x68, 0xd3, 0x7d, 0xa7,
    0x44, 0x32, 0x06, 0xa1, 0x82, 0xb9, 0x46, 0x89, 0x1e, 0x00, 0x00, 0x00, 0x00,
]);

export function createMockInstructionWithSigners(signers: TransactionSigner[]): Instruction & InstructionWithSigners {
    return {
        accounts: signers.map(
            (signer): AccountSignerMeta => ({ address: signer.address, role: AccountRole.READONLY_SIGNER, signer }),
        ),
        data: new Uint8Array([]),
        programAddress: '11111111111111111111111111111111' as Address,
    };
}

export function createMockOffchainMessageWithSigners(
    signers: OffchainMessageSignatorySigner[],
): OffchainMessageWithRequiredSignatories<OffchainMessageSignatory | OffchainMessageSignatorySigner> &
    Omit<OffchainMessage, 'requiredSignatories'> {
    return Object.freeze({
        applicationDomain: APPLICATION_DOMAIN_BYTES as unknown as OffchainMessageApplicationDomain,
        content: {
            format: OffchainMessageContentFormat.RESTRICTED_ASCII_1232_BYTES_MAX,
            text: 'Hello world',
        } as OffchainMessageContentRestrictedAsciiOf1232BytesMax,
        requiredSignatories: [...signers],
        version: 0,
    });
}

export function createMockTransactionMessageWithSigners(
    signers: TransactionSigner[],
): TransactionMessage &
    TransactionMessageWithFeePayer &
    TransactionMessageWithLifetime &
    TransactionMessageWithSigners {
    const transaction = createTransactionMessage({ version: 0 });
    const transactionWithFeePayer = setTransactionMessageFeePayer(signers[0]?.address ?? '1111', transaction);
    const compilableTransaction = setTransactionMessageLifetimeUsingBlockhash(
        { blockhash: 'dummy_blockhash' as Blockhash, lastValidBlockHeight: 42n },
        transactionWithFeePayer,
    );
    return appendTransactionMessageInstruction(createMockInstructionWithSigners(signers), compilableTransaction);
}

export function createMockMessagePartialSigner(address: Address): MessagePartialSigner & { signMessages: jest.Mock } {
    return { address, signMessages: jest.fn() };
}

export function createMockMessageModifyingSigner(
    address: Address,
): MessageModifyingSigner & { modifyAndSignMessages: jest.Mock } {
    return { address, modifyAndSignMessages: jest.fn() };
}

export function createMockTransactionPartialSigner(
    address: Address,
): TransactionPartialSigner & { signTransactions: jest.Mock } {
    return { address, signTransactions: jest.fn() };
}

export function createMockTransactionModifyingSigner(
    address: Address,
): TransactionModifyingSigner & { modifyAndSignTransactions: jest.Mock } {
    return { address, modifyAndSignTransactions: jest.fn() };
}

export function createMockTransactionSendingSigner(
    address: Address,
): TransactionSendingSigner & { signAndSendTransactions: jest.Mock } {
    return { address, signAndSendTransactions: jest.fn() };
}

export function createMockTransactionCompositeSigner(address: Address) {
    return {
        ...createMockTransactionPartialSigner(address),
        ...createMockTransactionModifyingSigner(address),
        ...createMockTransactionSendingSigner(address),
    };
}
