import { fetch as undiciFetch } from 'undici';

function installFetch() {
    globalThis.fetch = undiciFetch as unknown as typeof globalThis.fetch;
}

installFetch();
beforeEach(installFetch);
