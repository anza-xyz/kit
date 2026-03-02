import { BaseCompiledTransactionMessage } from '../message-types';

type ConfigValue =
    | {
          kind: 'u32';
          value: number;
      }
    | {
          kind: 'u64';
          value: bigint;
      };

type InstructionHeader = {
    numInstructionAccounts: number;
    numInstructionDataBytes: number;
    programAccountIndex: number;
};

type InstructionPayload = {
    instructionAccountIndices: number[];
    instructionData: Uint8Array;
};

export type V1CompiledTransactionMessage = BaseCompiledTransactionMessage &
    Readonly<{
        /** A mask indicating which transaction config values are present */
        configMask: number;
        /** The configuration values for the transaction */
        configValues: ConfigValue[];
        /** The headers for each instruction in the transaction */
        instructionHeaders: InstructionHeader[];
        /** The payload for each instruction in the transaction */
        instructionPayloads: InstructionPayload[];
        /** The number of instructions in the transaction */
        numInstructions: number;
        /** The number of static accounts in the transaction */
        numStaticAccounts: number;
        version: 1;
    }>;
