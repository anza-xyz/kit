/**
 * Resilient changelog generator for Changesets.
 *
 * This is a port of `@changesets/changelog-github` (v1.0.1) — a successful run produces
 * byte-for-byte identical output (PR links + author credit). The only thing it changes is
 * *how* the GitHub data is fetched.
 *
 * Why this exists
 * ---------------
 * `@changesets/changelog-github` resolves PR/commit/author metadata via
 * `@changesets/get-github-info`, which batches the lookups made within a tick into GitHub
 * GraphQL queries of up to 50 refs each. Changesets calls `getReleaseLine` once per
 * (release × changeset), all concurrently, so with a backlog of changesets those queries
 * get big enough that GitHub can terminate the connection mid-response:
 *
 *     Invalid response body while trying to fetch https://api.github.com/graphql: Premature close
 *
 * Because `get-github-info` aborts the whole `changeset version` run on that error, a
 * transient (or backlog-induced) GitHub blip blocks the entire release pipeline.
 *
 * Why it is a port rather than a wrapper
 * --------------------------------------
 * An earlier version of this adapter delegated formatting to `changelog-github` and
 * monkey-patched the `get-github-info` exports it called. Since v1, both packages are
 * ESM-only: module namespace objects are frozen and `changelog-github` binds the fetchers
 * via static imports, so there is no seam left to patch. Instead, this module owns the
 * release-line formatting and calls `get-github-info` through the resilient layer below.
 * When bumping `get-github-info`, diff `changelog-github`'s `src/index.ts` for formatting
 * changes worth porting.
 *
 * What the resilient layer does
 * -----------------------------
 * It wraps `getCommitInfo` / `getPullRequestInfo` with a layer that:
 *
 *   1. De-duplicates by commit/PR, so each unique ref is fetched at most once.
 *   2. Chunks the unique refs into small groups (default 5) dispatched one group at a
 *      time, so each GraphQL query stays comfortably under the size that GitHub drops.
 *   3. Retries a failed chunk with exponential backoff (DataLoader clears keys on a batch
 *      rejection, so a retry genuinely re-fetches), then *degrades* — resolving to a plain
 *      commit/PR link with no author attribution — rather than throwing. A genuine API
 *      outage therefore costs attribution on a few lines instead of blocking the release.
 *
 * The chunk size can be tuned with the `CHANGELOG_CHUNK_SIZE` env var.
 */

import { getCommitInfo, getPullRequestInfo } from '@changesets/get-github-info';

const CHUNK_SIZE = Math.max(1, Number(process.env.CHANGELOG_CHUNK_SIZE) || 5);
const GITHUB_SERVER_URL = process.env.GITHUB_SERVER_URL || 'https://github.com';
// Total attempts per ref (1 initial + retries). GitHub's GraphQL API drops connections
// ("Premature close") in short bursts, especially under the CI token's secondary rate
// limit, so we retry with exponential backoff to ride out a multi-second degraded window
// rather than hammering it immediately.
const MAX_ATTEMPTS = Math.max(1, Number(process.env.CHANGELOG_MAX_ATTEMPTS) || 5);
const RETRY_BASE_MS = Math.max(0, Number(process.env.CHANGELOG_RETRY_BASE_MS) || 1000);
// Small gap between chunks to spread requests out and avoid tripping the secondary rate
// limit with a burst of back-to-back queries.
const INTER_CHUNK_MS = Math.max(0, Number(process.env.CHANGELOG_INTER_CHUNK_MS) || 300);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wrap an async `get-github-info` fetcher so calls are de-duplicated by key, dispatched
 * in bounded chunks, retried with exponential backoff on failure, and degraded to a
 * fallback value instead of throwing.
 *
 * @param {Function} fetch - The underlying fetcher (`getCommitInfo` / `getPullRequestInfo`).
 * @param {(args: unknown[]) => string} keyOf - Stable cache/dedupe key for a call.
 * @param {(args: unknown[]) => unknown} fallbackOf - Degraded result when the fetch fails.
 * @returns {(...args: unknown[]) => Promise<unknown>}
 */
