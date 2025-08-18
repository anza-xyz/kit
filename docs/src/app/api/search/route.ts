import { apiSource, docsSource } from '@/lib/source';
import { AdvancedIndex, createSearchAPI } from 'fumadocs-core/search/server';
import { LoaderConfig, LoaderOutput } from 'fumadocs-core/source';

type PageFromSource<T extends LoaderOutput<LoaderConfig>> = ReturnType<T['getPages']>[number];

function createIndexFromPage(tag: string, page: PageFromSource<typeof apiSource | typeof docsSource>): AdvancedIndex {
    return {
        title: page.data.title,
        description: page.data.description,
        url: page.url,
        id: page.url,
        structuredData: page.data.structuredData,
        tag,
    };
}

export const { GET } = createSearchAPI('advanced', {
    language: 'english',
    indexes: [
        ...apiSource.getPages().map(createIndexFromPage.bind(null, 'api')),
        ...docsSource.getPages().map(createIndexFromPage.bind(null, 'docs')),
    ],
});
