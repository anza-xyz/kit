import { join } from 'node:path';

import Bun, { BuildArtifact, BuildConfig } from 'bun';

export async function writeArtifact(outdir: string, artifact: BuildArtifact) {
    await Promise.all(
        [writeFile(outdir, artifact), artifact.sourcemap ? writeFile(outdir, artifact.sourcemap) : null].filter(
            Boolean,
        ),
    );
}

async function writeFile(outdir: string, artifact: BuildArtifact) {
    const file = Bun.file(join(outdir, artifact.path));
    const text = await artifact.text();

    await Bun.write(
        file,
        // See https://github.com/oven-sh/bun/issues/20183
        text.replace('NODE_ENV_BUN_BUG_20183', 'NODE_ENV/*UN_BUG_201*/'),
    );
}

export async function buildPatchingBunBug20183(config: BuildConfig) {
    const outdir = config.outdir ?? './';
    const output = await Bun.build({
        ...config,
        outdir: undefined,
    });
    await Promise.all(output.outputs.map(artifact => writeArtifact(outdir, artifact)));
}
