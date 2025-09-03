#!/usr/bin/env -S pnpm dlx tsx --

// @ts-check
import { execSync } from 'node:child_process';

import minimist from 'minimist';

import { getCurrentLinkedVersion } from './current-linked-version.js';
import { getPriorRelease } from './prior-release.js';

const config = minimist(process.argv.slice(2), {
    boolean: 'dry-run',
});

const { version } = await getCurrentLinkedVersion();

const { makeLatest } = await getPriorRelease(version);

const command = `pnpm dist-tag add ${config._[0]} latest`;

if (config['dry-run']) {
    console.log(
        makeLatest
            ? `Would have tagged this as the latest release with: \`${command}\``
            : 'Would not have tagged this as the latest release',
    );
} else {
    execSync(command);
}
