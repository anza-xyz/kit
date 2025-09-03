import { getPackages } from '@manypkg/get-packages';

export async function getCurrentLinkedVersion() {
    /**
     * Get a list of all the packages, their paths, and their `package.json` files.
     */
    const { packages: allPackages } = await getPackages(import.meta.dirname);
    const packages = allPackages.filter(p => p.relativeDir.startsWith('packages/'));

    /**
     * Compute the version that they all share. Fail unless they all share the same version.
     */
    let version: string | undefined;
    for (const {
        packageJson: { private: isPrivate, version: packageVersion },
    } of packages) {
        if (isPrivate) {
            continue;
        }
        if (!version) {
            version = packageVersion;
        } else if (version !== packageVersion) {
            throw new Error('Expected all versions to be identical');
        }
    }
    if (!version) {
        throw new Error('Found no packages');
    }
    const tag = `v${version}`;
    return {
        packages,
        tag,
        version,
    };
}
