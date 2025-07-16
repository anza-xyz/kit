#!/usr/bin/env -S pnpm dlx tsx --
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { getPackages } from '@manypkg/get-packages';
import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import minimist from 'minimist';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { execSync } from 'node:child_process';

type Level = string;
type PackageName = string;
type ReleaseNotesTextContent = string;

const ORG_NAME = 'anza-xyz';
const REPO_NAME = 'kit';

function isDefined<T>(value: T | null | undefined): value is NonNullable<T> {
    return value !== null && value !== undefined;
}

const config = minimist(process.argv.slice(2), {
    boolean: 'dry-run',
    string: 'token',
});
const GITHUB_TOKEN = config.token ?? process.env.GH_TOKEN;
if (typeof GITHUB_TOKEN !== 'string') {
    console.error(
        'The required --token argument was not provided. Please use it to supply a GitHub token with write permissions',
    );
    process.exit(1);
}

const api = new Octokit({
    auth: GITHUB_TOKEN,
});

const [
    packages,
    {
        data: { tag_name: priorReleaseVersion },
    },
] = await Promise.all([
    /**
     * Get a list of all the packages, their paths, and their `package.json` files.
     */
    (async () => {
        const { packages } = await getPackages(import.meta.dirname);
        return packages.filter(p => p.relativeDir.startsWith('packages/'));
    })(),
    /**
     * Get the version of the prior release
     */
    api.repos.getLatestRelease({ owner: ORG_NAME, repo: REPO_NAME }),
]);

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
if (!config['dry-run'] && tag === priorReleaseVersion) {
    throw new Error(`There is already a latest release on GitHub for ${tag}`);
}

/**
 * Read in all of their changelogs and grab the entries related to that version.
 */
type Token = ReturnType<typeof markdown.parse>['children'][number];
const markdown = unified().use(remarkParse).use(remarkStringify);
const releaseNotesByPackage = Object.fromEntries(
    /**
     * Load all of the changelog Markdown source text
     */
    (
        await Promise.all(
            packages.map(async p => {
                try {
                    return [
                        p.packageJson.name,
                        await readFile(join(p.dir, 'CHANGELOG.md'), {
                            encoding: 'utf-8',
                        }),
                    ] as const;
                } catch (e) {
                    if (e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT') {
                        return;
                    }
                    throw e;
                }
            }),
        )
    )
        .filter(isDefined)
        /**
         * Parse the Markdown source to an AST
         */
        .map(([packageName, markdownSource]) => [packageName, markdown.parse(markdownSource)] as const)
        /**
         * Extract the section of the changelog that matches the current version.
         */
        .map(([packageName, rootContent]) => {
            const tokensByVersionBumpLevel: Record<string, Token[]> = {};
            let currentTokensByVersionBumpLevel: Token[] = [];
            let state: 'collecting' | 'scanning' = 'scanning';
            for (const token of rootContent.children) {
                if (state === 'collecting') {
                    if (token.type === 'heading' && token.depth == 2) {
                        break;
                    }
                } else if (
                    token.type === 'heading' &&
                    token.depth == 2 &&
                    token.children.length === 1 &&
                    token.children[0].type === 'text' &&
                    token.children[0].value === version
                ) {
                    state = 'collecting';
                }
                if (state === 'collecting') {
                    if (
                        token.type === 'heading' &&
                        token.depth == 3 &&
                        token.children.length === 1 &&
                        token.children[0].type === 'text' &&
                        token.children[0].value.endsWith('Changes')
                    ) {
                        currentTokensByVersionBumpLevel = [];
                        const match = token.children[0].value.match(/(\w+) Changes$/);
                        if (!match) {
                            throw new Error(
                                'Expected third-level headings to be of the form ' +
                                    '"{Patch|Minor|Major} Changes". ' +
                                    '`create-github-releases.ts` needs to be updated to ' +
                                    'handle whatever the new format is.',
                            );
                        }
                        const [_, level] = match;
                        tokensByVersionBumpLevel[level] = currentTokensByVersionBumpLevel;
                    } else if (token.type === 'list') {
                        currentTokensByVersionBumpLevel.push(
                            ...token.children
                                // Filter out any list item that is just a report of which
                                // package dependencies were updated.
                                .filter(
                                    t =>
                                        !(
                                            t.children[0].type === 'paragraph' &&
                                            t.children[0].children[0].type === 'text' &&
                                            t.children[0].children[0].value.startsWith('Updated dependencies')
                                        ),
                                ),
                        );
                    }
                }
            }
            Object.keys(tokensByVersionBumpLevel).forEach(level => {
                if (tokensByVersionBumpLevel[level].length === 0) {
                    delete tokensByVersionBumpLevel[level];
                }
            });
            if (Object.keys(tokensByVersionBumpLevel).length === 0) {
                return;
            }
            return [packageName, tokensByVersionBumpLevel] as const;
        })
        .filter(isDefined),
);

/**
 * Convert from:
 *     PACKAGE_NAME -> LEVEL -> RELEASE_NOTE_AST[]
 * ...to:
 *     LEVEL -> RELEASE_NOTE_TEXT -> PACKAGE_NAME[]
 */
const releaseNotesByLevel: Record<Level, Record<ReleaseNotesTextContent, PackageName[]>> = {};
for (const [packageName, notesRecord] of Object.entries(releaseNotesByPackage)) {
    Object.keys(notesRecord).forEach(level => {
        const notes = (releaseNotesByLevel[level] ||= {});
        notesRecord[level].forEach(note => {
            const releaseNotesText = markdown.stringify({ children: [note], type: 'root' });
            notes[releaseNotesText] ||= [];
            notes[releaseNotesText].push(packageName);
        });
    });
}

/**
 * Format an aggregate release note
 */
const releaseDate = new Date();
const releaseDateString =
    releaseDate.getFullYear() +
    '-' +
    String(releaseDate.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(releaseDate.getDate()).padStart(2, '0');
const aggregateReleaseNotes =
    `# @solana/${REPO_NAME}\n\n` +
    `## [${tag}](https://github.com/${ORG_NAME}/${REPO_NAME}/compare/${priorReleaseVersion}...${tag}) (${releaseDateString})\n\n` +
    Object.keys(releaseNotesByLevel)
        .toSorted((a, b) =>
            a === b ? 0 : a === 'Major' ? -1 : b === 'Major' ? 1 : a === 'Minor' ? -1 : b === 'Minor' ? 1 : 0,
        )
        .flatMap(level => {
            return [
                `### ${level} Changes\n\n`,
                ...Object.keys(releaseNotesByLevel[level]).map(
                    listItem =>
                        listItem.replace(/^\* /, '* [`' + releaseNotesByLevel[level][listItem].join('`, `') + '`] ') +
                        '\n',
                ),
            ];
        })
        .join('');

/**
 * Create the release on GitHub
 */
const createReleaseParams: RestEndpointMethodTypes['repos']['createRelease']['parameters'] = {
    body: aggregateReleaseNotes,
    make_latest: 'true',
    name: tag,
    owner: ORG_NAME,
    repo: REPO_NAME,
    tag_name: tag,
    // Supplying this implies that GitHub will *create* the tag specified by `tag_name`
    target_commitish: execSync('git rev-parse HEAD').toString().trim(),
};
if (config['dry-run']) {
    console.log(createReleaseParams);
} else {
    await api.rest.repos.createRelease();
}