function makeResilientFetcher(fetch, keyOf, fallbackOf) {
    /** @type {Map<string, Promise<unknown>>} */
    const cache = new Map();
    /** @type {{ args: unknown[]; resolve: (v: unknown) => void }[]} */
    let queue = [];
    let draining = false;

    async function drain() {
        if (draining) return;
        draining = true;
        try {
            while (queue.length > 0) {
                const chunk = queue.splice(0, CHUNK_SIZE);

                // Track which jobs still need a result; refetch only those each attempt. All
                // refs in an attempt land in one DataLoader batch (one GraphQL query of at most
                // CHUNK_SIZE refs); on a batch rejection DataLoader clears the keys, so the next
                // attempt genuinely re-fetches.
                let pending = chunk.map((job, i) => ({ i, job }));
                const settled = new Array(chunk.length);
                const lastError = new Array(chunk.length);

                for (let attempt = 1; attempt <= MAX_ATTEMPTS && pending.length > 0; attempt++) {
                    if (attempt > 1) {
                        // Exponential backoff with jitter before retrying the still-failing refs.
                        const backoff = RETRY_BASE_MS * 2 ** (attempt - 2);
                        await sleep(backoff + Math.floor(Math.random() * 250));
                    }
                    const results = await Promise.allSettled(pending.map(p => fetch(...p.job.args)));
                    const next = [];
                    results.forEach((result, k) => {
                        if (result.status === 'fulfilled') {
                            settled[pending[k].i] = result.value;
                        } else {
                            // Keep the most recent failure reason so a degraded entry is diagnosable.
                            lastError[pending[k].i] = result.reason;
                            next.push(pending[k]);
                        }
                    });
                    pending = next;
                }

                chunk.forEach((job, i) => {
                    if (i in settled) {
                        job.resolve(settled[i]);
                    } else {
                        const error = lastError[i];
                        // `get-github-info` wraps network failures, so the useful detail
                        // ("Premature close", ECONNRESET, ...) lives on `cause`.
                        const reason =
                            [error?.message, error?.cause?.message].filter(Boolean).join(': ') ||
                            error ||
                            'unknown error';
                        console.warn(
                            `[changelog] GitHub lookup failed for ${keyOf(job.args)} after ${MAX_ATTEMPTS} ` +
                                `attempts; degrading this entry (no author attribution). Last error: ${reason}`,
                        );
                        job.resolve(fallbackOf(job.args));
                    }
                });

                if (queue.length > 0) await sleep(INTER_CHUNK_MS);
            }
        } finally {
            draining = false;
        }
    }

    return (...args) => {
        const key = keyOf(args);
        const existing = cache.get(key);
        if (existing) return existing;

        const promise = new Promise(resolve => {
            queue.push({ args, resolve });
        });
        cache.set(key, promise);
        // Defer draining to a microtask so all calls made in the current tick queue up
        // first and get packed into full chunks.
        Promise.resolve().then(() => {
            drain().catch(() => {});
        });
        return promise;
    };
}

const resilientGetCommitInfo = makeResilientFetcher(
    getCommitInfo,
    ([request]) => `commit ${request.repo}@${request.commit}`,
    ([request]) => {
        const url = `${GITHUB_SERVER_URL}/${request.repo}/commit/${request.commit}`;
        return { commit: { markdownLink: `[\`${request.commit.slice(0, 7)}\`](${url})`, sha: request.commit, url } };
    },
);

const resilientGetPullRequestInfo = makeResilientFetcher(
    getPullRequestInfo,
    ([request]) => `pull ${request.repo}#${request.pull}`,
    ([request]) => {
        const url = `${GITHUB_SERVER_URL}/${request.repo}/pull/${request.pull}`;
        return { pull: { markdownLink: `[#${request.pull}](${url})`, number: request.pull, url } };
    },
);

