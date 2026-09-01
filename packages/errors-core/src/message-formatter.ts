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
 * Shared by {@link createCodedErrorClass} and any downstream tooling that wants to render the
 * same template syntax outside of a thrown error.
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
