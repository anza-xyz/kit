import { SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN } from '../codes';
import { getHumanReadableErrorMessage } from '../message-formatter';
import * as MessagesModule from '../messages';

jest.mock('../messages', () => ({
    get SolanaErrorMessages() {
        return {};
    },
    __esModule: true,
}));

describe('getHumanReadableErrorMessage', () => {
    it('renders static error messages', () => {
        const messagesSpy = jest.spyOn(MessagesModule, 'SolanaErrorMessages', 'get');
        messagesSpy.mockReturnValue({
            // @ts-expect-error Mock error config doesn't conform to exported config.
            123: 'static error message',
        });
        const message = getHumanReadableErrorMessage(
            // @ts-expect-error Mock error config doesn't conform to exported config.
            123,
        );
        expect(message).toBe('static error message');
    });
    it.each([
        {
            expected: "Something awful happened: 'bar'. How awful!",
            input: "Something $severity happened: '$foo'. How $severity!",
        },
        // Literal backslashes, escaped dollar signs
        {
            expected: 'How \\awful\\ is the $severity?',
            input: 'How \\\\$severity\\\\ is the \\$severity?',
        },
        // Variable at beginning of sequence
        { expected: 'awful times!', input: '$severity times!' },
        // Variable at end of sequence
        { expected: "Isn't it awful?", input: "Isn't it $severity?" },
        // Variable in middle of text sequence
        { expected: '~awful~', input: '~$severity~' },
        // Variable interpolation with no value in the lookup
        { expected: 'Is $thing a sandwich?', input: 'Is $thing a sandwich?' },
        // Variable that has, as a substring, some other value in the lookup
        { expected: '$fool', input: '$fool' },
        // Trick for butting a variable up against regular text
        { expected: 'barl', input: '$foo\\l' },
        // Escaped variable marker
        { expected: "It's the $severity, ya hear?", input: "It's the \\$severity, ya hear?" },
        // Single dollar sign
        { expected: ' $ ', input: ' $ ' },
        // Single dollar sign at start
        { expected: '$ ', input: '$ ' },
        // Single dollar sign at end
        { expected: ' $', input: ' $' },
        // Double dollar sign with legitimate variable name
        { expected: ' $bar ', input: ' $$foo ' },
        // Double dollar sign with legitimate variable name at start
        { expected: '$bar ', input: '$$foo ' },
        // Double dollar sign with legitimate variable name at end
        { expected: ' $bar', input: ' $$foo' },
        // Single escape sequence
        { expected: '  ', input: ' \\ ' },
        // Single escape sequence at start
        { expected: ' ', input: '\\ ' },
        // Single escape sequence at end
        { expected: ' ', input: ' \\' },
        // Double escape sequence
        { expected: ' \\ ', input: ' \\\\ ' },
        // Double escape sequence at start
        { expected: '\\ ', input: '\\\\ ' },
        // Double escape sequence at end
        { expected: ' \\', input: ' \\\\' },
        // Just text
        { expected: 'Some unencumbered text.', input: 'Some unencumbered text.' },
        // Empty string
        { expected: '', input: '' },
    ])('interpolates variables into the error message format string `"$input"`', ({ input, expected }) => {
        const messagesSpy = jest.spyOn(MessagesModule, 'SolanaErrorMessages', 'get');
        messagesSpy.mockReturnValue({
            // @ts-expect-error Mock error config doesn't conform to exported config.
            123: input,
        });
        const message = getHumanReadableErrorMessage(
            // @ts-expect-error Mock error context doesn't conform to exported context.
            123,
            { foo: 'bar', severity: 'awful' },
        );
        expect(message).toBe(expected);
    });
    it('interpolates a Uint8Array variable into a error message format string', () => {
        const messagesSpy = jest.spyOn(MessagesModule, 'SolanaErrorMessages', 'get');
        messagesSpy.mockReturnValue({
            // @ts-expect-error Mock error config doesn't conform to exported config.
            123: 'Here is some data: $data',
        });
        const message = getHumanReadableErrorMessage(
            // @ts-expect-error Mock error context doesn't conform to exported context.
            123,
            { data: new Uint8Array([1, 2, 3, 4]) },
        );
        expect(message).toBe('Here is some data: 1,2,3,4');
    });
    it('interpolates an undefined variable into a error message format string', () => {
        const messagesSpy = jest.spyOn(MessagesModule, 'SolanaErrorMessages', 'get');
        messagesSpy.mockReturnValue({
            // @ts-expect-error Mock error config doesn't conform to exported config.
            123: 'Here is a variable: $variable',
        });
        const message = getHumanReadableErrorMessage(
            // @ts-expect-error Mock error context doesn't conform to exported context.
            123,
            { variable: undefined },
        );
        expect(message).toBe('Here is a variable: undefined');
    });
    it('appends the instruction number to instruction error messages', () => {
        const messagesSpy = jest.spyOn(MessagesModule, 'SolanaErrorMessages', 'get');
        // @ts-expect-error Mock error config doesn't conform to exported config.
        messagesSpy.mockReturnValue({
            [SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN]: 'Some instruction error',
        });
        const message = getHumanReadableErrorMessage(SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN, { index: 0 });
        expect(message).toBe('Some instruction error (instruction #1)');
    });
    it('uses one-based instruction numbering', () => {
        const messagesSpy = jest.spyOn(MessagesModule, 'SolanaErrorMessages', 'get');
        // @ts-expect-error Mock error config doesn't conform to exported config.
        messagesSpy.mockReturnValue({
            [SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN]: 'Some instruction error',
        });
        const message = getHumanReadableErrorMessage(SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN, { index: 5 });
        expect(message).toBe('Some instruction error (instruction #6)');
    });
    it('appends the instruction number to error codes at the end of the instruction error range', () => {
        const lastInstructionErrorCode = SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN + 999;
        const messagesSpy = jest.spyOn(MessagesModule, 'SolanaErrorMessages', 'get');
        // @ts-expect-error Mock error config doesn't conform to exported config.
        messagesSpy.mockReturnValue({
            [lastInstructionErrorCode]: 'Some instruction error',
        });
        const message = getHumanReadableErrorMessage(
            // @ts-expect-error Mock error code doesn't conform to exported config.
            lastInstructionErrorCode,
            { index: 2 },
        );
        expect(message).toBe('Some instruction error (instruction #3)');
    });
    it('does not append the instruction number to non-instruction error messages', () => {
        const messagesSpy = jest.spyOn(MessagesModule, 'SolanaErrorMessages', 'get');
        messagesSpy.mockReturnValue({
            // @ts-expect-error Mock error config doesn't conform to exported config.
            123: 'some other error',
        });
        const message = getHumanReadableErrorMessage(
            // @ts-expect-error Mock error context doesn't conform to exported context.
            123,
            { index: 0 },
        );
        expect(message).toBe('some other error');
    });
});
