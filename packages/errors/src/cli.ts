import { Command, InvalidArgumentError } from 'commander';

import { version } from '../package.json';
import { SolanaErrorCode } from './codes';
import { decodeEncodedContext } from './context';
import { getHumanReadableErrorMessage } from './message-formatter';
import { SolanaErrorMessages } from './messages';

const program = new Command();

program.name('@solana/errors').description('Decode Solana JavaScript errors thrown in production').version(version);

program
    .command('decode')
    .description('Decode a `SolanaErrorCode` to a human-readable message')
    .argument('<code>', 'numeric error code to decode', rawCode => {
        const code = parseInt(rawCode, 10);
        if (isNaN(code) || `${code}` !== rawCode) {
            throw new InvalidArgumentError('It must be an integer');
        }
        if (!(code in SolanaErrorMessages)) {
            throw new InvalidArgumentError('There exists no error with that code');
        }
        return code;
    })
    .argument('[encodedContext]', 'encoded context to interpolate into the error message', encodedContext => {
        try {
            return decodeEncodedContext(encodedContext);
        } catch {
            throw new InvalidArgumentError('Encoded context malformed');
        }
    })
    .action((code: number, context: object) => {
        const message = getHumanReadableErrorMessage(code as SolanaErrorCode, context);
        console.log(`
${
    Color.bold(
        Color.rgb(154, 71, 255)('[') +
            Color.rgb(144, 108, 244)('D') +
            Color.rgb(134, 135, 233)('e') +
            Color.rgb(122, 158, 221)('c') +
            Color.rgb(110, 178, 209)('o') +
            Color.rgb(95, 195, 196)('d') +
            Color.rgb(79, 212, 181)('e') +
            Color.rgb(57, 227, 166)('d') +
            Color.rgb(19, 241, 149)(']'),
    ) + Color.rgb(19, 241, 149)(' Solana error code #' + code)
}
    - ${message}`);
        if (context) {
            console.log(`
${Color.yellowBright(Color.bold('[Context]'))}
    ${JSON.stringify(context, null, 4).split('\n').join('\n    ')}`);
        }
    });

export function run(argv: readonly string[]) {
    program.parse(argv);
}

/* eslint-disable @typescript-eslint/no-namespace */
namespace SupportsColor {
    type ColorLevel = 0 | 1 | 2 | 3;

    export interface ColorSupport {
        has16m: boolean;    // 24-bit truecolor
        has256: boolean;    // 256 colors
        hasBasic: boolean;  // 16 colors
        level: ColorLevel;
    }

    // Minimal list of CI vendors known to support color
    const KNOWN_COLOR_CIS = new Set([
        'GITHUB_ACTIONS',
        'GITLAB_CI',
        'CIRCLECI',
        'TRAVIS',
        'APPVEYOR',
        'BUILDKITE',
        'DRONE',
    ]);

    function parseForceColor(env: NodeJS.ProcessEnv): ColorLevel | null {
        const fc = env.FORCE_COLOR;
        if (fc === '' || fc === undefined) return null; // not set
        if (fc === 'true') return 1;
        if (fc === 'false' || fc === '0') return 0;
        const n = Number(fc);
        if (Number.isFinite(n)) {
            if (n <= 0) return 0;
            if (n >= 3) return 3;
            return (n as 1 | 2);
        }
        return 1; // any other truthy value
    }

    function termImplies256(term: string | undefined): boolean {
        if (!term) return false;
        const t = term.toLowerCase();
        return t.includes('256color') || t.includes('xterm-256color');
    }

    function termImpliesBasic(term: string | undefined): boolean {
        if (!term) return false;
        const t = term.toLowerCase();
        if (t === 'dumb') return false;
        // Very rough: most real terminals imply at least basic colors
        return /(xterm|vt100|screen|linux|ansi|cygwin|konsole|rxvt)/.test(t);
    }

    function hasTrueColor(colorterm: string | undefined, term: string | undefined): boolean {
        if (!colorterm && !term) return false;
        if (colorterm && /truecolor|24bit/i.test(colorterm)) return true;
        return term ? /(truecolor|24bit)/i.test(term) : false;
    }

    export function detectColorSupport(
        out: NodeJS.WriteStream = process.stdout,
        env: NodeJS.ProcessEnv = process.env
    ): ColorSupport {
        // Explicit global off
        if (env.NO_COLOR) {
            return { has16m: false, has256: false, hasBasic: false, level: 0 };
        }

        // Explicit force
        const forced = parseForceColor(env);
        if (forced !== null) {
            return {
                has16m: forced >= 3,
                has256: forced >= 2,
                hasBasic: forced >= 1,
                level: forced,
            };
        }

        // Must be a TTY to enable colors by default
        if (!out.isTTY) {
            return { has16m: false, has256: false, hasBasic: false, level: 0 };
        }

        const { TERM, COLORTERM, CI } = env;

        // CI: allow at least basic color for known CIs
        if (CI && Object.keys(env).some(k => KNOWN_COLOR_CIS.has(k))) {
            return { has16m: false, has256: false, hasBasic: true, level: 1 };
        }

        // Truecolor?
        if (hasTrueColor(COLORTERM, TERM)) {
            return { has16m: true, has256: true, hasBasic: true, level: 3 };
        }

        // 256 color?
        if (termImplies256(TERM)) {
            return { has16m: false, has256: true, hasBasic: true, level: 2 };
        }

        // Basic color?
        if (termImpliesBasic(TERM)) {
            return { has16m: false, has256: false, hasBasic: true, level: 1 };
        }

        // Fallback: no color
        return { has16m: false, has256: false, hasBasic: false, level: 0 };
    }
}

namespace Color {
    const SGR = {
        bgDefault: '\x1b[49m',
        boldOff: '\x1b[22m',
        boldOn: '\x1b[1m',
        fgDefault: '\x1b[39m',
        reset: '\x1b[0m',
        yellowBright: '\x1b[93m', // bright yellow (basic/16)
    } as const;

    // ---- helpers ----
    const rgb24 = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`;
    const fg256 = (n: number) => `\x1b[38;5;${n}m`;

    // Map RGB -> xterm-256 index (approx.)
    function rgbToAnsi256(r: number, g: number, b: number): number {
        // grayscale from 232..255
        if (r === g && g === b) {
            if (r < 8) return 16;
            if (r > 248) return 231;
            return Math.round(((r - 8) / 247) * 24) + 232;
        }
        const toCube = (v: number) => Math.round((v / 255) * 5);
        const rC = toCube(r), gC = toCube(g), bC = toCube(b);
        return 16 + 36 * rC + 6 * gC + bC;
    }

    // Detect once at import time (like Chalk)
    const SUPPORT = SupportsColor.detectColorSupport();

    // ---- public API ----

    // rgb: 24-bit if level>=3, else 256 if level>=2, else no color
    export const rgb = (r: number, g: number, b: number) => (s: string) => {
        if (SUPPORT.level >= 3) return `${rgb24(r, g, b)}${s}${SGR.fgDefault}`;
        if (SUPPORT.level >= 2) return `${fg256(rgbToAnsi256(r, g, b))}${s}${SGR.fgDefault}`;
        return s;
    };

    // Bright yellow label (basic/16). No-op if no color.
    export const yellowBright = (s: string) =>
        SUPPORT.level >= 1 ? `${SGR.yellowBright}${s}${SGR.fgDefault}` : s;

    export const bold = (s: string) =>
        SUPPORT.level > 0 ? `${SGR.boldOn}${s}${SGR.boldOff}` : s;
}
/* eslint-enable @typescript-eslint/no-namespace */
