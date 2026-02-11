import { createRequire } from 'node:module';
import path from 'node:path';

const kitPackageFolder = path.resolve(__dirname, '../../');
const requireFromKit = createRequire(path.join(kitPackageFolder, 'package.json'));

describe('@solana/kit program-client-core subpath export', () => {
    it('resolves `@solana/kit/program-client-core` to its dedicated dist entrypoint', () => {
        const resolvedSubpathExport = requireFromKit.resolve('@solana/kit/program-client-core');
        expect(resolvedSubpathExport).toBe(path.join(kitPackageFolder, 'dist', 'program-client-core.node.cjs'));
    });

    it('keeps root and subpath exports distinct', () => {
        const resolvedRootExport = requireFromKit.resolve('@solana/kit');
        const resolvedSubpathExport = requireFromKit.resolve('@solana/kit/program-client-core');

        expect(resolvedRootExport).toBe(path.join(kitPackageFolder, 'dist', 'index.node.cjs'));
        expect(resolvedRootExport).not.toBe(resolvedSubpathExport);
    });
});
