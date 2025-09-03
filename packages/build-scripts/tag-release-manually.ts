#!/usr/bin/env -S pnpm dlx tsx --

// @ts-check
import { execSync } from 'node:child_process';

import minimist from 'minimist';

import { getCurrentLinkedVersion } from './current-linked-version.js';

const config = minimist(process.argv.slice(2), {
    boolean: 'dry-run',
    string: ['tag', 'version'],
});

const { packages } = await getCurrentLinkedVersion();

packages
    .filter(pkg => pkg.packageJson.private !== true)
    .forEach(pkg => {
        const command = `pnpm dist-tag add ${pkg.packageJson.name}@${config.version} ${config.tag}`;
        if (config['dry-run']) {
            console.log(`Would have run: \`${command}\``);
        } else {
            execSync(command);
        }
    });
