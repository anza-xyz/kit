import { SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN, SolanaErrorCode } from './codes';
import { SolanaErrorMessages } from './messages';

const INSTRUCTION_ERROR_RANGE_SIZE = 1000;

const enum StateType {
    EscapeSequence,
    Text,
    Variable,
}
type State = Readonly<{
    [START_INDEX]: number;
    [TYPE]: StateType;
}>;
const START_INDEX = 'i';
const TYPE = 't';

/**
 * Interpolates `$variable` tokens in a message template with values from a context object.
 *
 * Tokens that do not have a matching key in the context are rendered literally (e.g. `$foo` stays
 * `$foo`). Use a backslash to escape a `$` that should not be treated as a variable (e.g. `\$foo`).
 *
 * This is the low-level formatter shared by {@link getHumanReadableErrorMessage} (which layers on
 * the {@link SolanaErrorMessages} lookup and the instruction-error-index suffix) and by
 * {@link createCodedErrorClass} (which layers on a consumer-provided message map).
 *
 * @param messageFormatString The message template containing `$variable` tokens.
 * @param context             An object whose keys correspond to the variables in the template.
 */
export function formatMessageTemplate(messageFormatString: string, context: object = {}): string {
    if (messageFormatString.length === 0) {
        return '';
    }
    let state: State;
    function commitStateUpTo(endIndex?: number) {
        if (state[TYPE] === StateType.Variable) {
            const variableName = messageFormatString.slice(state[START_INDEX] + 1, endIndex);

            fragments.push(
                variableName in context
                    ? // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                      `${context[variableName as keyof typeof context]}`
                    : `$${variableName}`,
            );
        } else if (state[TYPE] === StateType.Text) {
            fragments.push(messageFormatString.slice(state[START_INDEX], endIndex));
        }
    }
    const fragments: string[] = [];
    messageFormatString.split('').forEach((char, ii) => {
        if (ii === 0) {
            state = {
                [START_INDEX]: 0,
                [TYPE]:
                    messageFormatString[0] === '\\'
                        ? StateType.EscapeSequence
                        : messageFormatString[0] === '$'
                          ? StateType.Variable
                          : StateType.Text,
            };
            return;
        }
        let nextState;
        switch (state[TYPE]) {
            case StateType.EscapeSequence:
                nextState = { [START_INDEX]: ii, [TYPE]: StateType.Text };
                break;
            case StateType.Text:
                if (char === '\\') {
                    nextState = { [START_INDEX]: ii, [TYPE]: StateType.EscapeSequence };
                } else if (char === '$') {
                    nextState = { [START_INDEX]: ii, [TYPE]: StateType.Variable };
                }
                break;
            case StateType.Variable:
                if (char === '\\') {
                    nextState = { [START_INDEX]: ii, [TYPE]: StateType.EscapeSequence };
                } else if (char === '$') {
                    nextState = { [START_INDEX]: ii, [TYPE]: StateType.Variable };
                } else if (!char.match(/\w/)) {
                    nextState = { [START_INDEX]: ii, [TYPE]: StateType.Text };
                }
                break;
        }
        if (nextState) {
            if (state !== nextState) {
                commitStateUpTo(ii);
            }
            state = nextState;
        }
    });
    commitStateUpTo();
    return fragments.join('');
}

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
