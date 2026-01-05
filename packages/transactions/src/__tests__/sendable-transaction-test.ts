import { address } from '@solana/addresses';
import { getCompiledTransactionMessageEncoder } from '@solana/transaction-messages';
import { SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, SolanaError } from '@solana/errors';
import { SignatureBytes } from '@solana/keys';

import { assertIsSendableTransaction } from '../sendable-transaction';
import { TransactionMessageBytes } from '../transaction';

describe('assertIsSendableTransaction', () => {
    it('throws when the instruction count exceeds the limit', () => {
        const signerAddress = address('11111111111111111111111111111111');
        const programAddress = address('22222222222222222222222222222222222222222222');
        const instructions = new Array(65).fill({
            programAddressIndex: 1,
        });
        const compiledMessage = {
            header: {
                numReadonlyNonSignerAccounts: 1,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 1,
            },
            instructions,
            staticAccounts: [signerAddress, programAddress],
            version: 'legacy' as const,
        };
        const messageBytes = getCompiledTransactionMessageEncoder().encode(
            compiledMessage,
        ) as unknown as TransactionMessageBytes;
        const transaction = {
            messageBytes,
            signatures: {
                [signerAddress]: new Uint8Array(64).fill(1) as SignatureBytes,
            },
        };

        expect(() => assertIsSendableTransaction(transaction)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, {
                instructionCount: 65,
                instructionLimit: 64,
            }),
        );
    });
});
