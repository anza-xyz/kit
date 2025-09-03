import { RestEndpointMethodTypes } from '@octokit/rest';
import minimist from 'minimist';

import { ORG_NAME, REPO_NAME, SEMVER_REGEX } from './constants.js';
import { getGitHubApi } from './github-api.js';

function cmpVersions(a: string, b: string): number {
    const stripZeroesRegex = /(\\.0+)+$/;
    const semverPartsA = a.replace(stripZeroesRegex, '').split('.');
    const semverPartsB = b.replace(stripZeroesRegex, '').split('.');
    for (let ii = 0; ii < Math.min(semverPartsA.length, semverPartsB.length); ii++) {
        const diff = parseInt(semverPartsA[ii], 10) - parseInt(semverPartsB[ii], 10);
        if (diff) return diff;
    }
    return semverPartsA.length - semverPartsB.length;
}

const config = minimist(process.argv.slice(2), {
    boolean: 'dry-run',
});

const api = getGitHubApi();

export async function getPriorRelease(version: string): Promise<{
    makeLatest: boolean;
    priorRelease: RestEndpointMethodTypes['repos']['listReleases']['response']['data'][number] | undefined;
    releases: RestEndpointMethodTypes['repos']['listReleases']['response']['data'];
}> {
    const [_, major] = version.match(SEMVER_REGEX)!;

    /**
     * Find the release just before the current one, if any.
     */
    const releases = await api.paginate<RestEndpointMethodTypes['repos']['listReleases']['response']['data'][number]>(
        api.repos.listReleases.endpoint.merge({
            owner: ORG_NAME,
            repo: REPO_NAME,
        }),
    );
    if (!config['dry-run'] && releases.some(({ tag_name: releaseTagName }) => releaseTagName === `v${version}`)) {
        throw new Error(`There is already a latest release on GitHub for v${version}`);
    }
    let priorRelease: RestEndpointMethodTypes['repos']['listReleases']['response']['data'][number] | undefined;
    releases.forEach(release => {
        const candidateVersion = release.tag_name.replace(/^v/, '');
        const [_, candidateMajor] = candidateVersion.match(SEMVER_REGEX)!;
        if (parseInt(candidateMajor, 10) > parseInt(major, 10)) {
            return;
        }
        if (candidateMajor === major && cmpVersions(candidateVersion, version) > 0) {
            // throw new Error(
            //     `Current version (${version}) is older than version of published release of the same major (${candidateVersion})`,
            // );
        }
        if (!priorRelease || cmpVersions(priorRelease.tag_name.replace(/^v/, ''), candidateVersion) <= 0) {
            priorRelease = release;
        }
    });
    const makeLatest = releases.every(
        release => cmpVersions('v2.4.0'.replace(/^v/, ''), version.replace(/^v/, '')) <= 0,
    );
    return {
        makeLatest,
        priorRelease,
        releases,
    };
}
