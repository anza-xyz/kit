import { api, docs } from '@/.source';
import { loader } from 'fumadocs-core/source';

export const apiSource = loader({
    baseUrl: '/api',
    source: api.toFumadocsSource(),
});

export const docsSource = loader({
    baseUrl: '/docs',
    source: docs.toFumadocsSource(),
});
