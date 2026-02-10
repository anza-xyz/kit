import '@solana/test-matchers/toBeFrozenObject';

import type { InstructionPlan } from '@solana/instruction-plans';
import type { Instruction } from '@solana/instructions';
import type { ClientWithTransactionPlanning, ClientWithTransactionSending } from '@solana/plugin-interfaces';

import { addSelfPlanAndSendFunctions } from '../self-plan-and-send-functions';

const mockInstruction: Instruction = {
    programAddress: '11111111111111111111111111111111' as Instruction['programAddress'],
};

const mockInstructionPlan: InstructionPlan = {
    instruction: mockInstruction,
    kind: 'single',
    planType: 'instructionPlan',
};

function createMockClient() {
    return {
        planTransaction: jest.fn().mockResolvedValue({ message: 'planned' }),
        planTransactions: jest.fn().mockResolvedValue({ plan: 'transactions' }),
        sendTransaction: jest.fn().mockResolvedValue({ result: 'sent' }),
        sendTransactions: jest.fn().mockResolvedValue({ results: 'sent-all' }),
    } as unknown as ClientWithTransactionPlanning & ClientWithTransactionSending;
}

describe('addSelfPlanAndSendFunctions', () => {
    describe('with synchronous inputs', () => {
        it('adds planTransaction method that delegates to the client', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const result = addSelfPlanAndSendFunctions(client, mockInstruction);
            const config = { abortSignal: new AbortController().signal };
            await result.planTransaction(config);

            expect(client.planTransaction).toHaveBeenCalledWith(mockInstruction, config);
        });

        it('adds planTransactions method that delegates to the client', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const result = addSelfPlanAndSendFunctions(client, mockInstruction);
            const config = { abortSignal: new AbortController().signal };
            await result.planTransactions(config);

            expect(client.planTransactions).toHaveBeenCalledWith(mockInstruction, config);
        });

        it('adds sendTransaction method that delegates to the client', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const result = addSelfPlanAndSendFunctions(client, mockInstruction);
            const config = { abortSignal: new AbortController().signal };
            await result.sendTransaction(config);

            expect(client.sendTransaction).toHaveBeenCalledWith(mockInstruction, config);
        });

        it('adds sendTransactions method that delegates to the client', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const result = addSelfPlanAndSendFunctions(client, mockInstruction);
            const config = { abortSignal: new AbortController().signal };
            await result.sendTransactions(config);

            expect(client.sendTransactions).toHaveBeenCalledWith(mockInstruction, config);
        });

        it('works with instruction plans', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const result = addSelfPlanAndSendFunctions(client, mockInstructionPlan);
            await result.sendTransaction();

            expect(client.sendTransaction).toHaveBeenCalledWith(mockInstructionPlan, undefined);
        });

        it('preserves the original instruction properties', () => {
            const client = createMockClient();
            const result = addSelfPlanAndSendFunctions(client, { ...mockInstruction, custom: 42 });

            expect(result.custom).toBe(42);
        });

        it('preserves the original instruction plan properties', () => {
            const client = createMockClient();
            const result = addSelfPlanAndSendFunctions(client, { ...mockInstructionPlan, custom: 42 });

            expect(result.custom).toBe(42);
        });

        it('returns a frozen object', () => {
            const client = createMockClient();
            const result = addSelfPlanAndSendFunctions(client, mockInstruction);

            expect(result).toBeFrozenObject();
        });
    });

    describe('with promise-like inputs', () => {
        it('adds planTransaction method that awaits the input before delegating', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const instructionPromise = Promise.resolve(mockInstruction);
            const result = addSelfPlanAndSendFunctions(client, instructionPromise);
            const config = { abortSignal: new AbortController().signal };
            await result.planTransaction(config);

            expect(client.planTransaction).toHaveBeenCalledWith(mockInstruction, config);
        });

        it('adds planTransactions method that awaits the input before delegating', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const instructionPromise = Promise.resolve(mockInstruction);
            const result = addSelfPlanAndSendFunctions(client, instructionPromise);
            const config = { abortSignal: new AbortController().signal };
            await result.planTransactions(config);

            expect(client.planTransactions).toHaveBeenCalledWith(mockInstruction, config);
        });

        it('adds sendTransaction method that awaits the input before delegating', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const instructionPromise = Promise.resolve(mockInstruction);
            const result = addSelfPlanAndSendFunctions(client, instructionPromise);
            const config = { abortSignal: new AbortController().signal };
            await result.sendTransaction(config);

            expect(client.sendTransaction).toHaveBeenCalledWith(mockInstruction, config);
        });

        it('adds sendTransactions method that awaits the input before delegating', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const instructionPromise = Promise.resolve(mockInstruction);
            const result = addSelfPlanAndSendFunctions(client, instructionPromise);
            const config = { abortSignal: new AbortController().signal };
            await result.sendTransactions(config);

            expect(client.sendTransactions).toHaveBeenCalledWith(mockInstruction, config);
        });

        it('works with promise-like instruction plans', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const planPromise = Promise.resolve(mockInstructionPlan);
            const result = addSelfPlanAndSendFunctions(client, planPromise);
            await result.sendTransaction();

            expect(client.sendTransaction).toHaveBeenCalledWith(mockInstructionPlan, undefined);
        });

        it('preserves the original promise', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const instructionPromise = Promise.resolve(mockInstruction);
            const result = addSelfPlanAndSendFunctions(client, instructionPromise);
            const resolved = await result;

            expect(resolved).toBe(mockInstruction);
        });

        it('works with custom promise-like objects', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const customPromiseLike: PromiseLike<Instruction> = {
                then(onFulfilled) {
                    return Promise.resolve(mockInstruction).then(onFulfilled);
                },
            };
            const result = addSelfPlanAndSendFunctions(client, customPromiseLike);
            await result.sendTransaction();

            expect(client.sendTransaction).toHaveBeenCalledWith(mockInstruction, undefined);
        });

        it('preserves the original instruction properties', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const instructionPromise = Promise.resolve({ ...mockInstruction, custom: 42 });
            const result = addSelfPlanAndSendFunctions(client, instructionPromise);
            const resolved = await result;

            expect(resolved.custom).toBe(42);
        });

        it('preserves the original instruction plan properties', async () => {
            expect.assertions(1);
            const client = createMockClient();
            const instructionPlanPromise = Promise.resolve({ ...mockInstructionPlan, custom: 42 });
            const result = addSelfPlanAndSendFunctions(client, instructionPlanPromise);
            const resolved = await result;

            expect(resolved.custom).toBe(42);
        });

        it('does not freeze promises', () => {
            const client = createMockClient();
            const instructionPromise = Promise.resolve({ ...mockInstruction, custom: 42 });
            const result = addSelfPlanAndSendFunctions(client, instructionPromise);

            expect(result).not.toBeFrozenObject();
        });
    });
});
