import { BuildConfig } from 'bun';

export default (['browser', 'node'] as const).flatMap<BuildConfig>(platform =>
    (['cjs', 'esm'] as const).map(format => ({
        entrypoints: [`./src/index.${platform}.ts`],
        format,
        naming: (function () {
            const extension = format === 'esm' ? 'mjs' : format;
            return `[name].${extension}`;
        })(),
        outdir: './dist',
        platform,
        sourcemap: 'linked',
        target: platform,
    })),
);