// Everything below is ported from `@changesets/changelog-github` v1.0.1, with the fetchers
// swapped for the resilient ones above. The `template` and `disableThanks` options are not
// ported since this repo doesn't use them, and `GITHUB_SERVER_URL` is read from the
// environment only (no `.env` file fallback).

const ISSUE_REF_REGEX = /\[.*?\]\(.*?\)|\B#([1-9]\d*)\b/g;

function linkifyIssueRefs(line, repo) {
    return line.replace(ISSUE_REF_REGEX, (match, issue) =>
        issue ? `[#${issue}](${GITHUB_SERVER_URL}/${repo}/issues/${issue})` : match,
    );
}

function getRepo(options) {
    const repo = options?.repo;
    if (typeof repo !== 'string' || !repo) {
        throw new Error(
            'Please provide a repo to this changelog generator like this:\n' +
                '"changelog": ["./changelog.mjs", { "repo": "org/repo" }]',
        );
    }
    return repo;
}

/** @type {import('@changesets/types').ChangelogFunctions['getDependencyReleaseLine']} */
async function getDependencyReleaseLine(changesets, dependenciesUpdated, options) {
    const repo = getRepo(options);
    if (dependenciesUpdated.length === 0) return '';
    const commitLinks = await Promise.all(
        changesets.map(async cs => {
            if (cs.commit) {
                const info = await resilientGetCommitInfo({ commit: cs.commit, repo });
                return info?.commit.markdownLink ?? `\`${cs.commit.slice(0, 7)}\``;
            }
        }),
    );
    return [
        `- Updated dependencies [${commitLinks.filter(_ => _).join(', ')}]:`,
        ...dependenciesUpdated.map(dependency => `  - ${dependency.name}@${dependency.newVersion}`),
    ].join('\n');
}

/** @type {import('@changesets/types').ChangelogFunctions['getReleaseLine']} */
async function getReleaseLine(changeset, _type, options) {
    const repo = getRepo(options);
    let prFromSummary;
    let commitFromSummary;
    const usersFromSummary = [];

    const [firstLine, ...futureLines] = changeset.summary
        .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
            const num = Number(pr);
            if (!isNaN(num)) prFromSummary = num;
            return '';
        })
        .replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
            commitFromSummary = commit;
            return '';
        })
        .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, (_, user) => {
            usersFromSummary.push(user);
            return '';
        })
        .trim()
        .split('\n')
        .map(l => l.trimEnd());

    const links = { commit: undefined, pull: undefined, user: undefined };
    if (prFromSummary != null) {
        const info = await resilientGetPullRequestInfo({ pull: prFromSummary, repo });
        links.commit = info?.commit?.markdownLink;
        links.pull = info?.pull.markdownLink;
        links.user = info?.author?.markdownLink;
        if (commitFromSummary) {
            const url = `${GITHUB_SERVER_URL}/${repo}/commit/${commitFromSummary}`;
            links.commit = `[\`${commitFromSummary.slice(0, 7)}\`](${url})`;
        }
    } else if (commitFromSummary || changeset.commit) {
        const info = await resilientGetCommitInfo({ commit: commitFromSummary || changeset.commit, repo });
        links.commit = info?.commit.markdownLink;
        links.pull = info?.pull?.markdownLink;
        links.user = info?.author?.markdownLink;
    }

    const users = usersFromSummary.length
        ? usersFromSummary.map(user => `[@${user}](${GITHUB_SERVER_URL}/${user})`).join(', ')
        : links.user;

    const summaryLinked = linkifyIssueRefs(firstLine, repo);
    const continuation = futureLines.map(l => `  ${linkifyIssueRefs(l, repo)}`).join('\n');

    const prefix = [
        links.pull == null ? '' : ` ${links.pull}`,
        links.commit == null ? '' : ` ${links.commit}`,
        users == null ? '' : ` Thanks ${users}!`,
    ].join('');

    return `\n\n-${prefix ? `${prefix} -` : ''} ${summaryLinked}\n${continuation}`;
}

export default { getDependencyReleaseLine, getReleaseLine };
