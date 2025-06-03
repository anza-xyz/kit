import '@solana/test-matchers/toBeFrozenObject';

import { getBase58Encoder } from '@solana/codecs-strings';
import type { Blockhash } from '@solana/rpc-types';

import {
    assertIsTransactionMessageWithBlockhashLifetime,
    fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash,
    PROVISORY_BLOCKHASH_LIFETIME_CONSTRAINT,
    setTransactionMessageLifetimeUsingBlockhash,
    setTransactionMessageLifetimeUsingProvisoryBlockhash,
    TransactionMessageWithBlockhashLifetime,
} from '../blockhash';
import { BaseTransactionMessage } from '../transaction-message';

jest.mock('@solana/codecs-strings', () => ({
    ...jest.requireActual('@solana/codecs-strings'),
    getBase58Encoder: jest.fn(),
}));

// real implementations
const originalBase58Module = jest.requireActual('@solana/codecs-strings');
const originalGetBase58Encoder = originalBase58Module.getBase58Encoder();

describe('assertIsTransactionMessageWithBlockhashLifetime', () => {
    beforeEach(() => {
        // use real implementation
        jest.mocked(getBase58Encoder).mockReturnValue(originalGetBase58Encoder);
    });
    it('throws for a transaction with no lifetime constraint', () => {
        const transaction: BaseTransactionMessage = {
            instructions: [],
            version: 0,
        };
        expect(() => assertIsTransactionMessageWithBlockhashLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a durable nonce constraint', () => {
        const transaction = {
            instructions: [],
            lifetimeConstraint: {
                nonce: 'abcd',
            },
            version: 0,
        } as BaseTransactionMessage;
        expect(() => assertIsTransactionMessageWithBlockhashLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a blockhash but no lastValidBlockHeight in lifetimeConstraint', () => {
        const transaction = {
            instructions: [],
            lifetimeConstraint: {
                blockhash: '11111111111111111111111111111111',
            },
            version: 0,
        } as BaseTransactionMessage;
        expect(() => assertIsTransactionMessageWithBlockhashLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a lastValidBlockHeight but no blockhash in lifetimeConstraint', () => {
        const transaction = {
            instructions: [],
            lifetimeConstraint: {
                lastValidBlockHeight: 1234n,
            },
            version: 0,
        } as BaseTransactionMessage;
        expect(() => assertIsTransactionMessageWithBlockhashLifetime(transaction)).toThrow();
    });
    it('throws for a transaction with a blockhash lifetime but an invalid blockhash value', () => {
        const transaction = {
            instructions: [],
            lifetimeConstraint: {
                blockhash: 'not a valid blockhash value',
            },
            version: 0,
        } as BaseTransactionMessage;
        expect(() => assertIsTransactionMessageWithBlockhashLifetime(transaction)).toThrow();
    });
    it('does not throw for a transaction with a valid blockhash lifetime constraint', () => {
        const transaction = {
            instructions: [],
            lifetimeConstraint: {
                blockhash: '11111111111111111111111111111111',
                lastValidBlockHeight: 1234n,
            },
            version: 0,
        } as BaseTransactionMessage;
        expect(() => assertIsTransactionMessageWithBlockhashLifetime(transaction)).not.toThrow();
    });
});

describe('setTransactionMessageLifetimeUsingBlockhash', () => {
    let baseTx: BaseTransactionMessage;
    const BLOCKHASH_CONSTRAINT_A = {
        blockhash: 'F7vmkY3DTaxfagttWjQweib42b6ZHADSx94Tw8gHx3W7' as Blockhash,
        lastValidBlockHeight: 123n,
    };
    const BLOCKHASH_CONSTRAINT_B = {
        blockhash: '6bjroqDcZgTv6Vavhqf81oBHTv3aMnX19UTB51YhAZnN' as Blockhash,
        lastValidBlockHeight: 123n,
    };
    beforeEach(() => {
        baseTx = {
            instructions: [],
            version: 0,
        };
    });
    it('sets the lifetime constraint on the transaction to the supplied blockhash lifetime constraint', () => {
        const txWithBlockhashLifetimeConstraint = setTransactionMessageLifetimeUsingBlockhash(
            BLOCKHASH_CONSTRAINT_A,
            baseTx,
        );
        expect(txWithBlockhashLifetimeConstraint).toHaveProperty('lifetimeConstraint', BLOCKHASH_CONSTRAINT_A);
    });
    describe('given a transaction with a blockhash lifetime already set', () => {
        let txWithBlockhashLifetimeConstraint: BaseTransactionMessage & TransactionMessageWithBlockhashLifetime;
        beforeEach(() => {
            txWithBlockhashLifetimeConstraint = {
                ...baseTx,
                lifetimeConstraint: BLOCKHASH_CONSTRAINT_A,
            };
        });
        it('sets the new blockhash lifetime constraint on the transaction when it differs from the existing one', () => {
            const txWithBlockhashLifetimeConstraintB = setTransactionMessageLifetimeUsingBlockhash(
                BLOCKHASH_CONSTRAINT_B,
                txWithBlockhashLifetimeConstraint,
            );
            expect(txWithBlockhashLifetimeConstraintB).toHaveProperty('lifetimeConstraint', BLOCKHASH_CONSTRAINT_B);
        });
        it('returns the original transaction when trying to set the same blockhash lifetime constraint again', () => {
            const txWithSameBlockhashLifetimeConstraint = setTransactionMessageLifetimeUsingBlockhash(
                BLOCKHASH_CONSTRAINT_A,
                txWithBlockhashLifetimeConstraint,
            );
            expect(txWithBlockhashLifetimeConstraint).toBe(txWithSameBlockhashLifetimeConstraint);
        });
    });
    it('freezes the object', () => {
        const txWithBlockhashLifetimeConstraint = setTransactionMessageLifetimeUsingBlockhash(
            BLOCKHASH_CONSTRAINT_A,
            baseTx,
        );
        expect(txWithBlockhashLifetimeConstraint).toBeFrozenObject();
    });
    it('freezes the blockhash constraint', () => {
        const txWithBlockhashLifetimeConstraint = setTransactionMessageLifetimeUsingBlockhash(
            BLOCKHASH_CONSTRAINT_A,
            baseTx,
        );
        expect(txWithBlockhashLifetimeConstraint.lifetimeConstraint).toBeFrozenObject();
    });
});

describe('setTransactionMessageLifetimeUsingProvisoryBlockhash', () => {
    let baseTx: BaseTransactionMessage;
    beforeEach(() => {
        baseTx = { instructions: [], version: 0 };
    });
    it('sets the provisory lifetime constraint on the transaction message', () => {
        const txWithBlockhashLifetimeConstraint = setTransactionMessageLifetimeUsingProvisoryBlockhash(baseTx);
        expect(txWithBlockhashLifetimeConstraint).toHaveProperty(
            'lifetimeConstraint',
            PROVISORY_BLOCKHASH_LIFETIME_CONSTRAINT,
        );
    });
    it('overrides the existing blockhash lifetime constraint with the provisory one', () => {
        const EXISTING_BLOCKHASH_CONSTRAINT = {
            blockhash: 'F7vmkY3DTaxfagttWjQweib42b6ZHADSx94Tw8gHx3W7' as Blockhash,
            lastValidBlockHeight: 123n,
        };
        const txWithBlockhashLifetimeConstraint = { ...baseTx, lifetimeConstraint: EXISTING_BLOCKHASH_CONSTRAINT };
        const updatedTxWithBlockhashLifetimeConstraint = setTransactionMessageLifetimeUsingProvisoryBlockhash(
            txWithBlockhashLifetimeConstraint,
        );
        expect(updatedTxWithBlockhashLifetimeConstraint).toHaveProperty(
            'lifetimeConstraint',
            PROVISORY_BLOCKHASH_LIFETIME_CONSTRAINT,
        );
    });
    it('freezes the object', () => {
        const txWithBlockhashLifetimeConstraint = setTransactionMessageLifetimeUsingProvisoryBlockhash(baseTx);
        expect(txWithBlockhashLifetimeConstraint).toBeFrozenObject();
    });
    it('freezes the blockhash constraint', () => {
        const txWithBlockhashLifetimeConstraint = setTransactionMessageLifetimeUsingProvisoryBlockhash(baseTx);
        expect(txWithBlockhashLifetimeConstraint.lifetimeConstraint).toBeFrozenObject();
    });
});

describe('fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash', () => {
    let baseTx: BaseTransactionMessage;
    beforeEach(() => {
        baseTx = { instructions: [], version: 0 };
    });
    it('sets the provisory lifetime constraint on the transaction message', () => {
        const txWithBlockhashLifetimeConstraint = fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash(baseTx);
        expect(txWithBlockhashLifetimeConstraint).toHaveProperty(
            'lifetimeConstraint',
            PROVISORY_BLOCKHASH_LIFETIME_CONSTRAINT,
        );
    });
    it('does not override the existing blockhash lifetime constraint with the provisory one', () => {
        const EXISTING_BLOCKHASH_CONSTRAINT = {
            blockhash: 'F7vmkY3DTaxfagttWjQweib42b6ZHADSx94Tw8gHx3W7' as Blockhash,
            lastValidBlockHeight: 123n,
        };
        const txWithBlockhashLifetimeConstraint = { ...baseTx, lifetimeConstraint: EXISTING_BLOCKHASH_CONSTRAINT };
        const updatedTxWithBlockhashLifetimeConstraint = fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash(
            txWithBlockhashLifetimeConstraint,
        );
        expect(updatedTxWithBlockhashLifetimeConstraint).toHaveProperty(
            'lifetimeConstraint',
            EXISTING_BLOCKHASH_CONSTRAINT,
        );
    });
    it('freezes the object', () => {
        const txWithBlockhashLifetimeConstraint = fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash(baseTx);
        expect(txWithBlockhashLifetimeConstraint).toBeFrozenObject();
    });
    it('freezes the blockhash constraint', () => {
        const txWithBlockhashLifetimeConstraint = fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash(baseTx);
        expect(txWithBlockhashLifetimeConstraint.lifetimeConstraint).toBeFrozenObject();
    });
});
