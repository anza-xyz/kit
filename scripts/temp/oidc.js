const registry = 'https://registry.npmjs.org'; // guessing from comment

// Copied from https://github.com/npm/cli/pull/8336/files
async function main() {
    console.log({
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
            ? process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN.length
            : undefined,
        ACTIONS_ID_TOKEN_REQUEST_URL: process.env.ACTIONS_ID_TOKEN_REQUEST_URL
            ? process.env.ACTIONS_ID_TOKEN_REQUEST_URL.length
            : undefined,
    });

    if (!(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)) {
        console.error('oidc', 'Skipped because incorrect permissions for id-token within GitHub workflow');
        throw new Error('Incorrect permissions for id-token within GitHub workflow');
    }

    /**
     * The specification for an audience is `npm:registry.npmjs.org`,
     * where "registry.npmjs.org" can be any supported registry.
     */
    const audience = `npm:${new URL(registry).hostname}`;
    const url = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
    url.searchParams.append('audience', audience);
    const startTime = Date.now();
    const response = await fetch(url.href, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`,
        },
    });

    const elapsedTime = Date.now() - startTime;

    console.log('fetch', `GET ${url.href} ${response.status} ${elapsedTime}ms`);

    const json = await response.json();

    if (!response.ok) {
        console.log('oidc', `Failed to fetch id_token from GitHub: received an invalid response`);
        return undefined;
    }

    if (!json.value) {
        console.log('oidc', `Failed to fetch id_token from GitHub: missing value`);
        return undefined;
    }

    const idToken = json.value;
    console.log('got a token!', idToken.length);
}

main()
    .then(() => {
        console.log('OIDC token fetched successfully');
    })
    .catch(err => {
        console.error('Error fetching OIDC token:', err);
    });
