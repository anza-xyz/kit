import { formatMessageTemplate } from '@solana/errors-core';

import { SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN, SolanaErrorCode } from './codes';
import { SolanaErrorMessages } from './messages';

const INSTRUCTION_ERROR_RANGE_SIZE = 1000;

export function getHumanReadableErrorMessage<TErrorCode extends SolanaErrorCode>(
    code: TErrorCode,
    context: object = {},
): string {
    let message = formatMessageTemplate(SolanaErrorMessages[code], context);
    if (
        code >= SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN &&
        code < SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN + INSTRUCTION_ERROR_RANGE_SIZE &&
        'index' in context
    ) {
        message += ` (instruction #${(context as { index: number }).index + 1})`;
    }
    return message;
}
