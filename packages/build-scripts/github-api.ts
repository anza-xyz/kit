import { Octokit } from '@octokit/rest';
import minimist from 'minimist';

const config = minimist(process.argv.slice(2), {
    string: 'token',
});

const GITHUB_TOKEN = config.token ?? process.env.GH_TOKEN;
if (typeof GITHUB_TOKEN !== 'string') {
    console.error(
        'The required --token argument was not provided. Please use it to supply a GitHub token with write permissions',
    );
    process.exit(1);
}

let api: Octokit;
export function getGitHubApi(): Octokit {
    if (!api) {
        api = new Octokit({
            auth: GITHUB_TOKEN,
        });
    }
    return api;
}
