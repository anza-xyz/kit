import type * as fs from 'node:fs/promises';
import type * as path from 'node:path';

import { SOLANA_ERROR__FS__UNSUPPORTED_ENVIRONMENT, SolanaError } from '@solana/errors';

function throwUnsupported(operation: string): never {
    throw new SolanaError(SOLANA_ERROR__FS__UNSUPPORTED_ENVIRONMENT, { operation });
}

export const mkdir = ((..._args: Parameters<typeof fs.mkdir>) => throwUnsupported('mkdir')) as typeof fs.mkdir;
export const writeFile = ((..._args: Parameters<typeof fs.writeFile>) =>
    throwUnsupported('writeFile')) as typeof fs.writeFile;
export const dirname = ((..._args: Parameters<typeof path.dirname>) =>
    throwUnsupported('dirname')) as typeof path.dirname;
