'use strict';

/**
 * Resilient changelog adapter for Changesets.
 *
 * This delegates all changelog formatting to `@changesets/changelog-github`, so a
 * successful run produces byte-for-byte identical output (PR links + author credit).
 * The only thing it changes is *how* the GitHub data is fetched.
 *
 * Why this exists
 * ---------------
 * `@changesets/changelog-github` resolves PR/commit/author metadata via
 * `@changesets/get-github-info`, which batches every lookup made within a tick into a
 * single GitHub GraphQL query (its DataLoader is created with no `maxBatchSize`).
 * Changesets calls `getReleaseLine` once per (release × changeset), all concurrently,
 * so with a large backlog of changesets that one query grows big enough that GitHub
 * terminates the connection mid-response:
 *
 *     Invalid response body while trying to fetch https://api.github.com/graphql: Premature close
 *
 * Because `get-github-info` aborts the whole `changeset version` run on that error, a
 * transient (or backlog-induced) GitHub blip blocks the entire release pipeline.
 *
 * What this does
 * --------------
 * It wraps `get-github-info`'s `getInfo` / `getInfoFromPullRequest` (the functions
 * `changelog-github` calls) with a layer that:
 *
 *   1. De-duplicates by commit/PR, so each unique ref is fetched at most once
 *      (`get-github-info`'s own DataLoader does not dedupe object keys).
 *   2. Chunks the unique refs into small groups (default 5) dispatched one group at a
 *      time, so each GraphQL query stays comfortably under the size that GitHub drops.
 *   3. Retries a failed chunk once (DataLoader clears keys on a batch rejection, so the
 *      retry genuinely re-fetches), then *degrades* — resolving to a plain commit/PR
 *      link with no author attribution — rather than throwing. A genuine API outage
 *      therefore costs attribution on a few lines instead of blocking the release.
 *
 * The chunk size can be tuned with the `CHANGELOG_CHUNK_SIZE` env var.
 */

const path = require('node:path');

// `@changesets/get-github-info` is a transitive dependency of `changelog-github`, so in
// a pnpm tree it isn't resolvable from this directory directly. Resolve it from
// `changelog-github`'s own location, which also guarantees we patch the *exact* instance
// `changelog-github` calls (rather than a separately-deduped copy).
const changelogGithubPath = require.resolve('@changesets/changelog-github');
const getGithubInfo = require(
  require.resolve('@changesets/get-github-info', { paths: [path.dirname(changelogGithubPath)] }),
);

const CHUNK_SIZE = Math.max(1, Number(process.env.CHANGELOG_CHUNK_SIZE) || 5);
const GITHUB_SERVER_URL = process.env.GITHUB_SERVER_URL || 'https://github.com';

/**
 * Wrap an async `get-github-info` fetcher so calls are de-duplicated by key, dispatched
 * in bounded chunks, retried once on failure, and degraded to a fallback value instead
 * of throwing.
 *
 * @param {Function} fetch - The underlying fetcher (`getInfo` / `getInfoFromPullRequest`).
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

        // First attempt: all refs in the chunk land in one DataLoader batch, i.e. one
        // GraphQL query of at most CHUNK_SIZE refs.
        let settled = await Promise.allSettled(chunk.map(job => fetch(...job.args)));

        // Retry only the failures once. DataLoader clears rejected keys, so this
        // re-fetches; a smaller/retried query usually gets through a transient drop.
        const retryIndexes = settled
          .map((result, i) => (result.status === 'rejected' ? i : -1))
          .filter(i => i !== -1);
        if (retryIndexes.length > 0) {
          const retried = await Promise.allSettled(retryIndexes.map(i => fetch(...chunk[i].args)));
          retryIndexes.forEach((i, k) => {
            settled[i] = retried[k];
          });
        }

        settled.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            chunk[i].resolve(result.value);
          } else {
            console.warn(
              `[changelog] GitHub lookup failed for ${keyOf(chunk[i].args)}; ` +
                `degrading this entry (no author attribution): ${result.reason && result.reason.message}`,
            );
            chunk[i].resolve(fallbackOf(chunk[i].args));
          }
        });
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

// Patch the two entry points that `changelog-github` calls. It accesses them as
// properties on the (singleton, require-cached) module object at call time, so
// reassigning these props transparently reroutes it through the resilient layer.
getGithubInfo.getInfo = makeResilientFetcher(
  getGithubInfo.getInfo,
  ([request]) => `commit ${request.repo}@${request.commit}`,
  ([request]) => ({
    user: null,
    pull: null,
    links: {
      commit: request.commit
        ? `[\`${request.commit.slice(0, 7)}\`](${GITHUB_SERVER_URL}/${request.repo}/commit/${request.commit})`
        : null,
      pull: null,
      user: null,
    },
  }),
);

getGithubInfo.getInfoFromPullRequest = makeResilientFetcher(
  getGithubInfo.getInfoFromPullRequest,
  ([request]) => `pull ${request.repo}#${request.pull}`,
  ([request]) => ({
    user: null,
    commit: null,
    links: {
      commit: null,
      pull: `[#${request.pull}](${GITHUB_SERVER_URL}/${request.repo}/pull/${request.pull})`,
      user: null,
    },
  }),
);

// Require AFTER patching so there's no ambiguity about which `getInfo` is captured
// (it works either way, but this keeps the intent obvious).
const changelogGithub = require(changelogGithubPath).default;

module.exports = {
  getReleaseLine: (...args) => changelogGithub.getReleaseLine(...args),
  getDependencyReleaseLine: (...args) => changelogGithub.getDependencyReleaseLine(...args),
};
