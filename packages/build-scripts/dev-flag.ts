import { BunPlugin } from 'bun';
import jscodeshift from 'jscodeshift';

function replaceDev(source: string): string {
    if (/__DEV__/.test(source) !== true) {
        return source;
    }
    const j = jscodeshift.withParser('tsx');
    const root = j(source);
    root.find(j.Identifier, { name: '__DEV__' }).replaceWith(() =>
        j.binaryExpression(
            '!==',
            j.memberExpression(
                j.memberExpression(j.identifier('process'), j.identifier('env')),
                // See https://github.com/oven-sh/bun/issues/20183
                j.identifier('NODE_ENV_BUN_BUG_20183'),
            ),
            j.stringLiteral('production'),
        ),
    );
    return root.toSource();
}

export const DevFlagPlugin: BunPlugin = {
    name: 'dev-flag-plugin',
    setup(build) {
        build.onLoad({ filter: /\.tsx?$/ }, async args => {
            const contents = await Bun.file(args.path).text();
            return {
                contents: replaceDev(contents),
            };
        });
    },
};
