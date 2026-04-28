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
 * Tokens with no matching context key are rendered literally; escape a literal `$` with `\\$`.
 *
 * Shared by {@link getHumanReadableErrorMessage} and {@link createCodedErrorClass}.
 *
 * @internal
 */
export function formatMessageTemplate(messageFormatString: string | undefined, context: object = {}): string {
    if (!messageFormatString) {
        return '';
    }
    const template: string = messageFormatString;
    let state: State;
    function commitStateUpTo(endIndex?: number) {
        if (state[TYPE] === StateType.Variable) {
            const variableName = template.slice(state[START_INDEX] + 1, endIndex);

            fragments.push(
                variableName in context
                    ? // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                      `${context[variableName as keyof typeof context]}`
                    : `$${variableName}`,
            );
        } else if (state[TYPE] === StateType.Text) {
            fragments.push(template.slice(state[START_INDEX], endIndex));
        }
    }
    const fragments: string[] = [];
    template.split('').forEach((char, ii) => {
        if (ii === 0) {
            state = {
                [START_INDEX]: 0,
                [TYPE]:
                    template[0] === '\\'
                        ? StateType.EscapeSequence
                        : template[0] === '$'
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
